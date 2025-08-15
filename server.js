// Import required packages
const express = require('express');
const axios = require('axios');
require('dotenv').config();

// Import our custom modules
const OrderAssistant = require('./ai-assistant');
const SheetsManager = require('./google-sheets');

// Create Express app and instances
const app = express();
const PORT = process.env.PORT || 3000;
const orderAssistant = new OrderAssistant();
const sheetsManager = new SheetsManager();

// Middleware to parse JSON
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.send(`
        <h1>🤖 AI Order Assistant is Running!</h1>
        <p><strong>Status:</strong> Active</p>
        <p><strong>AI:</strong> ${process.env.OPENAI_API_KEY ? '✅ Connected' : '❌ Not configured'}</p>
        <p><strong>Google Sheets:</strong> ${process.env.GOOGLE_SHEET_ID ? '✅ Connected' : '❌ Not configured'}</p>
        <p><strong>Facebook:</strong> ${process.env.PAGE_ACCESS_TOKEN ? '✅ Connected' : '❌ Not configured'}</p>
    `);
});

// Webhook verification
app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'my_secret_verify_token_12345';
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Handle incoming messages
app.post('/webhook', async (req, res) => {
    const body = req.body;
    
    if (body.object === 'page') {
        // Process each messaging event
        for (const entry of body.entry) {
            const webhook_event = entry.messaging[0];
            console.log('Received message:', webhook_event);
            
            const sender_id = webhook_event.sender.id;
            const message_text = webhook_event.message?.text;
            
            if (message_text) {
                await handleUserMessage(sender_id, message_text);
            }
        }
        
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Handle user messages with AI
async function handleUserMessage(senderId, messageText) {
    try {
        // Send typing indicator
        await sendTypingIndicator(senderId);
        
        // Process message with AI
        const businessContext = {
            name: "Demo Restaurant", // You can customize this per client
            type: "restaurant"
        };
        
        const aiResult = await orderAssistant.processMessage(senderId, messageText, businessContext);
        
        // Send AI response to user
        await sendMessage(senderId, aiResult.response);
        
        // If order is complete, save to Google Sheets
        if (aiResult.isOrderComplete && aiResult.orderData) {
            console.log('Order completed:', aiResult.orderData);
            
            // Save to Google Sheets
            const saved = await sheetsManager.addOrder(aiResult.orderData);
            
            if (saved) {
                // Send confirmation message
                await sendMessage(senderId, "✅ Perfect! Your order has been received and is being processed. You'll receive updates on your order status. Thank you!");
                
                // Optional: Clear conversation to start fresh for next order
                orderAssistant.clearConversation(senderId);
            } else {
                await sendMessage(senderId, "Your order details have been recorded. Our team will contact you shortly to confirm!");
            }
        }
        
    } catch (error) {
        console.error('Error handling message:', error);
        await sendMessage(senderId, "I apologize, but I'm experiencing technical difficulties. Please try again or contact us directly.");
    }
}

// Send typing indicator
async function sendTypingIndicator(recipient_id) {
    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
    
    try {
        await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: recipient_id },
            sender_action: "typing_on"
        });
    } catch (error) {
        console.error('Error sending typing indicator:', error);
    }
}

