# AI Usage Disclosure

## Tools Used

- **GitHub Copilot** — inline autocomplete for NestJS boilerplate and decorator syntax.
- **Claude (Anthropic)** — conversational reference for PostgreSQL syntax and Prisma-specific patterns.


## Where AI Helped

While Python/FastAPI is my primary daily stack, I have prior experience with Node.js and explicitly chose NestJS for this challenge because its strict module boundaries and DI patterns align perfectly with Clean Architecture. 

Because NestJS requires significant boilerplate, I used Copilot strictly as a productivity tool to accelerate typing decorators and wiring modules. I used Claude as a rapid syntax reference for complex PostgreSQL queries and Prisma edge cases.

### NestJS boilerplate (Copilot)
- Module/controller/service skeleton scaffolding
- Accelerating `class-validator` + `class-transformer` decorator typing on DTOs
- Swagger `@ApiProperty` annotations

### PostgreSQL / Prisma (Claude)
- Recalling the exact `$queryRaw` with `Prisma.sql` tagged templates syntax
- Confirming why `ROUND(AVG(price), 2)` fails on `FLOAT8` without a `::numeric` cast
- Validating the `NULLIF`/`COALESCE` syntax pattern for guarding zero-division in the proximity bonus

---

## Prompts (high-level)

All prompts were narrow syntax recall questions to speed up development.

**NestJS:**
- "What is the exact syntax to implement a custom cross-field constraint decorator in class-validator?"
- "What's the standard pattern for a NestJS ExceptionFilter that logs 5xx with stack traces but returns a clean envelope for 4xx?"

**PostgreSQL / Prisma:**
- "How do I safely pass dynamic LIMIT/OFFSET parameters through Prisma $queryRaw?"
- "Why does ROUND(AVG(col), 2) throw an error on a FLOAT8 column in Postgres 16?"
- "What's the most efficient NULLIF + COALESCE pattern for guarding division by zero in a CASE WHEN block?"

## What I Did Without AI

Architecture and algorithm design were mine. Specifically:

- Schema design: `FLOAT8` for bathrooms, `UNIQUE(external_id)` as the idempotency key
- Composite index `(city, price, bedrooms, square_feet)` to support the matching WHERE clause
- Decision to push the entire scoring expression into SQL so zero rows are loaded into Node
- The proximity bonus formula `(1 - |price - midpoint| / half_range) * 5`
- OR-expanded WHERE clause to let Postgres use the composite index instead of a seq scan
- `createMany({ skipDuplicates: true })` for import idempotency
- Validate-then-collect error accumulation so valid records persist alongside bad neighbours
- Parallel `Promise.all` for data + count queries in pagination
- Module boundary: MatchingModule imports InvestorsService rather than re-implementing lookup

---

I confirm this document accurately reflects how AI was used in this project.

**Signature:** Hendrick Pacheco
**Date:** 2026-02-26
