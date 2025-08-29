import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true pour 465, false pour les autres ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Ta méthode existante (inchangée)
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
      this.logger.log(`✅ Email envoyé : ${info.response}`);
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'envoi de mail : ${error.message}`);
      throw error;
    }
  }

  // Nouvelle méthode générique pour envoyer n'importe quel mail
  async sendMail(to: string, subject: string, text: string, html?: string) {
    const mailOptions = {
      from: `"Teamwill Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email envoyé à ${to} : ${info.response}`);
    } catch (error) {
      this.logger.error(`❌ Erreur envoi email à ${to} : ${error.message}`);
      throw error;
    }
  }
}
