import { Module } from '@nestjs/common';
import { SmsController } from './api/sms.controller';
import { SmsService } from './api/sms.service';

@Module({
  controllers: [SmsController],
  providers: [SmsService],
})
export class SmsModule {}
