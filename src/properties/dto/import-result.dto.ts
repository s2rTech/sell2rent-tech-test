import { ApiProperty } from '@nestjs/swagger';

export class ImportErrorDto {
  @ApiProperty({ example: 'P0001' })
  externalId: string;

  @ApiProperty({ example: 'Missing or invalid price' })
  reason: string;
}

export class ImportResultDto {
  @ApiProperty({ example: 298, description: 'Number of records inserted' })
  imported: number;

  @ApiProperty({ example: 2, description: 'Number of duplicate records skipped' })
  skipped: number;

  @ApiProperty({ type: [ImportErrorDto], description: 'Records that failed validation' })
  errors: ImportErrorDto[];
}
