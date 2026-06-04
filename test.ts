import 'dotenv/config';
import { taraAgent } from './src/mastra/agents/tara';

async function main() {
    console.log("Waking up Tara...");
    console.log("Asking: 'How much did I spend on food? Can you list the transactions?'\n");

    try {
        // This is where we actually send the prompt to the AI
        const response = await taraAgent.generate(
            "How much did I spend on food? Can you list the transactions?"
        );

        console.log("================ TARA'S RESPONSE ================\n");
        console.log(response.text);
        console.log("\n=================================================");

    } catch (error) {
        console.error("Oops, something went wrong:", error);
    }
}

main();