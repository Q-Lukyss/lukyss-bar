import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { drizzle } from 'drizzle-orm/node-postgres';

import { DB } from '../db/db.module';
import {
  cocktails,
  cocktailsIngredients,
  ingredients,
} from '../drizzle/schema';
import type {
  CocktailIngredientLinkRow,
  CocktailIngredientListItem,
  CocktailRow,
  CocktailView,
  DeleteMessage,
} from '../../domain/entities/cocktails';

type Db = ReturnType<typeof drizzle>;

@Injectable()
export class CocktailsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(): Promise<CocktailRow[]> {
    const rows = await this.db.select().from(cocktails);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      image: row.image,
      price: row.price,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async getById(id: string): Promise<CocktailView> {
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
      id: cocktail.id,
      name: cocktail.name,
      description: cocktail.description ?? null,
      image: cocktail.image,
      price: cocktail.price,
      createdAt: cocktail.createdAt,
      updatedAt: cocktail.updatedAt,
      ingredients: cocktailIngredientsRows.map((row) => ({
        id: row.id,
        ingredientId: row.ingredientId,
        name: row.name,
        stock: row.stock,
        quantity: row.quantity,
        unity: row.unity,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
    };
  }

  async create(dto: {
    name: string;
    description?: string | null;
    image?: string | null;
    price: number;
  }): Promise<CocktailRow> {
    const [created] = await this.db
      .insert(cocktails)
      .values({
        name: dto.name,
        description: dto.description ?? null,
        image: dto.image ?? null,
        price: dto.price,
      })
      .returning();

    if (!created) {
      throw new BadRequestException('Impossible de créer le cocktail');
    }

    return {
      id: created.id,
      name: created.name,
      description: created.description ?? null,
      image: created.image,
      price: created.price,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async update(
    id: string,
    dto: { name?: string; description?: string | null; image?: string | null; price?: number },
  ): Promise<CocktailRow> {
    await this.ensureCocktailExists(id);

    const [updated] = await this.db
      .update(cocktails)
      .set({
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.image !== undefined ? { image: dto.image } : {}),
      })
      .where(eq(cocktails.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException('Cocktail introuvable');
    }

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description ?? null,
      image: updated.image,
      price: updated.price,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async addIngredientToCocktail(
    cocktailId: string,
    dto: {
      ingredientId: string;
      quantity: number;
      unity: string;
    },
  ): Promise<CocktailIngredientLinkRow> {
    await this.ensureCocktailExists(cocktailId);

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

    return {
      id: created.id,
      cocktailId: created.cocktailId,
      ingredientId: created.ingredientId,
      quantity: created.quantity,
      unity: created.unity,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async updateCocktailIngredient(
    cocktailId: string,
    cocktailIngredientId: string,
    dto: {
      ingredientId?: string;
      quantity?: number;
      unity?: string;
    },
  ): Promise<CocktailIngredientLinkRow> {
    await this.ensureCocktailExists(cocktailId);

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

    return {
      id: updated.id,
      cocktailId: updated.cocktailId,
      ingredientId: updated.ingredientId,
      quantity: updated.quantity,
      unity: updated.unity,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteCocktailIngredient(
    cocktailId: string,
    cocktailIngredientId: string,
  ): Promise<DeleteMessage> {
    await this.ensureCocktailExists(cocktailId);

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

  async getCocktailIngredients(
    cocktailId: string,
  ): Promise<CocktailIngredientListItem[]> {
    await this.ensureCocktailExists(cocktailId);

    const rows = await this.db
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

    return rows.map((row) => ({
      id: row.id,
      cocktailId: row.cocktailId,
      ingredientId: row.ingredientId,
      quantity: row.quantity,
      unity: row.unity,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      ingredientName: row.ingredientName,
      ingredientStock: row.ingredientStock,
    }));
  }

  private async ensureCocktailExists(id: string): Promise<CocktailRow> {
    const [cocktail] = await this.db
      .select()
      .from(cocktails)
      .where(eq(cocktails.id, id))
      .limit(1);

    if (!cocktail) {
      throw new NotFoundException('Cocktail introuvable');
    }

    return {
      id: cocktail.id,
      name: cocktail.name,
      description: cocktail.description ?? null,
      image: cocktail.image,
      price: cocktail.price,
      createdAt: cocktail.createdAt,
      updatedAt: cocktail.updatedAt,
    };
  }
}
