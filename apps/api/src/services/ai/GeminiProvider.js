const { GoogleGenerativeAI } = require('@google/generative-ai');
const AIProvider = require('./AIProvider');

class GeminiProvider extends AIProvider {
  constructor() {
    super();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set');
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generate(systemPrompt, userPrompt, options = {}) {
    const result = await this.model.generateContent({
      systemInstruction: systemPrompt,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      ...options,
    });
    return result.response.text();
  }
}

module.exports = GeminiProvider;
