import logger from './logger.service.js';

/**
 * AI Configuration - Read from environment variables
 */
const AI_CONFIG = {
    endpoint: process.env.OLLAMA_ENDPOINT || 'http://192.168.1.4:11434',
    model: process.env.OLLAMA_MODEL_NAME || 'qwen2.5:0.5b',
    systemPrompt: process.env.AI_SYSTEM_PROMPT || `You are a specialized AI Mutual Fund Manager for Indian investors. \
STRICT TOPIC RESTRICTION: You must ONLY answer questions related to: \
1. Mutual Funds (Equity, Debt, Hybrid, etc.) \
2. Investment Strategies (SIP, SWP, STP, Lump Sum) \
3. Stock Market concepts (Sensex, Nifty, NAV, Returns) \
4. Portfolio Management principles. \
\
If a user asks about ANY other topic (politics, sports, coding, general knowledge, etc.), you must politely refuse by saying: "I am an AI specialized only in Mutual Funds and Investing. I cannot answer questions outside this domain." \
\
GUIDELINES: \
- Explain concepts simply (beginner-friendly). \
- Use Indian examples and Currency (₹). \
- Never recommend specific funds (e.g., "Buy HDFC Balanced Advantage"). \
- Always advise consulting a certified SEBI registered distributor/advisor. \
- Be concise and professional.`
};

/**
 * Service to interact with a remote Ollama instance
 */
class OllamaService {
    constructor() {
        this.baseUrl = AI_CONFIG.endpoint;
        this.model = AI_CONFIG.model;
        this.systemPrompt = AI_CONFIG.systemPrompt;
    }

    /**
     * Check if the Ollama server is reachable
     * @returns {Promise<boolean>}
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch (error) {
            logger.error(`[Ollama] Connection Check Failed: ${error.message}`);
            return false;
        }
    }

    /**
     * List all available models
     * @returns {Promise<Array>} List of model objects
     */
    async listModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.statusText}`);
            }
            const data = await response.json();
            return data.models || [];
        } catch (error) {
            logger.error(`[Ollama] Error listing models: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generate a chat completion with system prompt
     * @param {string} userMessage - User input
     * @param {Array} conversationHistory - Previous messages (optional)
     * @returns {Promise<string>} The AI response text
     */
    async chat(userMessage, conversationHistory = []) {
        try {
            // Build messages array with system prompt
            const messages = [
                { role: 'system', content: this.systemPrompt },
                ...conversationHistory,
                { role: 'user', content: userMessage }
            ];

            const payload = {
                model: this.model,
                messages: messages,
                stream: false
            };

            logger.info(`[Ollama] Chat request [Model: ${this.model}]`);

            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Ollama API Error: ${response.statusText}`);
            }

            const data = await response.json();
            logger.info(`[Ollama] Response received successfully`);
            return data.message.content;

        } catch (error) {
            logger.error(`[Ollama] Chat Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get current configuration (for debugging/admin)
     */
    getConfig() {
        return {
            endpoint: this.baseUrl,
            model: this.model,
            systemPromptLength: this.systemPrompt.length
        };
    }
}

// Export singleton instance
export const ollamaService = new OllamaService();
export { OllamaService };
