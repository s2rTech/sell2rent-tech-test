import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Investor } from '@prisma/client';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { InvestorResponseDto } from './dto/investor-response.dto';
import { InvestorsService } from './investors.service';

@ApiTags('investors')
@Controller('investors')
export class InvestorsController {
  constructor(private readonly investorsService: InvestorsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new investor with buying criteria' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Investor created',
    type: InvestorResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error' })
  async create(@Body() dto: CreateInvestorDto): Promise<Investor> {
    return this.investorsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get investor by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    type: InvestorResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Investor not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Investor> {
    return this.investorsService.findById(id);
  }
}
