import { Injectable } from '@nestjs/common';
import { Vonage } from '@vonage/server-sdk';
import { Auth } from '@vonage/auth';

@Injectable()
export class SmsService {
  private vonage: Vonage;

  constructor() {
    const auth = new Auth({
      apiKey: process.env.VONAGE_API_KEY!,
      apiSecret: process.env.VONAGE_API_SECRET!,
    });

    this.vonage = new Vonage(auth);
  }

  async sendSms(to: string, from: string, text: string): Promise<any> {
    try {
      const response = await this.vonage.sms.send({ to, from, text });
      return response;
    } catch (error) {
      throw error;
    }
  }
}
