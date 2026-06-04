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

export const fetchNavHistory = createTool({
    id: 'FetchNavHistory',
    description: 'Fetches the historical NAV (Net Asset Value) prices for mutual funds. Use this to calculate a fund\'s period return or the user\'s realized return on a holding by comparing the current NAV to their purchase NAV.',
    inputSchema: z.object({
        fundName: z.string().describe('The name of the fund to look up.')
    }),
    execute: async (args) => {
        console.log('\n[TOOL] Tara triggered the fetchNavHistory tool!');
        console.log('[TOOL] AI Search Parameters:', args);

        const params = args.data || args.context || args || {};
        const { fundName } = params;

        const client = await getDbClient();

        try {
            // Note: If you named your tables differently in Phase 1, adjust the names here!
            const query = `
        SELECT f.name as fund_name, n.date, n.nav 
        FROM funds f
        JOIN fund_nav_history n ON f.id = n.fund_id
        WHERE f.name ILIKE $1
        ORDER BY n.date DESC
      `;
            const values = [`%${fundName}%`];

            console.log(`[TOOL] Running SQL:`, query, values);

            const result = await client.query(query, values);

            console.log(`[TOOL] Found ${result.rows.length} NAV records.\n`);
            return result.rows;

        } catch (error) {
            console.error('[TOOL] Database error:', error);
            return { error: 'Failed to fetch NAV history from the database.' };
        } finally {
            await client.end();
        }
    }
});