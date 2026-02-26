import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'maxPriceGteMinPrice', async: false })
class MaxPriceGteMinPrice implements ValidatorConstraintInterface {
  validate(maxPrice: number, args: ValidationArguments): boolean {
    const dto = args.object as CreateInvestorDto;
    // if min_price hasn't been set yet, let IsPositive handle that
    if (typeof dto.min_price !== 'number') return true;
    return maxPrice >= dto.min_price;
  }
  defaultMessage(args: ValidationArguments): string {
    const dto = args.object as CreateInvestorDto;
    return `max_price (${args.value}) must be greater than or equal to min_price (${dto.min_price})`;
  }
}

export class CreateInvestorDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 150000, description: 'Minimum acceptable price' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  min_price: number;

  @ApiProperty({ example: 300000, description: 'Maximum acceptable price' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Validate(MaxPriceGteMinPrice)
  max_price: number;

  @ApiProperty({ example: 'Houston' })
  @IsString()
  @IsNotEmpty()
  preferred_city: string;

  @ApiProperty({ example: 3, description: 'Minimum number of bedrooms' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_bedrooms: number;

  @ApiProperty({ example: 1200, description: 'Minimum square footage' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_square_feet: number;
}
