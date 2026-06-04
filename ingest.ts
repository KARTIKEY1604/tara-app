import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

// Configure the database connection
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'provue_tara',
    password: 'KARTIKEY', // Updated password!
    port: 5432,
});

async function ingestData(sampleFolder: string) {
    try {
        await client.connect();
        console.log(`Connected to database. Reading data from ${sampleFolder}...`);

        // Define the path to the specific sample folder
        const dataDir = path.join(process.cwd(), 'data', sampleFolder);

        // 1. Ingest Funds and their NAV History
        const fundsRaw = fs.readFileSync(path.join(dataDir, 'funds.json'), 'utf-8');
        const fundsData = JSON.parse(fundsRaw);

        for (const fund of fundsData) {
            await client.query(
                `INSERT INTO funds (id, name, category) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
                [fund.id, fund.name, fund.category]
            );

            for (const navPoint of fund.nav) {
                await client.query(
                    `INSERT INTO fund_nav_history (fund_id, date, nav) VALUES ($1, $2, $3) ON CONFLICT (fund_id, date) DO NOTHING`,
                    [fund.id, navPoint.date, navPoint.value]
                );
            }
        }
        console.log('Funds & NAV history successfully loaded.');

        // 2. Ingest Transactions
        const txRaw = fs.readFileSync(path.join(dataDir, 'transactions.json'), 'utf-8');
        const txData = JSON.parse(txRaw);

        for (const tx of txData) {
            await client.query(
                `INSERT INTO transactions (id, date, merchant, category, amount, currency, memo)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
                [tx.id, tx.date, tx.merchant, tx.category, tx.amount, tx.currency, tx.memo]
            );
        }
        console.log('Transactions successfully loaded.');

        // 3. Ingest Holdings
        const holdingsRaw = fs.readFileSync(path.join(dataDir, 'holdings.json'), 'utf-8');
        const holdingsData = JSON.parse(holdingsRaw);

        await client.query(`TRUNCATE holdings`);

        for (const h of holdingsData) {
            await client.query(
                `INSERT INTO holdings (fund_id, fund_name, units, purchase_date, purchase_nav)
         VALUES ($1, $2, $3, $4, $5)`,
                [h.fund_id, h.fund_name, h.units, h.purchase_date, h.purchase_nav]
            );
        }
        console.log(' Holdings successfully loaded.');

        console.log('🎉 All data ingestion complete!');
    } catch (error) {
        console.error('Error during data ingestion:', error);
    } finally {
        await client.end();
    }
}

// We will start by loading 'sample_a'
ingestData('sample_a');