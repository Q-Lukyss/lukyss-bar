import { Controller } from '@nestjs/common';
import { TypedBody, TypedRoute } from '@nestia/core';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { LoginResponse } from '../../domain/entities/auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @TypedRoute.Post('login')
  login(@TypedBody() dto: LoginDto): Promise<LoginResponse> {
    return this.auth.login(dto.email, dto.password);
  }
}
