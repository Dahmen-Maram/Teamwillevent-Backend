// sms.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
async sendSms(@Body() body: { to: string; text: string }) {
  const from = 'MyApp'; // ou un numéro autorisé
  return this.smsService.sendSms(body.to, from, body.text);
}

}
