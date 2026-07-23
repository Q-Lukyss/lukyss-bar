// Client HTTP écrit à la main pour l'API Rust/Axum — remplace le SDK généré
// par Nestia (pas d'équivalent Rust au codegen complet d'un client typé,
// régression DX assumée, cf. plan de migration). Les types viennent de
// ../generated (ts-rs), ce fichier n'ajoute que la couche transport.
import type { AuthUser, LoginRequest, LoginResponse } from "../generated/auth";
import type {
  AddCocktailIngredientRequest,
  CocktailIngredientLinkRow,
  CocktailIngredientListItem,
  CocktailRow,
  CocktailView,
  DeleteMessage,
  UpdateCocktailIngredientRequest,
} from "../generated/cocktails";
import type { CodeRow, CreateCodeRequest } from "../generated/codes";
import type {
  CommandeRow,
  CommandeView,
  CreateCommandeRequest,
  UpdateCommandeStatusRequest,
} from "../generated/commandes";
import type {
  CreateIngredientRequest,
  IngredientRow,
  UpdateIngredientRequest,
} from "../generated/ingredients";

export type ApiConnection = {
  host: string;
  token?: string;
};

export class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : `HTTP ${status}`;
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  connection: ApiConnection,
  method: string,
  path: string,
  options?: { json?: unknown; formData?: FormData },
): Promise<T> {
  const headers: Record<string, string> = {};
  if (connection.token) headers["Authorization"] = `Bearer ${connection.token}`;

  let body: BodyInit | undefined;
  if (options?.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  } else if (options?.formData) {
    body = options.formData;
  }

  const res = await fetch(`${connection.host}${path}`, { method, headers, body });

  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      // réponse non-JSON (ex: rejet de désérialisation générique d'axum) — ignoré
    }
    throw new HttpError(res.status, payload);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const auth = {
  login: (connection: ApiConnection, body: LoginRequest) =>
    request<LoginResponse>(connection, "POST", "/auth/login", { json: body }),
};

export const ingredients = {
  list: (connection: ApiConnection) =>
    request<IngredientRow[]>(connection, "GET", "/ingredients"),
  getById: (connection: ApiConnection, id: string) =>
    request<IngredientRow>(connection, "GET", `/ingredients/${id}`),
  create: (connection: ApiConnection, body: CreateIngredientRequest) =>
    request<IngredientRow>(connection, "POST", "/ingredients", { json: body }),
  update: (connection: ApiConnection, id: string, body: UpdateIngredientRequest) =>
    request<IngredientRow>(connection, "PATCH", `/ingredients/${id}`, { json: body }),
  inStock: (connection: ApiConnection, id: string) =>
    request<IngredientRow>(connection, "PATCH", `/ingredients/${id}/in-stock`),
  outOfStock: (connection: ApiConnection, id: string) =>
    request<IngredientRow>(connection, "PATCH", `/ingredients/${id}/out-of-stock`),
  delete: (connection: ApiConnection, id: string) =>
    request<IngredientRow>(connection, "DELETE", `/ingredients/${id}`),
};

export type CocktailFormInput = {
  name: string;
  price: number;
  description?: string | null;
  image?: File | null;
};

function cocktailFormData(input: CocktailFormInput): FormData {
  const fd = new FormData();
  fd.append("name", input.name);
  fd.append("price", String(input.price));
  if (input.description) fd.append("description", input.description);
  if (input.image) fd.append("image", input.image);
  return fd;
}

export const cocktails = {
  list: (connection: ApiConnection) =>
    request<CocktailRow[]>(connection, "GET", "/cocktails"),
  getById: (connection: ApiConnection, id: string) =>
    request<CocktailView>(connection, "GET", `/cocktails/${id}`),
  create: (connection: ApiConnection, input: CocktailFormInput) =>
    request<CocktailRow>(connection, "POST", "/cocktails", {
      formData: cocktailFormData(input),
    }),
  update: (connection: ApiConnection, id: string, input: Partial<CocktailFormInput>) =>
    request<CocktailRow>(connection, "PATCH", `/cocktails/${id}`, {
      formData: cocktailFormData(input as CocktailFormInput),
    }),
  ingredients: {
    list: (connection: ApiConnection, cocktailId: string) =>
      request<CocktailIngredientListItem[]>(
        connection,
        "GET",
        `/cocktails/${cocktailId}/ingredients`,
      ),
    add: (
      connection: ApiConnection,
      cocktailId: string,
      body: AddCocktailIngredientRequest,
    ) =>
      request<CocktailIngredientLinkRow>(
        connection,
        "POST",
        `/cocktails/${cocktailId}/ingredients`,
        { json: body },
      ),
    update: (
      connection: ApiConnection,
      cocktailId: string,
      linkId: string,
      body: UpdateCocktailIngredientRequest,
    ) =>
      request<CocktailIngredientLinkRow>(
        connection,
        "PATCH",
        `/cocktails/${cocktailId}/ingredients/${linkId}`,
        { json: body },
      ),
    delete: (connection: ApiConnection, cocktailId: string, linkId: string) =>
      request<DeleteMessage>(
        connection,
        "DELETE",
        `/cocktails/${cocktailId}/ingredients/${linkId}`,
      ),
  },
};

export const codes = {
  list: (connection: ApiConnection) => request<CodeRow[]>(connection, "GET", "/codes"),
  create: (connection: ApiConnection, body: CreateCodeRequest) =>
    request<CodeRow>(connection, "POST", "/codes", { json: body }),
  delete: (connection: ApiConnection, id: string) =>
    request<CodeRow>(connection, "DELETE", `/codes/${id}`),
};

export const commandes = {
  create: (connection: ApiConnection, body: CreateCommandeRequest) =>
    request<CommandeView>(connection, "POST", "/commandes", { json: body }),
  getByPublicToken: (connection: ApiConnection, token: string) =>
    request<CommandeView>(connection, "GET", `/commandes/public/${token}`),
  listAll: (connection: ApiConnection) =>
    request<CommandeRow[]>(connection, "GET", "/commandes"),
  getById: (connection: ApiConnection, id: string) =>
    request<CommandeView>(connection, "GET", `/commandes/${id}`),
  delete: (connection: ApiConnection, id: string) =>
    request<DeleteMessage>(connection, "DELETE", `/commandes/${id}`),
  updateStatus: (connection: ApiConnection, id: string, body: UpdateCommandeStatusRequest) =>
    request<CommandeRow>(connection, "PATCH", `/commandes/${id}/status`, { json: body }),
  /** URL du WebSocket natif (remplace le `join:commande` room de Socket.IO). */
  wsUrl: (connection: ApiConnection, token: string) =>
    `${connection.host.replace(/^http/, "ws")}/commandes/ws/${token}`,
};

export type { AuthUser };
