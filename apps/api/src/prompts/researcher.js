/**
 * Build the researcher prompt for the content strategy AI agent.
 * @param {object} brief - ContentStrategyBrief instance (plain object or Sequelize model)
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
function buildResearcherPrompt(brief) {
  const systemPrompt = `You are an expert B2B SaaS content strategist with deep experience in inbound marketing, SEO, and thought leadership. You help companies grow through strategic, high-quality content. You always write and think in en-US English. Your job is to research a company's market position and generate a prioritized content roadmap of topics that will drive qualified traffic, generate leads, and build brand authority.`;

  const userPrompt = `You are researching content opportunities for the following company. Based on the details below, generate a content roadmap of 15 topics that will best serve their business goals.

**Company:** ${brief.companyName}
**Product / Service:** ${brief.productDescription}
**Industry:** ${brief.industry}
**Target Audience (ICP):** ${brief.targetAudience}
**Pain Points:** ${brief.painPoints}
${brief.competitors ? `**Competitors:** ${brief.competitors}` : ''}
${brief.differentiators ? `**Differentiators:** ${brief.differentiators}` : ''}
${brief.conversionGoal ? `**Conversion Goal:** ${brief.conversionGoal}` : ''}
${brief.contentGoals ? `**Content Goals:** ${brief.contentGoals}` : ''}
${brief.contentFormats ? `**Preferred Content Formats:** ${brief.contentFormats}` : ''}
**Tone of Voice:** ${brief.toneOfVoice}

Return ONLY a valid JSON array (no markdown, no code fences, no commentary) with exactly 15 objects. Each object must have the following fields:
- "title": string — compelling article title
- "angle": string — unique angle or hook for this piece
- "targetKeyword": string — primary SEO keyword to target
- "contentFormat": string — e.g. "How-to Guide", "Listicle", "Comparison", "Case Study", "Thought Leadership"
- "priority": number — 1 (highest) to 15 (lowest)
- "outline": array of strings — 4–6 H2 section headings for the article

Order by priority (1 first). Return only the JSON array, nothing else.`;

  return { systemPrompt, userPrompt };
}

module.exports = { buildResearcherPrompt };
