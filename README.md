# 🏗 Sell2Rent Technical Challenge
## Property Lead Matching Engine

Hi there,

Thank you for moving forward in our process.

This challenge simulates a simplified version of a real problem we solve at Sell2Rent: matching real estate inventory with investor criteria in an efficient and scalable way.

You have **up to 72 hours** to complete this challenge.

---

# 🎯 Objective

Build a backend service that:

1. Imports property data from a provided dataset.
2. Allows creation of investors with buying criteria.
3. Matches properties to investors using a scoring system.
4. Exposes RESTful endpoints to retrieve matches and analytics.

---

# 🧱 Technical Requirements

- Node.js
- TypeScript (required)
- Express or NestJS
- PostgreSQL
- REST API design

---

# 📦 Provided Dataset

Inside the `/data` folder, you will find:

```
data/properties.json
```

This file simulates an MLS feed and contains ~300 property records.

Each record has the following structure:

```json
{
  "external_id": "P1001",
  "city": "Houston",
  "state": "TX",
  "price": 210000,
  "bedrooms": 3,
  "bathrooms": 2,
  "square_feet": 1650,
  "lot_size": 5000
}
```

---

# 1️⃣ Property Import

Create an endpoint:

POST /properties/import

Requirements:

- Read the provided JSON dataset.
- Persist properties into PostgreSQL.
- Use `external_id` as a unique constraint.
- Prevent duplicate inserts.
- Handle malformed records gracefully.
- Add appropriate database indexes.

---

# 2️⃣ Investor Creation

Create:

POST /investors

Example body:

```json
{
  "name": "John Doe",
  "min_price": 150000,
  "max_price": 300000,
  "preferred_city": "Houston",
  "min_bedrooms": 3,
  "min_square_feet": 1200
}
```

Requirements:

- Validate inputs.
- Store investor preferences.
- Design a relational schema with appropriate constraints.

---

# 3️⃣ Matching Engine

Create:

GET /investors/:id/matches

Matching Rules:

- City match → 40 points
- Price within range → 30 points
- Bedrooms match → 15 points
- Square footage match → 10 points
- Price proximity bonus → up to 5 points

Requirements:

- Results sorted by score (descending)
- Implement pagination
- Avoid loading unnecessary records in memory
- Use efficient SQL queries
- Consider indexing strategy

---

# 4️⃣ Analytics

Create:

GET /analytics/top-cities

Should return:

- Cities ranked by number of properties
- Average price per city
- Total inventory count per city

Use SQL aggregation queries.

---

# 🧠 What We Are Evaluating

We will assess:

- Code structure and modularity
- Separation of concerns
- Database schema design
- Indexing decisions
- TypeScript usage (avoid `any`)
- Error handling
- Query efficiency
- Readability
- Documentation quality

---

# 📋 Deliverables

Please provide:

- A GitHub repository (public or shared access)
- A clear README with:
  - Setup instructions
  - Environment variables
  - How to run locally
  - Database setup
  - Design decisions
- The required `ai.md` file (see AI policy)

---

# ⏱ Timeframe

You may take up to 72 hours from when you receive this challenge.

We value clarity, thoughtful design, and pragmatic engineering decisions over perfection.

If you have questions, feel free to reach out.

— Sell2Rent Tech Team