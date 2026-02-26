import { Injectable, NotFoundException } from '@nestjs/common';
import { Investor } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvestorDto } from './dto/create-investor.dto';

@Injectable()
export class InvestorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInvestorDto): Promise<Investor> {
    return this.prisma.investor.create({
      data: {
        name: dto.name,
        minPrice: dto.min_price,
        maxPrice: dto.max_price,
        preferredCity: dto.preferred_city,
        minBedrooms: dto.min_bedrooms,
        minSquareFeet: dto.min_square_feet,
      },
    });
  }

  async findById(id: number): Promise<Investor> {
    const investor = await this.prisma.investor.findUnique({ where: { id } });
    if (!investor) {
      throw new NotFoundException(`Investor with id ${id} not found`);
    }
    return investor;
  }
}
