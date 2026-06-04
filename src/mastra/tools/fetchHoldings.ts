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

export const fetchHoldings = createTool({
    id: 'FetchHoldings',
    description: 'Fetches the user\'s current investment holdings (mutual funds, stocks). Use this when the user asks about their portfolio, investments, or how many units of a fund they own.',
    inputSchema: z.object({
        fundName: z.string().optional().describe('Filter by the name of the fund, e.g., Nifty, Bluechip, or leave blank to get all holdings.')
    }),
    execute: async (args) => {
        console.log('\n[TOOL] Tara triggered the fetchHoldings tool!');
        console.log('[TOOL] AI Search Parameters:', args);

        const params = args.data || args.context || args || {};
        const { fundName } = params;

        const client = await getDbClient();

        try {
            let query = 'SELECT * FROM holdings WHERE 1=1';
            const values: any[] = [];
            let paramIndex = 1;

            if (fundName) {
                query += ` AND fund_name ILIKE $${paramIndex}`;
                values.push(`%${fundName}%`);
                paramIndex++;
            }

            console.log(`[TOOL] Running SQL:`, query, values);

            const result = await client.query(query, values);

            console.log(`[TOOL] Found ${result.rows.length} holdings.\n`);
            return result.rows;

        } catch (error) {
            console.error('[TOOL] Database error:', error);
            return { error: 'Failed to fetch holdings from the database.' };
        } finally {
            await client.end();
        }
    }
});