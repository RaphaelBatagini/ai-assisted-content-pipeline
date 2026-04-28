/**
 * Build the writer prompt for the content writer AI agent.
 * @param {object} topic - Topic object from the researcher roadmap
 * @param {object} brief - ContentStrategyBrief instance (plain object or Sequelize model)
 * @param {string} siteName - Name of the site / blog
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
function buildWriterPrompt(topic, brief, siteName) {
  const systemPrompt = `You are an expert B2B SaaS content writer who produces high-quality, SEO-optimized blog posts in en-US English. Your writing style is ${brief.toneOfVoice}. You write clear, authoritative, and engaging content that helps readers solve real problems. You always return well-structured HTML content using h2, h3, p, ul, and li tags — never markdown.`;

  const outline = Array.isArray(topic.outline) ? topic.outline.join('\n- ') : topic.outline;

  const userPrompt = `Write a complete, publish-ready blog post for the site "${siteName}" based on the following brief and topic.

**Topic Title:** ${topic.title}
**Angle:** ${topic.angle}
**Target Keyword:** ${topic.targetKeyword}
**Content Format:** ${topic.contentFormat}
**Outline (H2 sections):**
- ${outline}

**Company Context:**
- Company: ${brief.companyName}
- Product: ${brief.productDescription}
- Industry: ${brief.industry}
- Target Audience: ${brief.targetAudience}
- Pain Points: ${brief.painPoints}
${brief.differentiators ? `- Differentiators: ${brief.differentiators}` : ''}
${brief.conversionGoal ? `- Conversion Goal: ${brief.conversionGoal}` : ''}

Return ONLY a valid JSON object (no markdown, no code fences, no commentary) with the following fields:
- "title": string — final article title (can refine from topic title)
- "slug": string — URL-friendly slug (lowercase, hyphens, no special chars)
- "excerpt": string — compelling summary, max 150 characters
- "content": string — full article as rich HTML (use h2, h3, p, ul, li tags; no markdown)
- "seoTitle": string — SEO meta title optimized for the target keyword
- "seoDescription": string — SEO meta description, max 160 characters
- "readingTimeMinutes": number — estimated reading time in minutes

Return only the JSON object, nothing else.`;

  return { systemPrompt, userPrompt };
}

module.exports = { buildWriterPrompt };
