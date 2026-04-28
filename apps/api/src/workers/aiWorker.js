require('dotenv').config();

// Load models (needs DB connection)
require('../models');
const { ContentStrategyBrief, Site, Post, sequelize } = require('../models');

const { aiQueue } = require('../services/aiQueue');
const { createAIProvider } = require('../services/ai');
const { buildResearcherPrompt } = require('../prompts/researcher');
const { buildWriterPrompt } = require('../prompts/writer');

const POSTS_TO_GENERATE = parseInt(process.env.POSTS_TO_GENERATE || '5', 10);
const AI_JOB_CONCURRENCY = parseInt(process.env.AI_JOB_CONCURRENCY || '2', 10);

/**
 * Extract a JSON value from a string that may contain surrounding text or code fences.
 */
function extractJSON(text) {
  // Strip markdown code fences if present
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  // Find first [ or { and last ] or }
  const firstBracket = stripped.search(/[\[{]/);
  const lastBracket = Math.max(stripped.lastIndexOf(']'), stripped.lastIndexOf('}'));
  if (firstBracket === -1 || lastBracket === -1) throw new Error('No JSON found in AI response');
  return JSON.parse(stripped.slice(firstBracket, lastBracket + 1));
}

async function handleResearch(job) {
  const { briefId, siteId } = job.data;
  console.log(`[aiWorker] Starting research job for brief ${briefId}`);

  const brief = await ContentStrategyBrief.findByPk(briefId, { include: [{ model: Site }] });
  if (!brief) throw new Error(`ContentStrategyBrief not found: ${briefId}`);

  await brief.update({ status: 'researching' });

  const { systemPrompt, userPrompt } = buildResearcherPrompt(brief);
  const ai = createAIProvider();
  const responseText = await ai.generate(systemPrompt, userPrompt);

  let roadmap;
  try {
    roadmap = extractJSON(responseText);
  } catch (err) {
    throw new Error(`Failed to parse researcher JSON: ${err.message}\nRaw response: ${responseText.slice(0, 500)}`);
  }

  await brief.update({ roadmapJson: JSON.stringify(roadmap), status: 'writing' });

  const topics = roadmap.slice(0, POSTS_TO_GENERATE);
  for (const topic of topics) {
    await aiQueue.add(
      { type: 'write-post', briefId, siteId, topic },
      { jobId: `write-${briefId}-${topic.targetKeyword || Date.now()}` },
    );
  }

  console.log(`[aiWorker] Research complete for brief ${briefId}. Enqueued ${topics.length} write-post jobs.`);
}

async function handleWritePost(job) {
  const { briefId, siteId, topic } = job.data;
  console.log(`[aiWorker] Writing post "${topic.title}" for brief ${briefId}`);

  const brief = await ContentStrategyBrief.findByPk(briefId, { include: [{ model: Site }] });
  if (!brief) throw new Error(`ContentStrategyBrief not found: ${briefId}`);

  const site = brief.Site;
  const { systemPrompt, userPrompt } = buildWriterPrompt(topic, brief, site.name);
  const ai = createAIProvider();
  const responseText = await ai.generate(systemPrompt, userPrompt);

  let postData;
  try {
    postData = extractJSON(responseText);
  } catch (err) {
    throw new Error(`Failed to parse writer JSON: ${err.message}\nRaw response: ${responseText.slice(0, 500)}`);
  }

  await Post.create({
    siteId,
    authorId: site.userId,
    title: postData.title,
    slug: postData.slug,
    excerpt: postData.excerpt || null,
    content: postData.content,
    seoTitle: postData.seoTitle || null,
    seoDescription: postData.seoDescription || null,
    readingTimeMinutes: postData.readingTimeMinutes || null,
    status: 'draft',
  });

  // Atomically increment posts_generated
  await sequelize.query(
    `UPDATE content_strategy_briefs SET posts_generated = posts_generated + 1 WHERE id = :briefId`,
    { replacements: { briefId } },
  );

  // Reload to check if all posts are done
  await brief.reload();
  if (brief.postsGenerated >= POSTS_TO_GENERATE) {
    await brief.update({ status: 'ready' });
    console.log(`[aiWorker] Brief ${briefId} is ready. ${brief.postsGenerated} posts generated.`);
  }
}

aiQueue.process(AI_JOB_CONCURRENCY, async (job) => {
  const { type } = job.data;
  try {
    if (type === 'research') {
      await handleResearch(job);
    } else if (type === 'write-post') {
      await handleWritePost(job);
    } else {
      throw new Error(`Unknown job type: ${type}`);
    }
  } catch (err) {
    console.error(`[aiWorker] Job ${job.id} (${type}) failed:`, err.message);
    // On final failure, mark the brief as error
    const { briefId } = job.data;
    if (briefId && job.attemptsMade >= (job.opts.attempts || 3) - 1) {
      const userMessage =
        type === 'research'
          ? 'Failed to research content opportunities. Please try again.'
          : 'Failed to write one or more posts. Please try again.';
      try {
        await ContentStrategyBrief.update(
          { status: 'error', errorMessage: userMessage },
          { where: { id: briefId } },
        );
      } catch (updateErr) {
        console.error(`[aiWorker] Failed to update brief error status:`, updateErr.message);
      }
    }
    throw err;
  }
});

aiQueue.on('completed', (job) => {
  console.log(`[aiWorker] Job ${job.id} (${job.data.type}) completed`);
});

aiQueue.on('failed', (job, err) => {
  console.error(`[aiWorker] Job ${job.id} (${job.data.type}) failed permanently:`, err.message);
});

console.log(`[aiWorker] AI worker started (concurrency: ${AI_JOB_CONCURRENCY})`);
