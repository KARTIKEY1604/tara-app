import { Client } from 'pg';

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'provue_tara',
    password: 'KARTIKEY',
    port: 5432,
});

async function initializeDatabase() {
    try {
        await client.connect();
        console.log('Successfully connected to PostgreSQL!');

        await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        date DATE NOT NULL,
        merchant VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        memo TEXT
      );
    `);
        console.log('Transactions table ready.');

        await client.query(`
      CREATE TABLE IF NOT EXISTS funds (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL
      );
    `);
        console.log('Funds table ready.');

        await client.query(`
      CREATE TABLE IF NOT EXISTS fund_nav_history (
        id SERIAL PRIMARY KEY,
        fund_id VARCHAR(50) REFERENCES funds(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        nav DECIMAL(10, 4) NOT NULL,
        UNIQUE(fund_id, date)
      );
    `);
        console.log('Fund NAV History table ready.');

        await client.query(`
      CREATE TABLE IF NOT EXISTS holdings (
        id SERIAL PRIMARY KEY,
        fund_id VARCHAR(50) REFERENCES funds(id) ON DELETE CASCADE,
        fund_name VARCHAR(255) NOT NULL,
        units DECIMAL(12, 4) NOT NULL,
        purchase_date DATE NOT NULL,
        purchase_nav DECIMAL(10, 4) NOT NULL
      );
    `);
        console.log('Holdings table ready.');

        console.log('Database initialization complete!');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await client.end();
    }
}

initializeDatabase();