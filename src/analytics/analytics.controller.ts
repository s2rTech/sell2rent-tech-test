import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CityAnalyticsDto } from './dto/city-analytics.dto';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('top-cities')
  @ApiOperation({
    summary: 'Get cities ranked by property inventory',
    description: 'Returns all cities sorted by property count descending, with average price and total inventory.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cities ranked by inventory size',
    type: [CityAnalyticsDto],
  })
  async getTopCities(): Promise<CityAnalyticsDto[]> {
    return this.analyticsService.getTopCities();
  }
}
