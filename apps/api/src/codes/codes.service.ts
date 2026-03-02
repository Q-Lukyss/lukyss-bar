import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { drizzle } from 'drizzle-orm/node-postgres';
import { randomBytes } from 'crypto';

import { DB } from '../db/db.module';
import { codes } from '../drizzle/schema';

type Db = ReturnType<typeof drizzle>;

@Injectable()
export class CodesService {
  constructor(@Inject(DB) private readonly db: Db) {}

  private generateCode4(): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = randomBytes(4);
    let out = '';
    for (let i = 0; i < 4; i++) out += alphabet[bytes[i] % alphabet.length];
    return out;
  }

  private normalizeCode(input: string): string {
    return input.trim().toUpperCase();
  }

  async list() {
    return this.db.select().from(codes);
  }

  async create(inputCode?: string) {
    let codeValue = inputCode?.trim()
      ? this.normalizeCode(inputCode)
      : this.generateCode4();

    for (let attempt = 0; attempt < 5; attempt++) {
      const [exists] = await this.db
        .select({ id: codes.id })
        .from(codes)
        .where(eq(codes.code, codeValue))
        .limit(1);

      if (!exists) break;
      codeValue = this.generateCode4();
    }

    const [created] = await this.db
      .insert(codes)
      .values({ code: codeValue })
      .returning();

    return created;
  }

  async deleteById(id: string) {
    const [deleted] = await this.db
      .delete(codes)
      .where(eq(codes.id, id))
      .returning();

    if (!deleted) throw new NotFoundException('Code introuvable');
    return deleted;
  }
}
