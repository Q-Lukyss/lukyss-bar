import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, and, InferSelectModel } from 'drizzle-orm';

import { DB } from '../db/db.module';
import {
  cocktails,
  cocktailsIngredients,
  ingredients,
} from '../drizzle/schema';
import type { drizzle } from 'drizzle-orm/node-postgres';

type Db = ReturnType<typeof drizzle>;
type Cocktail = InferSelectModel<typeof cocktails>;
type CocktailIngredient = InferSelectModel<typeof cocktailsIngredients>;
type CocktailWithIngredients = Cocktail & {
  ingredients: Array<{
    id: string;
    ingredientId: string;
    name: string;
    stock: boolean;
    quantity: number;
    unity: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

@Injectable()
export class CocktailsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list() {
    return this.db.select().from(cocktails);
  }

  async getById(id: string): Promise<CocktailWithIngredients> {
    const [cocktail] = await this.db
      .select()
      .from(cocktails)
      .where(eq(cocktails.id, id))
      .limit(1);

    if (!cocktail) {
      throw new NotFoundException('Cocktail introuvable');
    }

    const cocktailIngredientsRows = await this.db
      .select({
        id: cocktailsIngredients.id,
        ingredientId: cocktailsIngredients.ingredientId,
        name: ingredients.name,
        stock: ingredients.stock,
        quantity: cocktailsIngredients.quantity,
        unity: cocktailsIngredients.unity,
        createdAt: cocktailsIngredients.createdAt,
        updatedAt: cocktailsIngredients.updatedAt,
      })
      .from(cocktailsIngredients)
      .innerJoin(
        ingredients,
        eq(cocktailsIngredients.ingredientId, ingredients.id),
      )
      .where(eq(cocktailsIngredients.cocktailId, id));

    return {
      ...cocktail,
      ingredients: cocktailIngredientsRows,
    };
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

  async addIngredientToCocktail(
    cocktailId: string,
    dto: {
      ingredientId: string;
      quantity: number;
      unity: string;
    },
  ): Promise<CocktailIngredient> {
    await this.getById(cocktailId);

    const [ingredient] = await this.db
      .select()
      .from(ingredients)
      .where(eq(ingredients.id, dto.ingredientId))
      .limit(1);

    if (!ingredient) {
      throw new NotFoundException('Ingrédient introuvable');
    }

    const [existingLink] = await this.db
      .select()
      .from(cocktailsIngredients)
      .where(
        and(
          eq(cocktailsIngredients.cocktailId, cocktailId),
          eq(cocktailsIngredients.ingredientId, dto.ingredientId),
        ),
      )
      .limit(1);

    if (existingLink) {
      throw new BadRequestException(
        'Cet ingrédient est déjà associé à ce cocktail',
      );
    }

    const [created] = await this.db
      .insert(cocktailsIngredients)
      .values({
        cocktailId,
        ingredientId: dto.ingredientId,
        quantity: dto.quantity,
        unity: dto.unity,
      })
      .returning();

    if (!created) {
      throw new BadRequestException(
        "Impossible d'ajouter l'ingrédient au cocktail",
      );
    }

    return created;
  }

  async updateCocktailIngredient(
    cocktailId: string,
    cocktailIngredientId: string,
    dto: {
      ingredientId?: string;
      quantity?: number;
      unity?: string;
    },
  ): Promise<CocktailIngredient> {
    await this.getById(cocktailId);

    const [link] = await this.db
      .select()
      .from(cocktailsIngredients)
      .where(
        and(
          eq(cocktailsIngredients.id, cocktailIngredientId),
          eq(cocktailsIngredients.cocktailId, cocktailId),
        ),
      )
      .limit(1);

    if (!link) {
      throw new NotFoundException(
        'Association cocktail / ingrédient introuvable',
      );
    }

    if (dto.ingredientId !== undefined) {
      const [ingredient] = await this.db
        .select()
        .from(ingredients)
        .where(eq(ingredients.id, dto.ingredientId))
        .limit(1);

      if (!ingredient) {
        throw new NotFoundException('Ingrédient introuvable');
      }

      const [duplicate] = await this.db
        .select()
        .from(cocktailsIngredients)
        .where(
          and(
            eq(cocktailsIngredients.cocktailId, cocktailId),
            eq(cocktailsIngredients.ingredientId, dto.ingredientId),
          ),
        )
        .limit(1);

      if (duplicate && duplicate.id !== cocktailIngredientId) {
        throw new BadRequestException(
          'Cet ingrédient est déjà associé à ce cocktail',
        );
      }
    }

    const [updated] = await this.db
      .update(cocktailsIngredients)
      .set({
        ...(dto.ingredientId !== undefined
          ? { ingredientId: dto.ingredientId }
          : {}),
        ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        ...(dto.unity !== undefined ? { unity: dto.unity } : {}),
      })
      .where(eq(cocktailsIngredients.id, cocktailIngredientId))
      .returning();

    if (!updated) {
      throw new NotFoundException(
        'Association cocktail / ingrédient introuvable',
      );
    }

    return updated;
  }

  async deleteCocktailIngredient(
    cocktailId: string,
    cocktailIngredientId: string,
  ): Promise<{ message: string }> {
    await this.getById(cocktailId);

    const [link] = await this.db
      .select()
      .from(cocktailsIngredients)
      .where(
        and(
          eq(cocktailsIngredients.id, cocktailIngredientId),
          eq(cocktailsIngredients.cocktailId, cocktailId),
        ),
      )
      .limit(1);

    if (!link) {
      throw new NotFoundException(
        'Association cocktail / ingrédient introuvable',
      );
    }

    await this.db
      .delete(cocktailsIngredients)
      .where(eq(cocktailsIngredients.id, cocktailIngredientId));

    return {
      message: 'Ingrédient supprimé du cocktail',
    };
  }

  async getCocktailIngredients(cocktailId: string) {
    await this.getById(cocktailId);

    return this.db
      .select({
        id: cocktailsIngredients.id,
        cocktailId: cocktailsIngredients.cocktailId,
        ingredientId: cocktailsIngredients.ingredientId,
        quantity: cocktailsIngredients.quantity,
        unity: cocktailsIngredients.unity,
        createdAt: cocktailsIngredients.createdAt,
        updatedAt: cocktailsIngredients.updatedAt,
        ingredientName: ingredients.name,
        ingredientStock: ingredients.stock,
      })
      .from(cocktailsIngredients)
      .innerJoin(
        ingredients,
        eq(cocktailsIngredients.ingredientId, ingredients.id),
      )
      .where(eq(cocktailsIngredients.cocktailId, cocktailId));
  }
}
