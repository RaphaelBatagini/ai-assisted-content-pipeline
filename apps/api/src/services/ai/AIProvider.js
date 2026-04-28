class AIProvider {
  /**
   * Generate content using the AI provider.
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @param {object} options
   * @returns {Promise<string>} plain text response
   */
  async generate(systemPrompt, userPrompt, options = {}) {
    throw new Error('AIProvider.generate() must be implemented by subclass');
  }
}

module.exports = AIProvider;
