import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, inArray, InferSelectModel } from 'drizzle-orm';
import type { drizzle } from 'drizzle-orm/node-postgres';
import { randomBytes } from 'crypto';

import { DB } from '../db/db.module';
import {
  cocktails,
  cocktailsCommandes,
  codes,
  commandes,
} from '../drizzle/schema';

import type {
  CommandeRow,
  CommandeView,
  CommandeStatus,
} from '../../domain/entities/commande';

type Db = ReturnType<typeof drizzle>;

@Injectable()
export class CommandesService {
  constructor(@Inject(DB) private readonly db: Db) {}

  private normalizeCode(input: string): string {
    return input.trim().toUpperCase();
  }

  private generatePublicToken(): string {
    return randomBytes(16).toString('hex');
  }

  async create(dto: {
    customerName: string;
    promoCode: string;
    items: Array<{ cocktailId: string; quantity: number }>;
  }): Promise<CommandeView> {
    const promoCode = this.normalizeCode(dto.promoCode);

    const [existingCode] = await this.db
      .select()
      .from(codes)
      .where(eq(codes.code, promoCode))
      .limit(1);

    if (!existingCode) {
      throw new BadRequestException('Code promo invalide');
    }

    const cocktailIds = dto.items.map((item) => item.cocktailId);

    const cocktailsRows = await this.db
      .select()
      .from(cocktails)
      .where(inArray(cocktails.id, cocktailIds));

    if (cocktailsRows.length !== cocktailIds.length) {
      throw new BadRequestException(
        'Un ou plusieurs cocktails sont introuvables',
      );
    }

    const cocktailsMap = new Map(cocktailsRows.map((c) => [c.id, c]));

    let totalPrice = 0;

    for (const item of dto.items) {
      const cocktail = cocktailsMap.get(item.cocktailId);
      if (!cocktail) {
        throw new BadRequestException(
          `Cocktail introuvable: ${item.cocktailId}`,
        );
      }

      totalPrice += cocktail.price * item.quantity;
    }

    const [createdCommande] = await this.db
      .insert(commandes)
      .values({
        customerName: dto.customerName,
        promoCode,
        publicToken: this.generatePublicToken(),
        status: 'PENDING',
        totalPrice,
      })
      .returning();

    if (!createdCommande) {
      throw new BadRequestException('Impossible de créer la commande');
    }

    const linesToInsert = dto.items.map((item) => ({
      commandeId: createdCommande.id,
      cocktailId: item.cocktailId,
      quantity: item.quantity,
    }));

    await this.db.insert(cocktailsCommandes).values(linesToInsert);

    return this.getById(createdCommande.id);
  }

  async getById(id: string): Promise<CommandeView> {
    const [commande] = await this.db
      .select()
      .from(commandes)
      .where(eq(commandes.id, id))
      .limit(1);

    if (!commande) {
      throw new NotFoundException('Commande introuvable');
    }

    const items = await this.db
      .select({
        id: cocktailsCommandes.id,
        cocktailId: cocktailsCommandes.cocktailId,
        quantity: cocktailsCommandes.quantity,
        cocktailName: cocktails.name,
        cocktailImage: cocktails.image,
        unitPrice: cocktails.price,
      })
      .from(cocktailsCommandes)
      .innerJoin(cocktails, eq(cocktailsCommandes.cocktailId, cocktails.id))
      .where(eq(cocktailsCommandes.commandeId, id));

    return {
      commande,
      items: items.map((item) => ({
        ...item,
        lineTotal: item.unitPrice * item.quantity,
      })),
    };
  }

  async getByPublicToken(publicToken: string): Promise<CommandeView> {
    const [commande] = await this.db
      .select()
      .from(commandes)
      .where(eq(commandes.publicToken, publicToken))
      .limit(1);

    if (!commande) {
      throw new NotFoundException('Commande introuvable');
    }

    return this.getById(commande.id);
  }

  async listAll(): Promise<CommandeRow[]> {
    return this.db.select().from(commandes);
  }

  async updateStatus(id: string, status: CommandeStatus): Promise<CommandeRow> {
    const [updated] = await this.db
      .update(commandes)
      .set({ status })
      .where(eq(commandes.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException('Commande introuvable');
    }

    return updated;
  }
}
