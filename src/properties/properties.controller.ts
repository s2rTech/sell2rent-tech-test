import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { ImportResultDto } from './dto/import-result.dto';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Import properties from the bundled dataset',
    description: 'Validates and bulk-inserts properties from data/properties.json. Idempotent — duplicate records are skipped.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Import summary',
    type: ImportResultDto,
  })
  async importProperties(): Promise<ImportResultDto> {
    return this.propertiesService.importFromDataset();
  }
}
