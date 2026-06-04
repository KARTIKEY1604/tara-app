import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Client } from 'pg';

async function getDbClient() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'provue_tara',
        password: 'KARTIKEY',
        port: 5432,
    });
    await client.connect();
    return client;
}

export const fetchTransactions = createTool({
    id: 'FetchTransactions',
    description: 'Fetches financial transactions. Use this when the user asks about their spending, refunds, or transaction history. You can filter by category, merchant, or date range.',
    inputSchema: z.object({
        category: z.string().optional().describe('Filter by expense category like food, rent, shopping.'),
        merchant: z.string().optional().describe('Filter by merchant name like Swiggy, Uber.'),
        startDate: z.string().optional().describe('Start date in YYYY-MM-DD format.'),
        endDate: z.string().optional().describe('End date in YYYY-MM-DD format.')
    }),
    execute: async (args) => {
        console.log('\n[TOOL] Tara triggered the fetchTransactions tool!');
        console.log('[TOOL] AI Search Parameters:', args);

        const params = args.data || args.context || args || {};
        const { category, merchant, startDate, endDate } = params;

        const client = await getDbClient();

        try {
            let query = 'SELECT * FROM transactions WHERE 1=1';
            const values: any[] = [];
            let paramIndex = 1;

            if (category) {
                query += ` AND category ILIKE $${paramIndex}`;
                values.push(`%${category}%`);
                paramIndex++;
            }

            if (merchant) {
                query += ` AND merchant ILIKE $${paramIndex}`;
                values.push(`%${merchant}%`);
                paramIndex++;
            }

            if (startDate) {
                query += ` AND date >= $${paramIndex}`;
                values.push(startDate);
                paramIndex++;
            }

            if (endDate) {
                query += ` AND date <= $${paramIndex}`;
                values.push(endDate);
                paramIndex++;
            }

            query += ` ORDER BY date DESC`;

            console.log(`[TOOL] Running SQL:`, query, values);

            const result = await client.query(query, values);

            console.log(`[TOOL] Found ${result.rows.length} matching transactions.\n`);
            return result.rows;

        } catch (error) {
            console.error('[TOOL] Database error:', error);
            return { error: 'Failed to fetch transactions from the database.' };
        } finally {
            await client.end();
        }
    }
});