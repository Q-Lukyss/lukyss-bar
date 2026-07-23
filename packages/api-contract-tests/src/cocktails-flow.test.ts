import { describe, expect, it, beforeAll } from "vitest";
import {
  ingredients,
  cocktails,
  codes,
  commandes,
  type ApiConnection,
} from "@lukyss-bar/api-types";
import { adminConnection, anonConnection, unique } from "./setup.js";

// Parcours complet : un admin crée un ingrédient + un cocktail (sans image,
// cf. plan DevOps — l'upload R2 est hors scope de ces tests) + un code
// promo, un client anonyme passe une commande avec ce cocktail et ce code,
// puis l'admin la fait progresser. Vérifie que le contrat entre l'API Rust
// et le client TS généré (packages/api-types) tient bout en bout, pas
// seulement au niveau des types statiques.
describe("cocktails → codes → commandes (parcours complet)", () => {
  let admin: ApiConnection;

  beforeAll(async () => {
    admin = await adminConnection();
  });

  it("calcule le total d'une commande à partir du prix des cocktails et du code promo", async () => {
    const ingredient = await ingredients.create(admin, {
      name: unique("Rhum-contrat"),
      stock: true,
    });
    expect(ingredient.stock).toBe(true);

    const cocktail = await cocktails.create(admin, {
      name: unique("Mojito-contrat"),
      price: 9,
    });
    expect(cocktail.price).toBe(9);

    const link = await cocktails.ingredients.add(admin, cocktail.id, {
      ingredientId: ingredient.id,
      quantity: 5,
      unity: "cl",
    });
    expect(link.ingredientId).toBe(ingredient.id);

    const code = await codes.create(admin, { code: unique("PROMO") });

    const anon = anonConnection();
    const order = await commandes.create(anon, {
      customerName: "Client Contrat",
      promoCode: code.code,
      items: [{ cocktailId: cocktail.id, quantity: 3 }],
    });

    expect(order.commande.totalPrice).toBe(27); // 9 * 3
    expect(order.commande.status).toBe("PENDING");
    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.cocktailId).toBe(cocktail.id);

    // Suivi public (client anonyme, sans token admin) : doit refléter la
    // même commande.
    const publicView = await commandes.getByPublicToken(anon, order.commande.publicToken);
    expect(publicView.commande.id).toBe(order.commande.id);

    // L'admin la retrouve dans la liste et peut la faire progresser.
    const all = await commandes.listAll(admin);
    expect(all.some((c) => c.id === order.commande.id)).toBe(true);

    const updated = await commandes.updateStatus(admin, order.commande.id, {
      status: "CONFIRMED",
    });
    expect(updated.status).toBe("CONFIRMED");

    const publicViewAfterUpdate = await commandes.getByPublicToken(anon, order.commande.publicToken);
    expect(publicViewAfterUpdate.commande.status).toBe("CONFIRMED");
  });

  it("rejette une commande avec un code promo invalide", async () => {
    const cocktail = await cocktails.create(admin, {
      name: unique("Screwdriver-contrat"),
      price: 8,
    });

    await expect(
      commandes.create(anonConnection(), {
        customerName: "Client Contrat",
        promoCode: unique("CODE-INEXISTANT"),
        items: [{ cocktailId: cocktail.id, quantity: 1 }],
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
