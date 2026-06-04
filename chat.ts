import 'dotenv/config';
import { taraAgent } from './src/mastra/agents/tara';
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("=================================================");
console.log("  Welcome to Tara - Your AI Finance Assistant    ");
console.log("=================================================\n");
console.log("Type 'exit' or 'quit' to close the chat.\n");

// 🧠 This array is Tara's short-term memory
const chatHistory: any[] = [];

function askQuestion() {
    rl.question('You: ', async (input) => {
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
            console.log('Tara: Goodbye! Have a great day.');
            rl.close();
            process.exit(0);
        }

        try {
            process.stdout.write('Tara is thinking...');

            // 1. Add your new question to the memory log
            chatHistory.push({ role: 'user', content: input });

            // 2. Pass the ENTIRE memory log to Tara, not just the single question
            const response = await taraAgent.generate(chatHistory);

            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            console.log(`Tara: ${response.text}\n`);

            // 3. Add Tara's response to the memory log so she remembers her own answers
            chatHistory.push({ role: 'assistant', content: response.text });

        } catch (error) {
            console.error('\nError connecting to Tara:', error);
            // If something breaks, pop the last question off so it doesn't corrupt the history
            chatHistory.pop();
        }

        askQuestion();
    });
}

askQuestion();