import { ApiProperty } from '@nestjs/swagger';

export class CityAnalyticsDto {
  @ApiProperty({ example: 'Houston' })
  city: string;

  @ApiProperty({ example: 42, description: 'Number of properties in this city' })
  propertyCount: number;

  @ApiProperty({ example: 245000.5, description: 'Average listing price' })
  averagePrice: number;
}
