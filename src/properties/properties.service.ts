import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ImportErrorDto, ImportResultDto } from './dto/import-result.dto';

interface RawProperty {
  external_id: unknown;
  city: unknown;
  state: unknown;
  price: unknown;
  bedrooms: unknown;
  bathrooms: unknown;
  square_feet: unknown;
  lot_size: unknown;
}

interface ValidProperty {
  externalId: string;
  city: string;
  state: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize: number;
}

type ValidationResult =
  | { isValid: true; property: ValidProperty }
  | { isValid: false; reason: string };

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importFromDataset(): Promise<ImportResultDto> {
    const dataPath = path.join(process.cwd(), 'data', 'properties.json');

    let rawData: unknown[];
    try {
      const fileContent = await fs.readFile(dataPath, 'utf-8');
      rawData = JSON.parse(fileContent) as unknown[];
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to read properties dataset: ${(err as Error).message}`,
      );
    }

    if (!Array.isArray(rawData)) {
      throw new InternalServerErrorException('Dataset must be a JSON array');
    }

    const valid: ValidProperty[] = [];
    const errors: ImportErrorDto[] = [];

    for (const record of rawData) {
      const raw = record as RawProperty;
      const result = this.validateRecord(raw);

      if (result.isValid) {
        valid.push(result.property);
      } else {
        errors.push({
          externalId:
            typeof raw.external_id === 'string' ? raw.external_id : 'UNKNOWN',
          reason: result.reason,
        });
      }
    }

    // skipDuplicates makes re-runs safe without needing a prior truncate
    const { count } = await this.prisma.property.createMany({
      data: valid,
      skipDuplicates: true,
    });

    const skipped = valid.length - count;

    this.logger.log(
      `Import done: ${count} inserted, ${skipped} skipped, ${errors.length} invalid`,
    );

    return { imported: count, skipped, errors };
  }

  private validateRecord(raw: RawProperty): ValidationResult {
    if (typeof raw.external_id !== 'string' || raw.external_id.trim() === '') {
      return { isValid: false, reason: 'Missing or invalid external_id' };
    }
    if (typeof raw.city !== 'string' || raw.city.trim() === '') {
      return { isValid: false, reason: 'Missing or invalid city' };
    }
    if (typeof raw.state !== 'string' || raw.state.trim() === '') {
      return { isValid: false, reason: 'Missing or invalid state' };
    }
    if (typeof raw.price !== 'number' || raw.price <= 0 || !isFinite(raw.price)) {
      return { isValid: false, reason: 'Missing or invalid price' };
    }
    if (
      typeof raw.bedrooms !== 'number' ||
      raw.bedrooms < 0 ||
      !Number.isInteger(raw.bedrooms)
    ) {
      return { isValid: false, reason: 'Missing or invalid bedrooms' };
    }
    if (typeof raw.bathrooms !== 'number' || raw.bathrooms < 0 || !isFinite(raw.bathrooms)) {
      return { isValid: false, reason: 'Missing or invalid bathrooms' };
    }
    if (
      typeof raw.square_feet !== 'number' ||
      raw.square_feet <= 0 ||
      !Number.isInteger(raw.square_feet)
    ) {
      return { isValid: false, reason: 'Missing or invalid square_feet' };
    }
    if (
      typeof raw.lot_size !== 'number' ||
      raw.lot_size < 0 ||
      !Number.isInteger(raw.lot_size)
    ) {
      return { isValid: false, reason: 'Missing or invalid lot_size' };
    }

    return {
      isValid: true,
      property: {
        externalId: raw.external_id.trim(),
        city: raw.city.trim(),
        state: raw.state.trim(),
        price: raw.price,
        bedrooms: raw.bedrooms,
        bathrooms: raw.bathrooms,
        squareFeet: raw.square_feet,
        lotSize: raw.lot_size,
      },
    };
  }
}
