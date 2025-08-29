import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto';
import { User } from 'src/common/models/types/user.entity';
import { MailService } from 'src/modules/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private readonly mailService: MailService,
  ) {
    console.log('AuthService initialized'); // Debug log
  }

  async validateUser(email: string, motDePasse: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(motDePasse, user.motDePasse))) {
      return user;
    }
    return null;
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; user: User }> {
    const user = await this.validateUser(loginDto.email, loginDto.motDePasse);
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const payload = { sub: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user,
    };
  }
  // AuthService
  // async forgotPassword(email: string): Promise<void> {
  //   const user = await this.userRepository.findOne({ where: { email } });
  //   if (!user) {
  //     throw new UnauthorizedException('Email non trouvé');
  //   }

  //   const resetToken = this.jwtService.sign(
  //     { sub: user.id, email: user.email },
  //     { expiresIn: '1h', secret: process.env.JWT_SECRET },
  //   );

  //   const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
  //   console.log('>>> token :', resetToken);

  //   // 👇 AJOUT ICI
  //   console.log('>>> Appel de sendMail avec URL :', resetUrl);

  //   await this.mailService.sendMail(
  //     email,
  //     'Réinitialisation du mot de passe',
  //     `Cliquez sur ce lien pour réinitialiser votre mot de passe: ${resetUrl}`,
  //     `<p>Bonjour,</p>
  //    <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
  //    <p><a href="${resetUrl}">Cliquez ici pour réinitialiser</a></p>
  //    <p>Ce lien expirera dans 1 heure.</p>`,
  //   );
  // }
 async forgotPassword(email: string): Promise<void> {
  const user = await this.userRepository.findOne({ where: { email } });
  if (!user) {
    throw new UnauthorizedException('Email non trouvé');
  }

  const resetToken = this.jwtService.sign(
    { sub: user.id, email: user.email },
    { expiresIn: '1h', secret: process.env.JWT_SECRET },
  );

  // Utilisation de FRONTEND_URL avec fallback par défaut
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

 await this.mailService.sendForgotPasswordEmail(email, resetToken);


}

async resetPassword(token: string, newPassword: string): Promise<void> {
  try {
    const decoded = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });

    const userId = decoded.sub;
    if (!userId) throw new UnauthorizedException('Token invalide');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Utilisateur non trouvé');

    // Hash et mise à jour du mot de passe
    user.motDePasse = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    // ✅ Envoi d'un email de confirmation
    await this.mailService.sendMail(
      user.email,
      'Mot de passe changé avec succès',
      `Bonjour ${user.nom || ''},\n\nVotre mot de passe a été modifié avec succès. 
      Si vous n'êtes pas à l'origine de cette modification, veuillez contacter notre support immédiatement.`,
      `<p>Bonjour ${user.nom || ''},</p>
       <p>Votre mot de passe a été <strong>modifié avec succès</strong>.</p>
       <p>Si vous n'êtes pas à l'origine de cette action, contactez immédiatement notre support.</p>`
    );

  } catch (error) {
    throw new UnauthorizedException('Token invalide ou expiré');
  }
}



  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Retrieve the user by ID
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Check if current password matches
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.motDePasse,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.motDePasse = hashedPassword;

    // Save changes
    await this.userRepository.save(user);
  }

  // async resetPassword(token: string, newPassword: string): Promise<void> {
  //   try {
  //     // Vérifie et décode le token JWT avec la clé secrète
  //     const decoded: { sub?: string } = this.jwtService.verify(token, {
  //       secret: process.env.JWT_SECRET,
  //     });

  //     const userId = decoded.sub;
  //     if (!userId) {
  //       throw new UnauthorizedException(
  //         'Token invalide : identifiant utilisateur manquant',
  //       );
  //     }

  //     const user = await this.userRepository.findOne({ where: { id: userId } });
  //     if (!user) {
  //       throw new UnauthorizedException('Utilisateur non trouvé');
  //     }

  //     const hashedPassword = await bcrypt.hash(newPassword, 10);
  //     user.motDePasse = hashedPassword;
  //     await this.userRepository.save(user);
  //   } catch (error) {
  //     console.error(
  //       'Erreur lors de la réinitialisation du mot de passe:',
  //       error,
  //     );
  //     throw new UnauthorizedException('Token invalide ou expiré');
  //   }
  // }
  
}
