import 'dotenv/config';
import express from 'express';
import { taraAgent } from './src/mastra/agents/tara';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// The strict API contract required by Provue
app.post('/ask', async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            res.status(400).json({ error: 'Missing "question" field in request body.' });
            return;
        }

        console.log(`\n [API] Received question: "${question}"`);

        // Pass the question to Tara
        const response = await taraAgent.generate(question);

        // Return the exact JSON shape required by the grading script
        res.json({ answer: response.text });
        console.log(` [API] Answer successfully sent back to client.`);

    } catch (error) {
        console.error(' [API] Error processing request:', error);
        res.status(500).json({ error: 'Internal server error while waking up Tara.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(` Tara API is running on http://localhost:${PORT}`);
    console.log(`Endpoint ready: POST http://localhost:${PORT}/ask`);
    console.log(`=================================================\n`);
});