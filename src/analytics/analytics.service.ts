import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CityAnalyticsDto } from './dto/city-analytics.dto';

interface RawCityRow {
  city: string;
  propertyCount: bigint;
  averagePrice: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTopCities(): Promise<CityAnalyticsDto[]> {
    // ROUND(float8, int) is not valid in Postgres; cast to numeric first
    const rows = await this.prisma.$queryRaw<RawCityRow[]>(Prisma.sql`
      SELECT
        city,
        COUNT(*)                          AS "propertyCount",
        ROUND(AVG(price)::numeric, 2)     AS "averagePrice"
      FROM properties
      GROUP BY city
      ORDER BY COUNT(*) DESC
    `);

    // $queryRaw returns integer columns as BigInt regardless of the cast in SQL
    return rows.map((row) => ({
      city: row.city,
      propertyCount: Number(row.propertyCount),
      averagePrice: Number(row.averagePrice),
    }));
  }
}
