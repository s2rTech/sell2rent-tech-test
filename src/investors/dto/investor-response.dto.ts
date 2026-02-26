import { ApiProperty } from '@nestjs/swagger';

export class InvestorResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 150000 })
  minPrice: number;

  @ApiProperty({ example: 300000 })
  maxPrice: number;

  @ApiProperty({ example: 'Houston' })
  preferredCity: string;

  @ApiProperty({ example: 3 })
  minBedrooms: number;

  @ApiProperty({ example: 1200 })
  minSquareFeet: number;

  @ApiProperty()
  createdAt: Date;
}
