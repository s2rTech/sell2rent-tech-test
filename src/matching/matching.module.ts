import { Module } from '@nestjs/common';
import { InvestorsModule } from '../investors/investors.module';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';

@Module({
  // InvestorsModule is imported so InvestorsService (exported from it) is available here
  imports: [InvestorsModule],
  controllers: [MatchingController],
  providers: [MatchingService],
})
export class MatchingModule {}
