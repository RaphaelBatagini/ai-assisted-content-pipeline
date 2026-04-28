const GeminiProvider = require('./GeminiProvider');

function createAIProvider() {
  const provider = process.env.AI_PROVIDER || 'gemini';
  switch (provider) {
    case 'gemini':
      return new GeminiProvider();
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

module.exports = { createAIProvider };
