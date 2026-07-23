import { describe, expect, it, beforeAll } from "vitest";
import WebSocket from "ws";
import { cocktails, codes, commandes, type ApiConnection } from "@lukyss-bar/api-types";
import { adminConnection, anonConnection, unique } from "./setup.js";

describe("websocket de suivi de commande", () => {
  let admin: ApiConnection;

  beforeAll(async () => {
    admin = await adminConnection();
  });

  it("diffuse le nouveau statut aux clients connectés avant la mise à jour", async () => {
    const cocktail = await cocktails.create(admin, {
      name: unique("Tequila-contrat"),
      price: 9,
    });
    const code = await codes.create(admin, { code: unique("WSPROMO") });

    const anon = anonConnection();
    const order = await commandes.create(anon, {
      customerName: "Client WS",
      promoCode: code.code,
      items: [{ cocktailId: cocktail.id, quantity: 1 }],
    });

    const ws = new WebSocket(commandes.wsUrl(anon, order.commande.publicToken));
    await new Promise<void>((resolve, reject) => {
      ws.once("open", () => resolve());
      ws.once("error", reject);
    });

    const nextMessage = new Promise<{ status: string }>((resolve, reject) => {
      ws.once("message", (data) => resolve(JSON.parse(data.toString())));
      ws.once("error", reject);
    });

    // Le registre de diffusion n'est peuplé qu'à la connexion WS (cf.
    // commandes/ws.rs) : cette mise à jour ne peut donc arriver qu'après
    // l'ouverture du socket ci-dessus, sans quoi elle serait perdue.
    await commandes.updateStatus(admin, order.commande.id, { status: "CONFIRMED" });

    const message = await nextMessage;
    expect(message.status).toBe("CONFIRMED");

    ws.close();
  });
});
