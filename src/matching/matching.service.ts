import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InvestorsService } from '../investors/investors.service';
import { PrismaService } from '../prisma/prisma.service';
import { MatchQueryDto } from './dto/match-query.dto';
import { MatchedPropertyDto, MatchResultDto } from './dto/match-result.dto';

interface RawMatchRow {
  id: bigint;
  externalId: string;
  city: string;
  state: string;
  price: number;
  bedrooms: bigint;
  bathrooms: number;
  squareFeet: bigint;
  lotSize: bigint;
  score: bigint;
}

interface RawCountRow {
  total: bigint;
}

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly investorsService: InvestorsService,
  ) {}

  async getMatches(
    investorId: number,
    query: MatchQueryDto,
  ): Promise<MatchResultDto> {
    const investor = await this.investorsService.findById(investorId);

    const { minPrice, maxPrice, preferredCity, minBedrooms, minSquareFeet } =
      investor;
    const offset = (query.page - 1) * query.limit;

    // Separate COUNT avoids materialising the full result set before LIMIT.
    // WHERE mirrors the scoring axes so the planner can use the composite index
    // (city, price, bedrooms, square_feet) instead of a seq scan on every row.
    // NULLIF guards the proximity bonus when min_price == max_price (half-range = 0).
    //
    // Score breakdown (max 100): city=40, price range=30, bedrooms=15, sqft=10, proximity=5
    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<RawMatchRow[]>(Prisma.sql`
        SELECT
          p.id,
          p.external_id   AS "externalId",
          p.city,
          p.state,
          p.price,
          p.bedrooms,
          p.bathrooms,
          p.square_feet   AS "squareFeet",
          p.lot_size      AS "lotSize",
          (
            CASE WHEN p.city = ${preferredCity}                           THEN 40 ELSE 0 END
            + CASE WHEN p.price BETWEEN ${minPrice} AND ${maxPrice}       THEN 30 ELSE 0 END
            + CASE WHEN p.bedrooms >= ${minBedrooms}                      THEN 15 ELSE 0 END
            + CASE WHEN p.square_feet >= ${minSquareFeet}                 THEN 10 ELSE 0 END
            + CASE
                WHEN p.price BETWEEN ${minPrice} AND ${maxPrice} THEN
                  GREATEST(0,
                    ROUND(
                      COALESCE(
                        (1.0 - ABS(p.price - (${minPrice} + ${maxPrice}) / 2.0)
                          / NULLIF((${maxPrice} - ${minPrice}) / 2.0, 0)
                        ) * 5,
                        5
                      )
                    )::int
                  )
                ELSE 0
              END
          ) AS score
        FROM properties p
        WHERE
          p.city = ${preferredCity}
          OR p.price BETWEEN ${minPrice} AND ${maxPrice}
          OR p.bedrooms >= ${minBedrooms}
          OR p.square_feet >= ${minSquareFeet}
        ORDER BY score DESC, p.price ASC
        LIMIT ${query.limit} OFFSET ${offset}
      `),

      this.prisma.$queryRaw<RawCountRow[]>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM properties p
        WHERE
          p.city = ${preferredCity}
          OR p.price BETWEEN ${minPrice} AND ${maxPrice}
          OR p.bedrooms >= ${minBedrooms}
          OR p.square_feet >= ${minSquareFeet}
      `),
    ]);

    const total = Number(countRows[0]?.total ?? 0);

    // $queryRaw returns INTEGER columns as BigInt; coerce everything before serialising
    const data: MatchedPropertyDto[] = rows.map((row) => ({
      id: Number(row.id),
      externalId: row.externalId,
      city: row.city,
      state: row.state,
      price: Number(row.price),
      bedrooms: Number(row.bedrooms),
      bathrooms: Number(row.bathrooms),
      squareFeet: Number(row.squareFeet),
      lotSize: Number(row.lotSize),
      score: Number(row.score),
    }));

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
