# Sell2Rent - Property Lead Matching Engine

Backend service that ingests real estate inventory and matches it against investor buying criteria using a score-based ranking engine computed in PostgreSQL.

Built with Node.js, TypeScript, NestJS, Prisma, and PostgreSQL.

---

## Setup

```bash
# 1. Clone and enter
git clone <repo-url>
cd <repo-name>

# 2. Environment
cp .env.example .env

# 3. Database
docker-compose up -d

# 4. Dependencies + Prisma
npm install
npx prisma generate
npx prisma migrate dev

# 5. Run
npm run start:dev
```

Swagger UI at `http://localhost:3000/api`.

---

## Environment Variables

| Variable | Example | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://sell2rent:sell2rent_pass@localhost:5432/sell2rent?schema=public` | Postgres connection string |
| `PORT` | `3000` | HTTP server port |

---

## Usage

### 1. Import properties

```bash
curl -s -X POST http://localhost:3000/properties/import | jq .
# {"imported": 410, "skipped": 0, "errors": []}

# Re-run is safe, duplicates are skipped
curl -s -X POST http://localhost:3000/properties/import | jq .
# {"imported": 0, "skipped": 410, "errors": []}
```

### 2. Create an investor

```bash
curl -s -X POST http://localhost:3000/investors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "min_price": 150000,
    "max_price": 300000,
    "preferred_city": "Houston",
    "min_bedrooms": 3,
    "min_square_feet": 1200
  }' | jq .
```

### 3. Get scored matches

```bash
curl -s "http://localhost:3000/investors/1/matches?page=1&limit=10" | jq .
```

### 4. City analytics

```bash
curl -s http://localhost:3000/analytics/top-cities | jq .
```

---

## API Endpoints

### `POST /properties/import`

Reads `data/properties.json`, validates each record, and bulk-inserts via `INSERT ... ON CONFLICT DO NOTHING`. Safe to call multiple times.

**Response:**
```json
{
  "imported": 410,
  "skipped": 0,
  "errors": []
}
```

---

### `POST /investors`

Creates an investor with buying criteria. Includes cross-field validation (`max_price >= min_price`).

**Body:**
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

---

### `GET /investors/:id/matches?page=1&limit=20`

Returns properties ranked by match score. The scoring runs entirely inside PostgreSQL, no property records are loaded into Node memory.

**Score breakdown (max 100):**

| Criterion | Points | Condition |
|---|---|---|
| City match | 40 | `property.city = investor.preferred_city` |
| Price in range | 30 | `property.price BETWEEN min_price AND max_price` |
| Bedrooms | 15 | `property.bedrooms >= min_bedrooms` |
| Square footage | 10 | `property.square_feet >= min_square_feet` |
| Proximity bonus | 0-5 | Closer to the midpoint of the price range = higher bonus |

**Response:**
```json
{
  "data": [
    {
      "id": 7,
      "externalId": "P0042",
      "city": "Houston",
      "state": "TX",
      "price": 225000,
      "bedrooms": 4,
      "bathrooms": 2,
      "squareFeet": 1800,
      "lotSize": 5500,
      "score": 100
    }
  ],
  "meta": {
    "total": 87,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

### `GET /analytics/top-cities`

Cities ranked by property count with average price. Single `GROUP BY` query.

**Response:**
```json
[
  {
    "city": "Houston",
    "propertyCount": 42,
    "averagePrice": 261834.57
  }
]
```

---

## Design Decisions

### Why NestJS

While I have a strong background in Python/FastAPI alongside my Node.js experience, I explicitly chose NestJS for this challenge. Its strict module boundaries, decorators, and Dependency Injection natively enforce Clean Architecture. It provides a robust, enterprise-grade separation of concerns (Controllers, Services, Data Access) and strict TypeScript safety out of the box, avoiding the structural inconsistencies often seen in raw Express applications.

### Matching engine in SQL

The main design constraint was avoiding loading all properties into Node to score them. The entire formula is a single SQL `CASE WHEN` expression:

```sql
SELECT
  p.*,
  (
    CASE WHEN p.city = $city                              THEN 40 ELSE 0 END
    + CASE WHEN p.price BETWEEN $min_price AND $max_price THEN 30 ELSE 0 END
    + CASE WHEN p.bedrooms >= $min_bedrooms               THEN 15 ELSE 0 END
    + CASE WHEN p.square_feet >= $min_square_feet         THEN 10 ELSE 0 END
    + /* proximity bonus: 0–5 pts based on distance from range midpoint */
  ) AS score
