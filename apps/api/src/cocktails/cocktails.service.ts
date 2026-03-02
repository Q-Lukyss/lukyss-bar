import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { db } from '../drizzle/db';
import { cocktails } from '../drizzle/schema'; // adapte le chemin exact
import { CreateCocktailDto } from './dto/create-cocktail.dto';

@Injectable()
export class CocktailsService {
  async list() {
    return db.select().from(cocktails);
  }

  async getById(id: string) {
    const [row] = await db
      .select()
      .from(cocktails)
      .where(eq(cocktails.id, id))
      .limit(1);

    if (!row) throw new NotFoundException('Cocktail not found');
    return row;
  }

  async create(dto: CreateCocktailDto) {
    const [created] = await db
      .insert(cocktails)
      .values({
        name: dto.name,
        image: dto.image ?? null,
        price: dto.price,
      })
      .returning();

    return created;
  }
}
