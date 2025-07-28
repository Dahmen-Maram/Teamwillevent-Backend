import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import * as passportJwt from 'passport-jwt';
const ExtractJwt = passportJwt.ExtractJwt;
const Strategy = passportJwt.Strategy;
import { ConfigService } from '@nestjs/config';
import { UserRole } from 'src/common/enum/role.enum';

// Define the expected JWT payload structure
interface JwtPayload {
  sub: string;
  role: UserRole;
}

// Define the return type of the validate method
interface ValidateResult {
  sub: string;
  role: UserRole;
}

// JWT Strategy for validating tokens
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  // Explicitly type the validate method's return value
  validate(payload: JwtPayload): ValidateResult {
    return { sub: payload.sub, role: payload.role };
  }
}
