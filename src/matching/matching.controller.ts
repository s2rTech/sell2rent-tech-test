import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MatchQueryDto } from './dto/match-query.dto';
import { MatchResultDto } from './dto/match-result.dto';
import { MatchingService } from './matching.service';

// Mounted on 'investors' so the route reads GET /investors/:id/matches.
// Lives in MatchingModule (not InvestorsModule) to keep scoring logic isolated.
@ApiTags('investors')
@Controller('investors')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get(':id/matches')
  @ApiOperation({
    summary: 'Get scored property matches for an investor',
    description:
      'Returns properties ranked by match score (max 100). Scoring: city=40, price range=30, bedrooms=15, sq ft=10, proximity bonus=5. Computed entirely in PostgreSQL.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Investor ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of matching properties with scores',
    type: MatchResultDto,
  })
  @ApiResponse({ status: 404, description: 'Investor not found' })
  async getMatches(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: MatchQueryDto,
  ): Promise<MatchResultDto> {
    return this.matchingService.getMatches(id, query);
  }
}
