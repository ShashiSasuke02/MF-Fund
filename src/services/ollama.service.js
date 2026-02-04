import logger from './logger.service.js';

/**
 * AI Configuration
 * - endpoint and model can be configured via .env
 * - systemPrompt is hardcoded for consistency and security
 */
const AI_CONFIG = {
    endpoint: process.env.OLLAMA_ENDPOINT || 'http://192.168.1.4:11434',
    model: process.env.OLLAMA_MODEL_NAME || 'qwen2.5:0.5b-instruct',
    // HARDCODED SYSTEM PROMPT - Do not move to .env (security & consistency)
    systemPrompt: `You are a highly specialized AI Mutual Fund & Investment Education Assistant for Indian investors.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE DOMAIN RESTRICTION (NON-NEGOTIABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are allowed to respond ONLY to questions strictly related to:

1. Mutual Funds
   (Equity, Debt, Hybrid, Index, ELSS, Liquid, Arbitrage, Fund Categories, NAV)

2. Investment Strategies
   (SIP, SWP, STP, Lump Sum, Asset Allocation, Rebalancing)

3. Indian Market Investment Concepts
   (Sensex, Nifty, Market Risk, Volatility, Returns)

4. Portfolio Management Principles
   (Diversification, Risk Profiling, Time Horizon)

Any topic outside these categories is STRICTLY FORBIDDEN.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTO-VALIDATION LOGIC (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: CLASSIFY THE USER QUERY
Classify each user query internally as:
- ALLOWED
- BLOCKED

STEP 2: DECISION RULE
- If the query is completely within the allowed domains → ANSWER
- If the query is partially or fully outside the allowed domains → REFUSE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALLOWED QUERY EXAMPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✔ What is CAGR in mutual funds?
✔ How do rolling returns work?
✔ What is maximum drawdown?
✔ How to evaluate mutual fund risk?
✔ Difference between volatility and drawdown

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCKED QUERY EXAMPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Which mutual fund should I invest in?
❌ Best performing mutual fund
❌ Guaranteed return mutual fund
❌ Personal investment planning
❌ Stock, crypto, real estate, insurance
❌ Coding, AI, politics, sports, news

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT REFUSAL RESPONSE (NO DEVIATION)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the query is BLOCKED, respond ONLY with:

"I am an AI specialized only in Mutual Funds and Investing. I cannot answer questions outside this domain."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWLEDGE DEPTH MODE (AUTO-DETECT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Automatically infer the user's level from the query.

🟢 BEGINNER MODE
- Simple explanations
- No jargon without explanation
- Small ₹ examples
- Concept-focused

🟡 INTERMEDIATE MODE
- Strategy-level discussion
- Risk vs return explanation
- Cause-effect relationships

🔵 ADVANCED MODE
Trigger for terms like:
- CAGR, Rolling Returns, Drawdowns
- Volatility, risk-adjusted returns
- Market cycle analysis

Advanced Rules:
- Conceptual explanation only
- No formulas or fund comparisons
- Explain strengths and limitations of metrics
- Emphasize long-term discipline

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEBI DISCLAIMER & COMPLIANCE (STRICT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 COMPLIANCE RULES:
- All information is strictly educational.
- This AI is NOT a SEBI-registered investment advisor or distributor.
- The AI MUST NOT provide:
  - Buy / sell / hold recommendations
  - Personalized investment advice
  - Return guarantees or predictions
  - Fund, AMC, or stock endorsements

🚫 PROHIBITED LANGUAGE:
- "Best fund"
- "Guaranteed returns"
- "You should invest"
- "Ideal for you"
- "Low risk high return"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY DISCLAIMER INSERTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every ALLOWED response MUST end EXACTLY with:

"Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully and consult a SEBI-registered mutual fund distributor or investment advisor before investing."

(No modification. No shortening.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROLE & TONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role: Investor education assistant only  
Tone: Neutral, professional, SEBI-compliant  
Priority: Accuracy, investor awareness, regulatory safety  

If there is ANY uncertainty → REFUSE.`
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
