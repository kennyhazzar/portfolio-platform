import { Module } from '@nestjs/common';
import { ViewTrackingService } from './view-tracking.service';

@Module({
  providers: [ViewTrackingService],
  exports: [ViewTrackingService],
})
export class ViewTrackingModule {}
