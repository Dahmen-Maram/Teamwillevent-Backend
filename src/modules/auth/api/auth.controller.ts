import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UseGuards } from '@nestjs/common';

import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { UserService } from 'src/modules/user/api/user.service';
import { User } from 'src/common/models/types/user.entity';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

// Controller for authentication endpoints
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {
    console.log('AuthController initialized');
  }

  @Post('users/register')
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ access_token: string; user: User }> {
    console.log('Login endpoint hit with:', loginDto);
    return this.authService.login(loginDto);
  }
  // @Post('forgot-password')
  // async forgotPassword(
  //   @Body() dto: ForgotPasswordDto,
  // ): Promise<{ message: string }> {
  //   await this.authService.forgotPassword(dto.email);
  //   return { message: 'Email de réinitialisation envoyé avec succès.' };
  // }

  // Additional endpoints can be added here as needed
  // For example, password reset, email verification, etc.
  // Ensure to handle errors and edge cases appropriately
  @Post('forgot-password')
async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
  await this.authService.forgotPassword(dto.email);
  return { message: 'Email de réinitialisation envoyé avec succès.' };
}

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ): Promise<{ message: string }> {
    if (!currentPassword || !newPassword) {
      throw new UnauthorizedException('Les mots de passe doivent être fournis');
    }

    const userId = (req.user as { sub: string }).sub;

    await this.authService.changePassword(userId, currentPassword, newPassword);
    return { message: 'Mot de passe changé avec succès.' };
  }
  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(token, newPassword);
    return { message: 'Mot de passe réinitialisé avec succès.' };
  }
}
