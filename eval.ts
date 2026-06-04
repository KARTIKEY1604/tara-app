import 'dotenv/config';

const testCases = [
    {
        category: "Single lookup",
        question: "How much did I spend on Starbucks in total?",
        expectedKeywords: ["Starbucks"]
    },
    {
        category: "Date filtering",
        question: "How much did I spend on food in March 2024?",
        expectedKeywords: ["March", "2024"]
    },
    {
        category: "Refunds",
        question: "Did I get any refunds from Swiggy, and if so, how much?",
        expectedKeywords: ["refund", "Swiggy"]
    },
    {
        category: "Merchant aliases",
        question: "How much did I spend on Swiggy, including Instamart and Bangalore orders?",
        expectedKeywords: ["Swiggy", "Instamart"]
    },
    {
        category: "Transfers",
        question: "How much money did I transfer to my own accounts?",
        expectedKeywords: ["transfer"]
    },
    {
        category: "Category comparison",
        question: "Did I spend more on food or travel?",
        expectedKeywords: ["food", "travel"]
    },
    {
        category: "Recurring subscriptions",
        question: "Which of my transactions look like recurring monthly subscriptions?",
        expectedKeywords: ["recurring", "subscription"]
    },
    {
        category: "No-data cases",
        question: "How much did I spend on buying a Ferrari?",
        expectedKeywords: ["no", "Ferrari", "didn't", "zero"]
    },
    {
        category: "Fund period returns",
        question: "What was the period return for the Saffron Bluechip Equity Fund?",
        expectedKeywords: ["Saffron", "Bluechip", "return"]
    },
    {
        category: "Realized returns on holdings",
        question: "What is my realized return on the Kestrel Emerging Growth Fund based on my purchase price?",
        expectedKeywords: ["Kestrel", "Emerging", "realized", "return"]
    },
    {
        category: "Portfolio aggregate",
        question: "What is my total portfolio worth today?",
        expectedKeywords: ["portfolio", "worth", "total"]
    },
    {
        category: "Multi-step reasoning",
        question: "What was my single biggest expense?",
        expectedKeywords: ["biggest", "expense"]
    }
];

// Helper function to pause execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runEvals() {
    console.log("=================================================");
    console.log("  Running Tara API Evals...");
    console.log("=================================================\n");

    let passed = 0;
    let failed = 0;
    const failedCases: any[] = [];

    for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];
        process.stdout.write(`Test ${i + 1}/12 [${test.category}]... `);

        try {
            const response = await fetch('http://localhost:3000/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: test.question })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const answer = (data.answer || "").toLowerCase();

            const hasExpectedFacts = test.expectedKeywords.some(keyword =>
                answer.includes(keyword.toLowerCase())
            );

            if (hasExpectedFacts) {
                console.log(" PASS");
                passed++;
            } else {
                console.log(" FAIL (Missing expected facts)");
                failed++;
                failedCases.push({
                    category: test.category,
                    question: test.question,
                    answerReceived: data.answer,
                    expectedKeywords: test.expectedKeywords
                });
            }

        } catch (error: any) {
            console.log(` FAIL (Error: ${error.message})`);
            failed++;
            failedCases.push({
                category: test.category,
                question: test.question,
                error: error.message
            });
        }

        // 🛑 Pause for 20 seconds to respect Google's free-tier rate limits
        if (i < testCases.length - 1) {
            await sleep(20000);
        }
    }

    console.log("\n=================================================");
    console.log("  Eval Summary");
    console.log("=================================================");
    console.log(`Total Passed: ${passed}`);
    console.log(`Total Failed: ${failed}`);

    if (failed > 0) {
        console.log("\nFailed Cases:");
        failedCases.forEach(fc => {
            console.log(`\n- [${fc.category}]`);
            console.log(`  Q: ${fc.question}`);
            if (fc.error) console.log(`  Error: ${fc.error}`);
            if (fc.answerReceived) console.log(`  Tara answered: "${fc.answerReceived}"`);
        });
    }
    console.log("=================================================\n");
}

runEvals();