// Function to send messages back to Facebook
async function sendMessage(recipient_id, message_text) {
    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
    
    const request_body = {
        recipient: {
            id: recipient_id
        },
        message: {
            text: message_text
        }
    };
    
    try {
        await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, request_body);
        console.log('Message sent successfully');
    } catch (error) {
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

// Start the server
app.listen(PORT, () => {// Import required packages
const express = require('express');
const axios = require('axios');
require('dotenv').config();

// Import our custom modules
const OrderAssistant = require('./ai-assistant');
const SheetsManager = require('./google-sheets');

// Create Express app and instances
const app = express();
const PORT = process.env.PORT || 3000;
const orderAssistant = new OrderAssistant();
const sheetsManager = new SheetsManager();

// Middleware to parse JSON
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.send(`
        <h1>🤖 AI Order Assistant is Running!</h1>
        <p><strong>Status:</strong> Active</p>
        <p><strong>AI:</strong> ${process.env.GROQ_API_KEY ? '✅ Groq Connected' : '❌ Not configured'}</p>
        <p><strong>Google Sheets:</strong> ${process.env.GOOGLE_SHEET_ID ? '✅ Connected' : '❌ Not configured'}</p>
        <p><strong>Facebook:</strong> ${process.env.PAGE_ACCESS_TOKEN ? '✅ Connected' : '❌ Not configured'}</p>
    `);
});

// Webhook verification
app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'my_secret_verify_token_12345';
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Handle incoming messages
app.post('/webhook', async (req, res) => {
    const body = req.body;
    
    if (body.object === 'page') {
        // Process each messaging event
        for (const entry of body.entry) {
            const webhook_event = entry.messaging[0];
            console.log('Received message:', webhook_event);
            
            const sender_id = webhook_event.sender.id;
            const message_text = webhook_event.message?.text;
            
            if (message_text) {
                await handleUserMessage(sender_id, message_text);
            }
        }
        
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Handle user messages with AI
async function handleUserMessage(senderId, messageText) {
    try {
        // Send typing indicator
        await sendTypingIndicator(senderId);
        
        // Process message with AI
        const businessContext = {
            name: "Demo Restaurant", // You can customize this per client
            type: "restaurant"
        };
        
        const aiResult = await orderAssistant.processMessage(senderId, messageText, businessContext);
        
        // Send AI response to user
        await sendMessage(senderId, aiResult.response);
        
        // If order is complete, save to Google Sheets
        if (aiResult.isOrderComplete && aiResult.orderData) {
            console.log('Order completed:', aiResult.orderData);
            
            // Save to Google Sheets
            const saved = await sheetsManager.addOrder(aiResult.orderData);
            
            if (saved) {
                // Send confirmation message
                await sendMessage(senderId, "✅ Perfect! Your order has been received and is being processed. You'll receive updates on your order status. Thank you!");
                
                // Optional: Clear conversation to start fresh for next order
                orderAssistant.clearConversation(senderId);
            } else {
                await sendMessage(senderId, "Your order details have been recorded. Our team will contact you shortly to confirm!");
            }
        }
        
    } catch (error) {
        console.error('Error handling message:', error);
        await sendMessage(senderId, "I apologize, but I'm experiencing technical difficulties. Please try again or contact us directly.");
    }
}

// Send typing indicator
async function sendTypingIndicator(recipient_id) {
    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
    
    try {
        await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: recipient_id },
            sender_action: "typing_on"
        });
    } catch (error) {
        console.error('Error sending typing indicator:', error);
    }
}

// Function to send messages back to Facebook
async function sendMessage(recipient_id, message_text) {
    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
    
    const request_body = {
        recipient: {
            id: recipient_id
        },
        message: {
            text: message_text
        }
    };
    
    try {
        await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, request_body);
        console.log('Message sent successfully');
    } catch (error) {
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

// Start the server
app.listen(PORT, () => {
    console.log('🚀 AI Order Assistant running on port ${PORT}');
    console.log('🔧 Checking configuration...');
    console.log('Groq AI:', process.env.GROQ_API_KEY ? '✅ Connected' : '❌ Missing GROQ_API_KEY');
    console.log('Google Sheets:', process.env.GOOGLE_SHEET_ID ? '✅ Connected' : '❌ Missing GOOGLE_SHEET_ID');
    console.log('Facebook:', process.env.PAGE_ACCESS_TOKEN ? '✅ Connected' : '❌ Missing PAGE_ACCESS_TOKEN');
});
    console.log(`🚀 AI Order Assistant running on port ${PORT}`);
    console.log('🔧 Checking configuration...');
    console.log('OpenAI API:', process.env.OPENAI_API_KEY ? '✅ Connected' : '❌ Missing OPENAI_API_KEY');
    console.log('Google Sheets:', process.env.GOOGLE_SHEET_ID ? '✅ Connected' : '❌ Missing GOOGLE_SHEET_ID');
    console.log('Facebook:', process.env.PAGE_ACCESS_TOKEN ? '✅ Connected' : '❌ Missing PAGE_ACCESS_TOKEN');
});