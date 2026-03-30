import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { drizzle } from 'drizzle-orm/node-postgres';

import { DB } from '../db/db.module';
import { ingredients } from '../drizzle/schema';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { IngredientRow } from 'domain/entities/ingredients';

type Db = ReturnType<typeof drizzle>;

@Injectable()
export class IngredientsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  list(): Promise<IngredientRow[]> {
    return this.db.select().from(ingredients);
  }

  async getById(id: string): Promise<IngredientRow> {
    const [row] = await this.db
      .select()
      .from(ingredients)
      .where(eq(ingredients.id, id))
      .limit(1);

    if (!row) throw new NotFoundException('Ingredient not found');
    return row;
  }

  async create(dto: CreateIngredientDto): Promise<IngredientRow> {
    const [created] = await this.db
      .insert(ingredients)
      .values({
        name: dto.name.trim(),
        stock: dto.stock ?? true,
      })
      .returning();

    return created;
  }

  async update(id: string, dto: UpdateIngredientDto): Promise<IngredientRow> {
    const patch: Record<string, any> = {};
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.stock !== undefined) patch.stock = dto.stock;

    const [updated] = await this.db
      .update(ingredients)
      .set(patch)
      .where(eq(ingredients.id, id))
      .returning();

    if (!updated) throw new NotFoundException('Ingredient introuvable');
    return updated;
  }

  async delete(id: string): Promise<IngredientRow> {
    const [deleted] = await this.db
      .delete(ingredients)
      .where(eq(ingredients.id, id))
      .returning();

    if (!deleted) throw new NotFoundException('Ingredient introuvable');
    return deleted;
  }

  async setInStock(id: string): Promise<IngredientRow> {
    return this.update(id, { stock: true });
  }

  async setOutOfStock(id: string): Promise<IngredientRow> {
    return this.update(id, { stock: false });
  }
}
