import { Module } from '@nestjs/common';
import { InvestorsController } from './investors.controller';
import { InvestorsService } from './investors.service';

@Module({
  controllers: [InvestorsController],
  providers: [InvestorsService],
  // Exported so MatchingModule can inject InvestorsService for investor lookup
  exports: [InvestorsService],
})
export class InvestorsModule {}
