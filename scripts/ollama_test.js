/**
 * Ollama Client for TrueNAS Scale
 * Usage: node scripts/ollama_test.js
 */

class OllamaClient {
    constructor(baseUrl = 'http://192.168.1.4:11434') {
        this.baseUrl = baseUrl;
    }

    /**
     * List all available models on the Ollama server
     */
    async listModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);

            const data = await response.json();
            return data.models || [];
        } catch (error) {
            console.error('Error listing models:', error.message);
            return [];
        }
    }

    /**
     * Chat with a specific model
     * @param {string} model - Model name (e.g., 'llama3', 'mistral')
     * @param {string} prompt - User message
     * @param {boolean} stream - Whether to stream the response (default false for simplicity)
     */
    async chat(model, prompt, stream = false) {
        try {
            // 1. Generate request payload
            const payload = {
                model: model,
                messages: [{ role: 'user', content: prompt }],
                stream: stream
            };

            // 2. Send request
            console.log(`🤖 Sending to ${model} at ${this.baseUrl}...`);
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`Chat failed: ${response.statusText}`);

            // 3. Handle response
            const data = await response.json();
            return data.message.content;

        } catch (error) {
            console.error('Chat error:', error.message);
            return null;
        }
    }
}

// --- Usage Example ---
(async () => {
    // 1. Initialize Client
    // Ensure you use http:// and the correct port (usually 11434 for Ollama)
    const client = new OllamaClient('http://192.168.1.4:11434');

    console.log('🔍 Connecting to Ollama on TrueNAS...');

    // 2. Fetch Models
    const models = await client.listModels();

    if (models.length === 0) {
        console.log('❌ No models found or could not connect.');
        console.log('👉 Tip: Check if the URL is accessible from your browser.');
        return;
    }

    console.log(`✅ Found ${models.length} models:`, models.map(m => m.name).join(', '));

    // 3. Pick a model (defaulting to the first one found, or 'llama3')
    const targetModel = models.find(m => m.name.includes('llama3'))?.name || models[0].name;

    console.log(`\n💬 Testing chat with model: ${targetModel}`);
    const reply = await client.chat(targetModel, "Explain mutual funds in one sentence for a beginner.");

    console.log('\n🤖 AI Response:');
    console.log('---------------------------------------------------');
    console.log(reply);
    console.log('---------------------------------------------------');

})();
