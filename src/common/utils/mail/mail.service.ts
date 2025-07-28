// src/mail/mail.service.ts
/*import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  async sendMail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    try {
      // Mock email sending by logging details
      console.log('Mock Email Sent:', {
        to,
        subject,
        text,
        html,
      });
      return Promise.resolve();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('MailService error:', errorMessage);
      throw new Error(`Failed to send email: ${errorMessage}`);
    }
  }
}*/
// src/mail/mail.service.ts
// src/mail/mail.service.ts
/////////////////////////////////////////////////////
/*import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
  }

  async sendMail(to: string, subject: string, text: string, html?: string): Promise<void> {
    try {
      const msg = {
        to,
        from: 'no-reply@testapp.com',
        subject,
        text,
        html,
      };
      await sgMail.send(msg);
      console.log(`Email sent to ${to}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('MailService error:', errorMessage);
      throw new Error(`Failed to send email: ${errorMessage}`);
    }
  }
}*/
// src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  async sendMail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY not found in environment variables');
    }

    sgMail.setApiKey(apiKey);

    const senderAddress =
      this.configService.get<string>('SENDER_ADDRESS') ||
      '123 Main Street, Suite 100, Toronto, Ontario M5V 2T6, Canada';
    const footerHtml = `<p>From: Test App Events, ${senderAddress}</p><p><a href="https://yourdomain.com/unsubscribe">Unsubscribe</a></p>`;
    const finalHtml = html
      ? `${html}${footerHtml}`
      : `<p>${text}</p>${footerHtml}`;

    const msg: sgMail.MailDataRequired = {
      to,
      from: {
        email:
          this.configService.get<string>('SENDGRID_SENDER') ||
          'maramdahmen3@gmail.com',
        name: 'Test App Events',
      },
      replyTo:
        this.configService.get<string>('SENDGRID_REPLY_TO') ||
        'maramdahmen3@gmail.com',
      subject,
      text,
      html: finalHtml,
      mailSettings: {
        sandboxMode: {
          enable: process.env.NODE_ENV !== 'production',
        },
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Email sent to ${to}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('MailService error:', errorMessage);
      throw new Error(`Failed to send email: ${errorMessage}`);
    }
  }
}
