// import { Injectable } from '@nestjs/common';
// import * as sgMail from '@sendgrid/mail';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class MailService {
//   constructor(private readonly configService: ConfigService) {}

//   async sendMail(
//     to: string,
//     subject: string,
//     text: string,
//     html?: string,
//   ): Promise<void> {
//     console.log('📨 sendMail method called');

//     const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
//     if (!apiKey) {
//       throw new Error('SENDGRID_API_KEY not found in environment variables');
//     }

//     sgMail.setApiKey(apiKey);

//     const senderAddress =
//       this.configService.get<string>('SENDER_ADDRESS') ||
//       '123 Main Street, Suite 100, Toronto, Ontario M5V 2T6, Canada';
//     const footerHtml = `<p>From: Test App Events, ${senderAddress}</p><p><a href="https://yourdomain.com/unsubscribe">Unsubscribe</a></p>`;
//     const finalHtml = html
//       ? `${html}${footerHtml}`
//       : `<p>${text}</p>${footerHtml}`;

//     const msg: sgMail.MailDataRequired = {
//       to,
//       from: {
//         email:
//           this.configService.get<string>('SENDGRID_SENDER') ||
//           'maramdahmen3@gmail.com',
//         name: 'Test App Events',
//       },
//       replyTo:
//         this.configService.get<string>('SENDGRID_REPLY_TO') ||
//         'maramdahmen3@gmail.com',
//       subject,
//       text,
//       html: finalHtml,
//       mailSettings: {
//         sandboxMode: {
//           enable: process.env.NODE_ENV !== 'production', // true si pas en prod
//         },
//       },
//     };

//     try {
//       // 🔎 Affiche le contenu de l’email dans la console
//       console.log('💌 Email généré :');
//       console.log('To:', to);
//       console.log('Subject:', subject);
//       console.log('Text:', text);
//       console.log('HTML (final):', finalHtml);

//       // ✅ Envoi réel
//       await sgMail.send(msg);

//       console.log(`✅ Email envoyé à ${to}`);
//     } catch (error: unknown) {
//       const errorMessage =
//         error instanceof Error ? error.message : 'Unknown error';
//       console.error('❌ MailService error:', errorMessage);
//       throw new Error(`Échec de l’envoi d’email: ${errorMessage}`);
//     }
//   }
// }
// src/modules/auth/mailer.service.ts
// mail.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


  async sendForgotPasswordEmail(to: string, token: string) {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Teamwill Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Réinitialisation de mot de passe',
    html: `
      <p>Bonjour,</p>
      <p>Pour réinitialiser votre mot de passe, cliquez sur ce lien :</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Ce lien expirera dans 1 heure.</p>
    `,
  };

  try {
    const info = await this.transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé :', info.response);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de mail :', error);
    throw error;
  }
}

}
