const Groq = require('groq-sdk');

class OrderAssistant {
    constructor() {
        console.log('Initializing Groq with key:', process.env.GROQ_API_KEY ? 'Key found' : 'NO KEY FOUND!');
        
        if (!process.env.GROQ_API_KEY) {
            console.error('GROQ_API_KEY is missing!');
            this.groq = null;
            return;
        }

        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });
        
        // Store conversation history for each user
        this.conversations = new Map();
    }

    async processMessage(senderId, message, businessContext = {}) {
        try {
            // Check if Groq is initialized
            if (!this.groq) {
                throw new Error('Groq not initialized - missing API key');
            }

            // Get or create conversation history
            if (!this.conversations.has(senderId)) {
                this.conversations.set(senderId, []);
            }
            
            const history = this.conversations.get(senderId);
            
            // Add user message to history
            history.push({
                role: 'user',
                content: message
            });

            // Create system prompt based on business type
            const systemPrompt = this.createSystemPrompt(businessContext);
            
            // Create messages array for Groq
            const messages = [
                { role: 'system', content: systemPrompt },
                ...history.slice(-10) // Keep last 10 messages for context
            ];

            console.log('Sending request to Groq...');

            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: messages,
                temperature: 0.7,
                max_tokens: 500,
                top_p: 1,
                stream: false, // We'll use non-streaming for simplicity
                stop: null,
            });

            const aiResponse = completion.choices[0].message.content;
            console.log('Groq response received:', aiResponse);
            
            // Add AI response to history
            history.push({
                role: 'assistant',
                content: aiResponse
            });

            // Check if this looks like a complete order
            const orderData = this.extractOrderData(aiResponse, history);
            
            return {
                response: aiResponse,
                orderData: orderData,
                isOrderComplete: orderData !== null
            };

        } catch (error) {
            console.error('Groq AI Error:', error);
            
            // More specific error messages
            if (error.status === 401) {
                return {
                    response: "Configuration error: Invalid API key. Please contact support.",
                    orderData: null,
                    isOrderComplete: false
                };
            } else if (error.status === 429) {
                return {
                    response: "I'm currently at capacity. Please try again in a few minutes.",
                    orderData: null,
                    isOrderComplete: false
                };
            } else {
                return {
                    response: `I'm experiencing technical difficulties: ${error.message}. Please try again or contact us directly.`,
                    orderData: null,
                    isOrderComplete: false
                };
            }
        }
    }

    createSystemPrompt(businessContext) {
        const businessName = businessContext.name || "Our Business";
        const businessType = businessContext.type || "restaurant";
        
        return `You are a helpful customer service assistant for ${businessName}, a ${businessType}.

Your job is to:
1. Greet customers warmly and professionally
2. Help them understand our products/services
3. Take their complete orders with all necessary details
4. Collect required information: customer name, phone number, order details, delivery address (if needed)
5. Calculate totals when possible
6. Confirm orders before finalizing

IMPORTANT RULES:
- Always be polite, helpful, and professional
- Ask for missing information one piece at a time
- When you have a complete order, end your response with: "ORDER_COMPLETE_JSON:" followed by a JSON object
- The JSON should include: name, phone, items, total, address, notes

Example of complete order response:
"Perfect! I have your order ready. Total is $25.50. We'll prepare this right away!

ORDER_COMPLETE_JSON: {
  "name": "John Smith",
  "phone": "555-0123", 
  "items": "2x Large Pizza, 1x Coke",
  "total": "$25.50",
  "address": "123 Main St",
  "notes": "Extra cheese"
}"

Keep responses conversational and under 200 words.`;
    }

    extractOrderData(aiResponse, conversationHistory) {
        try {
            // Look for ORDER_COMPLETE_JSON in the AI response
            const orderMatch = aiResponse.match(/ORDER_COMPLETE_JSON:\s*({.*})/s);
            
            if (orderMatch) {
                const orderJson = JSON.parse(orderMatch[1]);
                
                // Add timestamp
                orderJson.timestamp = new Date().toISOString();
                orderJson.status = 'New Order';
                
                return orderJson;
            }
            
            return null;
        } catch (error) {
            console.error('Error extracting order data:', error);
            return null;
        }
    }

    clearConversation(senderId) {
        this.conversations.delete(senderId);
    }
}

module.exports = OrderAssistant;