FROM properties p
WHERE
  p.city = $city
  OR p.price BETWEEN $min_price AND $max_price
  OR p.bedrooms >= $min_bedrooms
  OR p.square_feet >= $min_square_feet
ORDER BY score DESC, p.price ASC
LIMIT $limit OFFSET $offset;
```

The `WHERE` clause mirrors the scoring criteria on purpose. Without it Postgres does a seq scan on the whole table since `CASE` expressions in SELECT don't give the planner any predicate to work with. The OR-expanded WHERE lets it consider the composite index instead.

The COUNT query for pagination runs in parallel via `Promise.all` because embedding `COUNT(*) OVER()` as a window function would force Postgres to materialise everything before applying LIMIT.

**Proximity bonus:** `(1 - |price - midpoint| / half_range) * 5` gives a continuous 0-5 gradient instead of binary. `NULLIF`/`COALESCE` handles the edge case where `min_price == max_price` (half-range = 0).

### Indexing

| Index | Why |
|---|---|
| `UNIQUE(external_id)` | Import idempotency |
| `(city)` | City equality in matching + `GROUP BY` in analytics |
| `(price)` | Range scan for the 30-pt scoring criterion |
| `(bedrooms)` | `>=` filter for the 15-pt criterion |
| `(square_feet)` | `>=` filter for the 10-pt criterion |
| `(city, price, bedrooms, square_feet)` | Composite for the matching query WHERE clause |

Individual indexes exist separately because analytics and single-criterion queries benefit from them independently of the composite.

### Import idempotency

`createMany({ skipDuplicates: true })` translates to `INSERT ... ON CONFLICT (external_id) DO NOTHING`. Duplicate detection lives at the DB level where it belongs. Invalid records are collected into `errors[]` and returned without blocking valid ones.

### Module boundaries

```
PrismaModule (@Global)
PropertiesModule
InvestorsModule           -> exports InvestorsService
  └─ MatchingModule       -> imports InvestorsModule, reuses findById
AnalyticsModule
```

`MatchingModule` doesn't reimplement investor lookup. It imports `InvestorsService` as the single source of truth.

### Error handling

Global exception filter produces a consistent envelope:

```json
{
  "statusCode": 404,
  "error": "NOT_FOUND",
  "message": "Investor with id 9999 not found",
  "path": "/investors/9999/matches",
  "timestamp": "2026-02-25T21:00:00.000Z"
}
```

5xx errors log with full stack trace. 4xx are expected client errors and don't pollute logs.

---

## Project Structure

```
src/
├── main.ts
├── app.module.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── properties/
│   ├── dto/import-result.dto.ts
│   ├── properties.controller.ts
│   ├── properties.service.ts
│   └── properties.module.ts
├── investors/
│   ├── dto/create-investor.dto.ts
│   ├── dto/investor-response.dto.ts
│   ├── investors.controller.ts
│   ├── investors.service.ts
│   └── investors.module.ts
├── matching/
│   ├── dto/match-query.dto.ts
│   ├── dto/match-result.dto.ts
│   ├── matching.controller.ts
│   ├── matching.service.ts
│   └── matching.module.ts
├── analytics/
│   ├── dto/city-analytics.dto.ts
│   ├── analytics.controller.ts
│   ├── analytics.service.ts
│   └── analytics.module.ts
└── common/
    └── filters/
        └── http-exception.filter.ts
```

---

## What I'd add for production

- Unit and integration tests (jest + @nestjs/testing with a test DB)
- JWT auth with role-based access
- Cursor-based pagination for deep pages (offset degrades linearly)
- Structured logging with correlation IDs (nestjs-pino)
- Health check endpoint for container orchestrators
