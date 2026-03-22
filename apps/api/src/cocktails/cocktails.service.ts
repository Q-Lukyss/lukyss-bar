import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DB } from '../db/db.module';
import { cocktails } from '../drizzle/schema';
import type { drizzle } from 'drizzle-orm/node-postgres';

type Db = ReturnType<typeof drizzle>;

@Injectable()
export class CocktailsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list() {
    return this.db.select().from(cocktails);
  }

  async getById(id: string) {
    const [row] = await this.db
      .select()
      .from(cocktails)
      .where(eq(cocktails.id, id))
      .limit(1);

    if (!row) throw new NotFoundException('Cocktail introuvable');
    return row;
  }

  async create(dto: { name: string; image?: string | null; price: number }) {
    const [created] = await this.db
      .insert(cocktails)
      .values({
        name: dto.name,
        image: dto.image ?? null,
        price: dto.price,
      })
      .returning();

    return created;
  }

  async update(
    id: string,
    dto: { name?: string; image?: string | null; price?: number },
  ) {
    await this.getById(id);

    const [updated] = await this.db
      .update(cocktails)
      .set({
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.image !== undefined ? { image: dto.image } : {}),
      })
      .where(eq(cocktails.id, id))
      .returning();

    if (!updated) throw new NotFoundException('Cocktail introuvable');
    return updated;
  }
}
