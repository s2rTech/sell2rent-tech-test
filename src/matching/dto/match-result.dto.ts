import { ApiProperty } from '@nestjs/swagger';

export class MatchedPropertyDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'P0001' })
  externalId: string;

  @ApiProperty({ example: 'Houston' })
  city: string;

  @ApiProperty({ example: 'TX' })
  state: string;

  @ApiProperty({ example: 210000 })
  price: number;

  @ApiProperty({ example: 3 })
  bedrooms: number;

  @ApiProperty({ example: 2 })
  bathrooms: number;

  @ApiProperty({ example: 1650 })
  squareFeet: number;

  @ApiProperty({ example: 5000 })
  lotSize: number;

  @ApiProperty({
    example: 95,
    description: 'Match score out of 100 (city:40 + price:30 + bedrooms:15 + sqft:10 + proximity:5)',
  })
  score: number;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 87, description: 'Total matching properties' })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class MatchResultDto {
  @ApiProperty({ type: [MatchedPropertyDto] })
  data: MatchedPropertyDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
