# System Design: Tara (Finance-Research Agent)

## 1. Schema Design
The data is stored in a relational PostgreSQL database to ensure strict querying and data integrity.
* **`transactions`**: Stores user spending. Columns: `id`, `date`, `merchant`, `category`, `amount`, `currency`, `memo`. Indexed on `date`, `merchant`, and `category` for fast filtering.
* **`funds`**: Stores mutual fund metadata. Columns: `id`, `name`, `category`.
* **`fund_nav_history`**: Stores historical prices. Columns: `fund_id`, `date`, `nav`. Indexed on `fund_id` and `date`.
* **`holdings`**: Stores what the user actually owns. Columns: `id`, `fund_id`, `units`, `purchase_date`, `purchase_nav`. Foreign key on `fund_id`.

## 2. Tool Design
I opted for fewer, expressive tools rather than many narrow ones to minimize token overhead and improve the LLM's routing accuracy.
1. **`fetchTransactions`**: A unified tool for all spending, refunds, and merchant queries. It accepts optional `category`, `merchant`, `startDate`, and `endDate` parameters and applies them dynamically via `ILIKE` and date boundaries.
2. **`fetchHoldings`**: Returns the user's current portfolio (units and purchase NAV).
3. **`fetchNavHistory`**: Looks up the historical/current NAV of a fund to compute returns.

## 3. Formulas & Data Handling
* **Net Spend:** Calculated by summing the `amount` of filtered transactions. Refunds (negative amounts) naturally reduce the total spend mathematically.
* **Merchant Matching:** Handled via Postgres `ILIKE '%merchant_name%'`, allowing the tool to capture aliases (e.g., a search for "Swiggy" successfully captures "SWIGGY BANGALORE" and "Swiggy Instamart").
* **Fund Period Return:** LLM fetches NAV at Date A and Date B, calculating: `End NAV - Start NAV`.
* **Realized Return (Holdings):** LLM fetches the user's holding, then fetches the current NAV, calculating: `(Current NAV - Purchase NAV) * Units`.
* **Date Boundaries:** "March" is strictly bounded from `YYYY-03-01` to `YYYY-03-31`. 

## 4. Grounding & Hallucination Prevention
Grounding is enforced via strict System Instructions. Tara is explicitly commanded to NEVER guess or invent numbers. The LLM only acts as a natural language synthesizer over the raw JSON rows returned by the Postgres tools. If a query returns 0 rows, Tara accurately reports "no data" rather than hallucinating an answer.

## 5. Evals & Observability
* **Evals:** The test suite (`eval.ts`) hits the live `POST /ask` endpoint with 12 distinct edge-case questions. It evaluates correctness by checking if the LLM's natural language response contains the required factual keywords/metrics. (Note: A 35-second delay was added between tests to respect Google's free-tier rate limits).
* **Observability:** `console.log` is used throughout the Express API and Tools. Every request logs the received question, the triggered tool, the parsed AI search parameters, the exact raw SQL executed, and the row count returned.

## 6. Tradeoffs & Future Work (Async Milestone)
* **Synchronous Tools:** I opted to run tools synchronously for this implementation rather than using background workers (like BullMQ). Since the dataset is relatively small and Postgres query latency is low, the added complexity of a job queue was not strictly necessary for this scale. 
* **Math Delegation:** Currently, the LLM handles summation over transaction rows. If scaling to thousands of rows, I would upgrade `fetchTransactions` to accept an `aggregate: true` parameter so Postgres handles the `SUM()` directly, saving LLM context window limits.