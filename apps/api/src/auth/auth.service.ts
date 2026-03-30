import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

import { DB } from '../db/db.module';
import { users } from '../drizzle/schema';
import type { drizzle } from 'drizzle-orm/node-postgres';
import type { AuthUser, LoginResponse } from '../../domain/entities/auth';

type Db = ReturnType<typeof drizzle>;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(DB) private readonly db: Db,
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.is_active) throw new UnauthorizedException('User disabled');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload: AuthUser & { sub: string } = {
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: user.is_admin,
    };

    return {
      access_token: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
      },
    };
  }
}
