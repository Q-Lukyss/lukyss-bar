# Documentation NestJS — LukyssBar API

> Documentation détaillée de tout ce qui a été mis en place dans `apps/api/`.

---

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technologique](#2-stack-technologique)
3. [Structure des dossiers](#3-structure-des-dossiers)
4. [Configuration](#4-configuration)
5. [Base de données — Schémas Drizzle](#5-base-de-données--schémas-drizzle)
6. [Module Auth](#6-module-auth)
7. [Module Cocktails](#7-module-cocktails)
8. [Module Ingrédients](#8-module-ingrédients)
9. [Module Codes Promo](#9-module-codes-promo)
10. [Module Commandes](#10-module-commandes)
11. [Module DB](#11-module-db)
12. [Bootstrap & Module racine](#12-bootstrap--module-racine)
13. [Sécurité & Guards](#13-sécurité--guards)
14. [Validation & Transformation](#14-validation--transformation)
15. [SDK Nestia](#15-sdk-nestia)
16. [Seed de la base de données](#16-seed-de-la-base-de-données)
17. [Migrations Drizzle](#17-migrations-drizzle)
18. [Diagramme entité-relation](#18-diagramme-entité-relation)
19. [Récapitulatif des endpoints](#19-récapitulatif-des-endpoints)
20. [Module tRPC (POC)](#20-module-trpc-poc)
21. [WebSocket — Suivi de commande en temps réel](#21-websocket--suivi-de-commande-en-temps-réel)
22. [Convex — Notifications temps réel (POC)](#22-convex--notifications-temps-réel-poc)

---

## 1. Vue d'ensemble

L'API est une application **NestJS 11** qui expose une API REST pour gérer un bar à cocktails. Elle couvre :

- La gestion du catalogue (cocktails et ingrédients)
- La prise de commande avec codes promo
- L'authentification JWT pour les opérations d'administration
- La génération automatique d'un SDK TypeScript client (Nestia)
- La documentation Swagger auto-générée

L'API tourne sur le **port 3001** (configurable via la variable d'environnement `PORT`).

---

## 2. Stack technologique

| Aspect | Choix | Raison |
|---|---|---|
| Framework | NestJS 11 | Architecture modulaire, DI natif, décorateurs TypeScript |
| ORM | Drizzle ORM 0.45 | SQL-first, typage fort, migrations intégrées |
| Base de données | PostgreSQL | Support des ENUM, robustesse relationnelle |
| Authentification | JWT + Passport | Standard, stateless, facile à intégrer |
| Validation | class-validator + class-transformer | Décorateurs déclaratifs, compatible NestJS |
| Validation compilée | typia (via Nestia) | Validation sans réflexion runtime, perf améliorée |
| Documentation API | Swagger + Nestia SDK | Auto-générée depuis les types/contrôleurs |
| Langage | TypeScript 5.9 | Typage strict end-to-end |
| IDs | ULID | Sortable par temps, URL-safe, alternative à UUID |
| Hachage | bcrypt | Standard pour les mots de passe |
| Tests | Jest 30 | Couverture unitaire/intégration |

---

## 3. Structure des dossiers

```
apps/api/
├── src/
│   ├── auth/                        # Module JWT + guards
│   │   ├── dto/
│   │   │   └── login.dto.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── jwt.strategy.ts
│   │   ├── roles.decorator.ts
│   │   └── roles.guard.ts
│   ├── cocktails/                   # Module cocktails + upload image
│   │   ├── dto/
│   │   │   ├── add-cocktail-ingredient.dto.ts
│   │   │   ├── create-cocktail.dto.ts
│   │   │   ├── update-cocktail.dto.ts
│   │   │   └── update-cocktail-ingredient.dto.ts
│   │   ├── cocktails-images.service.ts
│   │   ├── cocktails.controller.ts
│   │   ├── cocktails.form-types.ts
│   │   └── cocktails.module.ts
│   ├── codes/                       # Module codes promo
│   │   ├── dto/
│   │   │   └── create-code.dto.ts
│   │   ├── codes.controller.ts
│   │   ├── codes.module.ts
│   │   └── codes.service.ts
│   ├── commandes/                   # Module commandes
│   │   ├── dto/
│   │   │   ├── create-commande.dto.ts
│   │   │   └── update-commande-status.dto.ts
│   │   ├── commandes.constants.ts
│   │   ├── commandes.controller.ts
│   │   ├── commandes.module.ts
│   │   └── commandes.service.ts
│   ├── db/
│   │   └── db.module.ts             # Provider Drizzle injecté via Symbol
│   ├── drizzle/
│   │   ├── schemas/                 # Définitions des tables Drizzle
│   │   │   ├── cocktails.ts
│   │   │   ├── cocktailsCommandes.ts
│   │   │   ├── cocktailsIngredients.ts
│   │   │   ├── codes.ts
│   │   │   ├── commandes.ts
│   │   │   ├── ingredients.ts
│   │   │   └── users.ts
│   │   ├── db.ts                    # Instance Drizzle pour les scripts
│   │   ├── schema.ts                # Re-export centralisé de tous les schémas
│   │   └── seed.ts                  # Données initiales
│   ├── ingredients/                 # Module ingrédients
│   │   ├── dto/
│   │   │   ├── create-ingredient.dto.ts
│   │   │   └── update-ingredient.dto.ts
│   │   ├── ingredients.controller.ts
│   │   ├── ingredients.module.ts
│   │   └── ingredients.service.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── domain/
│   └── entities/                    # Types TypeScript du domaine (sans décorateurs)
│       ├── auth.ts
│       ├── cocktails.ts
│       ├── code.ts
│       ├── commandes.ts
│       └── ingredients.ts
├── drizzle/
│   └── 0000_boring_ego.sql          # Migration initiale
├── drizzle.config.ts
├── nest-cli.json
├── nestia.config.ts
└── package.json
```

Le dossier `domain/entities/` est volontairement séparé de `src/` : il contient les **types purs du domaine** (sans décorateurs NestJS), qui peuvent être partagés avec d'autres packages du monorepo.

---

## 4. Configuration

### 4.1 Variables d'environnement (`.env`)

```env
DATABASE_URL=postgresql://lukyss:lukyssbar@localhost:5432/lukyssbar
PORT=3001
JWT_SECRET=<votre-secret>   # optionnel, défaut : 'dev-secret'
```

Le module `ConfigModule` est chargé globalement dans `AppModule`, ce qui rend `ConfigService` disponible partout sans import supplémentaire.

### 4.2 `nest-cli.json`

Configure le compilateur NestJS pour utiliser **SWC** (compilateur Rust) à la place de `tsc`. SWC est bien plus rapide en mode watch mais ne gère pas les plugins TypeScript, d'où l'usage de `ts-patch` pour la compilation de production.

### 4.3 `tsconfig.json`

Les points notables :

- **Target ES2023** : permet d'utiliser les dernières features JS nativement.
- **Plugins typia activés** : `@nestia/core/lib/transform`, `@nestia/sdk/lib/transform`, `typia/lib/transform`. Ces plugins transforment les types TypeScript en validation runtime au moment de la compilation.
- **`validatorPackage` / `transformerPackage`** : pointent sur `class-validator` et `class-transformer` pour la `ValidationPipe` globale.
- **`moduleResolution: nodenext`** : résolution stricte des modules ES.

### 4.4 `drizzle.config.ts`

```ts
dialect: 'postgresql'
schema: 'src/drizzle/schema.ts'
out: './drizzle'          // dossier de sortie des migrations
url: process.env.DATABASE_URL
```

### 4.5 Scripts `package.json` utiles

| Script | Rôle |
|---|---|
| `start:dev` | Démarrage NestJS en mode watch (SWC) |
| `build` | Compilation de production (ts-patch + tsc) |
| `db:generate` | Génère une migration SQL depuis les changements de schéma |
| `db:migrate` | Applique les migrations en attente |
| `db:seed` | Charge les données initiales |
| `sdk` | Génère le SDK client TypeScript (Nestia) |
| `test` | Lance les tests Jest |

---

## 5. Base de données — Schémas Drizzle

Tous les schémas sont dans `src/drizzle/schemas/` et re-exportés via `src/drizzle/schema.ts`.

### Conventions communes

- **ID** : `text` PRIMARY KEY, généré via `$defaultFn(() => ulid())`. ULID est préféré à UUID car il est lexicographiquement triable par date de création.
- **Timestamps** : `createdAt` est défini à l'insertion, `updatedAt` est mis à jour automatiquement via `$onUpdate(() => new Date())`.
- **Prix** : toujours stockés **en centimes** (entier) pour éviter les erreurs d'arrondi avec les flottants.

### 5.1 Table `users`

```
id          text PK (ULID)
name        text NOT NULL
email       text NOT NULL
password    text NOT NULL  -- hash bcrypt
is_admin    boolean NOT NULL
is_active   boolean NOT NULL
createdAt   timestamp
updatedAt   timestamp
```

Sert uniquement à l'authentification. Un utilisateur inactif (`is_active = false`) ne peut pas se connecter.

### 5.2 Table `cocktails`

```
id          text PK (ULID)
name        text NOT NULL
image       text NULLABLE  -- chemin relatif vers le fichier uploadé
price       integer NOT NULL  -- en centimes
createdAt   timestamp
updatedAt   timestamp
```

`image` est nullable car un cocktail peut être créé sans photo puis illustré plus tard.

### 5.3 Table `ingredients`

```
id          text PK (ULID)
name        text NOT NULL
stock       boolean NOT NULL  -- true = en stock, false = rupture
createdAt   timestamp
updatedAt   timestamp
```

Le champ `stock` est un flag simple qui permet d'afficher côté client si un ingrédient est disponible, sans gérer une quantité numérique (qui complexifierait la gestion).

### 5.4 Table `cocktails_ingredients` (M2M)

```
id            text PK (ULID)
cocktail_id   text FK → cocktails.id
ingredient_id text FK → ingredients.id
quantity      integer NOT NULL
unity         text NOT NULL  -- ex: 'cl', 'feuilles', 'pièce'
createdAt     timestamp
updatedAt     timestamp
```

Table de jonction enrichie qui stocke la **quantité** et l'**unité** de mesure pour chaque ingrédient d'une recette. L'unité est libre (texte) pour couvrir tous les cas (liquides, solides, comptables).

### 5.5 Table `commandes`

```
id              text PK (ULID)
customer_name   text NOT NULL
promo_code      text NOT NULL  -- code promo utilisé (dénormalisé)
public_token    text NOT NULL UNIQUE  -- token hexadécimal pour accès public
total_price     integer NOT NULL  -- en centimes
status          commande_status ENUM
createdAt       timestamp
updatedAt       timestamp
```

`promoCode` est **dénormalisé** intentionnellement : on garde la valeur du code au moment de la commande, même si le code est supprimé ensuite.

`publicToken` est un token de 16 octets hex généré à la création. Il permet à un client non authentifié de consulter sa propre commande via `GET /commandes/public/:token`.

### 5.6 ENUM `commande_status`

```
PENDING         -- Commande reçue, pas encore traitée
CONFIRMED       -- Confirmée par le bar
IN_PREPARATION  -- En cours de préparation
READY           -- Prête à récupérer
COMPLETED       -- Terminée
```

Défini comme type PostgreSQL natif (`pgEnum`) pour bénéficier des contraintes en base.

### 5.7 Table `cocktails_commandes` (M2M)

```
id            text PK (ULID)
cocktail_id   text FK → cocktails.id
commande_id   text FK → commandes.id
quantity      integer NOT NULL
createdAt     timestamp
updatedAt     timestamp
```

Ligne de commande. Contrairement à `cocktails_ingredients`, le prix unitaire n'est pas stocké ici car `totalPrice` sur la commande suffit pour l'instant.

### 5.8 Table `codes`

```
id          text PK (ULID)
code        text NOT NULL  -- ex: 'GRANDOPENING'
createdAt   timestamp
updatedAt   timestamp
```

Table simple des codes promo valides. Un code n'a pas de durée de validité ni de compteur d'usage pour l'instant.

---

## 6. Module Auth

**Chemin :** `src/auth/`

### 6.1 Fonctionnement général

L'authentification repose sur **JWT stateless**. Il n'y a pas de session côté serveur. Le token signé contient l'id, l'email et `is_admin` de l'utilisateur. Durée de vie : **7 jours**.

### 6.2 `AuthService`

Méthode `login(email, password)` :

1. Cherche l'utilisateur par email dans la DB
2. Si introuvable → `UnauthorizedException`
3. Si `is_active = false` → `UnauthorizedException` (compte désactivé)
4. Compare le mot de passe avec le hash bcrypt stocké
5. Si invalide → `UnauthorizedException`
6. Signe un JWT via `JwtService.sign(payload)`
7. Retourne `{ access_token, user: AuthUser }`

### 6.3 `JwtStrategy`

Extends `PassportStrategy(Strategy, 'jwt')`.

- Extrait le token depuis le header `Authorization: Bearer <token>`
- Vérifie la signature avec le secret JWT
- Injecte le payload décodé dans `request.user`

### 6.4 `JwtAuthGuard`

Guard Passport basé sur la stratégie `'jwt'`. À appliquer avec `@UseGuards(JwtAuthGuard)` sur les routes ou contrôleurs protégés.

### 6.5 `RolesGuard`

Guard qui lit les métadonnées `ROLES_KEY` (posées par `@Roles()`).

- Si aucun rôle requis → laisse passer
- Si `'admin'` requis → vérifie que `request.user.is_admin === true`

### 6.6 Décorateur `@Roles(...roles)`

```ts
@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
```

Pose les métadonnées lues par `RolesGuard`.

### 6.7 Route

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Publique | Retourne un JWT si credentials valides |

**Body :**
```json
{ "email": "string", "password": "string" }
```

**Réponse :**
```json
{
  "access_token": "eyJ...",
  "user": { "id": "...", "name": "...", "email": "...", "is_admin": true }
}
```

---

## 7. Module Cocktails

**Chemin :** `src/cocktails/`

### 7.1 `CocktailsService`

| Méthode | Description |
|---|---|
| `list()` | Retourne tous les cocktails |
| `getById(id)` | Cocktail + ses ingrédients avec stocks |
| `create(dto, image?)` | Crée un cocktail, sauvegarde l'image si fournie |
| `update(id, dto, image?)` | Met à jour, remplace l'image si fournie |
| `getCocktailIngredients(cocktailId)` | Liste les ingrédients d'un cocktail |
| `addIngredientToCocktail(cocktailId, dto)` | Ajoute un ingrédient à la recette |
| `updateCocktailIngredient(cocktailId, linkId, dto)` | Modifie quantité/unité/ingrédient |
| `deleteCocktailIngredient(cocktailId, linkId)` | Retire un ingrédient de la recette |

**Validations notables :**

- Vérification de l'existence du cocktail avant toute opération
- Vérification de l'existence de l'ingrédient avant de l'ajouter
- Détection des doublons : un même ingrédient ne peut pas être ajouté deux fois à la même recette (`BadRequestException`)

### 7.2 `CocktailImagesService`

Gère l'upload et la sauvegarde des images de cocktails.

- **Types MIME autorisés :** `image/jpeg`, `image/png`, `image/webp`
- **Taille max :** 5 Mo
- **Stockage :** `uploads/cocktails/` (relatif à la racine du projet)
- **Nommage :** `cocktail-{timestamp}-{random}.{ext}`
- **Retour :** chemin relatif `/uploads/cocktails/{filename}` pour le client

Si aucun fichier n'est fourni, la méthode retourne `null` sans erreur.

### 7.3 Routes

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| GET | `/cocktails` | Publique | Liste tous les cocktails |
| GET | `/cocktails/:id` | Publique | Détail + ingrédients |
| POST | `/cocktails` | Admin | Crée un cocktail (multipart/form-data) |
| PATCH | `/cocktails/:id` | Admin | Met à jour (multipart/form-data) |
| GET | `/cocktails/:id/ingredients` | Publique | Liste les ingrédients de la recette |
| POST | `/cocktails/:id/ingredients` | Admin | Ajoute un ingrédient à la recette |
| PATCH | `/cocktails/:id/ingredients/:linkId` | Admin | Modifie une liaison ingrédient |
| DELETE | `/cocktails/:id/ingredients/:linkId` | Admin | Retire un ingrédient de la recette |

Les routes `POST` et `PATCH` sur `/cocktails` acceptent du **multipart/form-data** pour permettre l'upload simultané des données et de l'image. Les routes sur les ingrédients d'un cocktail acceptent du **JSON**.

### 7.4 DTOs

**`CreateCocktailDto`**
```ts
name: string       // @IsString
price: number      // @IsInt @Min(0)
```

**`UpdateCocktailDto`** (tous optionnels)
```ts
name?: string
price?: number
```

**`AddCocktailIngredientDto`**
```ts
ingredientId: string   // @IsString
quantity: number       // @IsInt @Min(1)
unity: string          // @IsString
```

**`UpdateCocktailIngredientDto`** (tous optionnels)
```ts
ingredientId?: string
quantity?: number
unity?: string
```

---

## 8. Module Ingrédients

**Chemin :** `src/ingredients/`

### 8.1 `IngredientsService`

| Méthode | Description |
|---|---|
| `list()` | Retourne tous les ingrédients |
| `getById(id)` | Détail d'un ingrédient |
| `create(dto)` | Crée un ingrédient |
| `update(id, dto)` | Met à jour un ingrédient |
| `delete(id)` | Supprime un ingrédient |
| `setInStock(id)` | Passe `stock = true` |
| `setOutOfStock(id)` | Passe `stock = false` |

`setInStock` et `setOutOfStock` sont des méthodes dédiées plutôt qu'un simple PATCH pour clarifier l'intention et permettre des endpoints expressifs dans l'API.

### 8.2 Routes

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| GET | `/ingredients` | Publique | Liste tous les ingrédients |
| GET | `/ingredients/:id` | Publique | Détail d'un ingrédient |
| POST | `/ingredients` | Admin | Crée un ingrédient |
| PATCH | `/ingredients/:id` | Admin | Met à jour nom/stock |
| PATCH | `/ingredients/:id/in-stock` | Admin | Marque en stock |
| PATCH | `/ingredients/:id/out-of-stock` | Admin | Marque en rupture |
| DELETE | `/ingredients/:id` | Admin | Supprime |

### 8.3 DTOs

**`CreateIngredientDto`**
```ts
name: string       // @IsString @Length(1, 64)
stock?: boolean    // @IsOptional, défaut: true
```

**`UpdateIngredientDto`** (tous optionnels)
```ts
name?: string      // @Length(1, 64)
stock?: boolean    // @IsBoolean
```

---

## 9. Module Codes Promo

**Chemin :** `src/codes/`

### 9.1 `CodesService`

| Méthode | Description |
|---|---|
| `list()` | Retourne tous les codes promo |
| `create(inputCode?)` | Crée un code (auto-généré si non fourni) |
| `deleteById(id)` | Supprime un code |

**Génération automatique de codes :**

Si aucun code n'est fourni, un code de **4 caractères** est généré aléatoirement depuis l'alphabet `A-Z0-9`. En cas de collision, jusqu'à **5 tentatives** sont effectuées avant de lever une exception. Si un code est fourni, il est normalisé (`trim().toUpperCase()`) avant insertion.

### 9.2 Routes

Toutes les routes de ce module sont **admin-only**.

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| POST | `/codes` | Admin | Crée un code promo |
| GET | `/codes` | Admin | Liste tous les codes |
| DELETE | `/codes/:id` | Admin | Supprime un code |

### 9.3 DTO

**`CreateCodeDto`**
```ts
code?: string    // @IsOptional @IsString @Length(1, 64)
```

---

## 10. Module Commandes

**Chemin :** `src/commandes/`

### 10.1 `CommandesService`

| Méthode | Description |
|---|---|
| `create(dto)` | Crée une commande complète |
| `getById(id)` | Récupère une commande avec ses items |
| `getByPublicToken(token)` | Accès public via token |
| `listAll()` | Liste toutes les commandes (admin) |
| `updateStatus(id, status)` | Change le statut (admin) |

**Flux de création d'une commande (`create`) :**

1. Vérifie que le `promoCode` existe dans la table `codes`
2. Vérifie que tous les `cocktailId` des items existent
3. Calcule le `totalPrice` = somme des `(cocktail.price × quantity)` pour chaque item
4. Génère un `publicToken` = 16 octets aléatoires encodés en hexadécimal
5. Insère la commande avec status `PENDING`
6. Insère toutes les lignes dans `cocktails_commandes`
7. Retourne un `CommandeView` (commande + items enrichis)

### 10.2 Statuts de commande

```
PENDING → CONFIRMED → IN_PREPARATION → READY → COMPLETED
```

La progression est libre (le service permet de passer à n'importe quel statut), c'est le front-office admin qui gère le flux métier.

### 10.3 Routes

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| POST | `/commandes` | Publique | Crée une commande |
| GET | `/commandes/public/:token` | Publique | Consulter sa commande via token |
| GET | `/commandes` | Admin | Liste toutes les commandes |
| GET | `/commandes/:id` | JWT | Détail d'une commande |
| PATCH | `/commandes/:id/status` | Admin | Met à jour le statut |

L'endpoint `GET /commandes/public/:token` permet à un client de suivre sa commande **sans compte** grâce au token unique remis à la création.

### 10.4 DTOs

**`CreateCommandeDto`**
```ts
customerName: string                   // @IsString
promoCode: string                      // @IsString
items: CreateCommandeItemDto[]         // @IsArray @ArrayMinSize(1) @ValidateNested
  └─ cocktailId: string                // @IsString
  └─ quantity: number                  // @IsInt @Min(1)
```

**`UpdateCommandeStatusDto`**
```ts
status: CommandeStatus    // @IsIn(['PENDING','CONFIRMED','IN_PREPARATION','READY','COMPLETED'])
```

---

## 11. Module DB

**Chemin :** `src/db/db.module.ts`

### Rôle

Ce module centralise la création de l'instance **Drizzle ORM** et l'expose à tous les autres modules via l'injection de dépendances NestJS.

### Fonctionnement

```ts
const DB = Symbol('DB');   // token d'injection

// Factory asynchrone utilisant ConfigService
useFactory: (config: ConfigService) => {
  const pool = new Pool({ connectionString: config.get('DATABASE_URL') });
  return drizzle(pool);
}
```

Chaque module feature (`AuthModule`, `CocktailsModule`, etc.) importe `DbModule` et injecte le provider via `@Inject(DB)`. L'utilisation d'un `Symbol` comme token évite les collisions de nommage.

---

## 12. Bootstrap & Module racine

### 12.1 `main.ts`

Configuration au démarrage :

**`ValidationPipe` global :**
```ts
whitelist: true              // Supprime silencieusement les propriétés inconnues
forbidNonWhitelisted: true   // Lève une erreur si des propriétés inconnues sont envoyées
transform: true              // Convertit automatiquement les types (string → number, etc.)
```

**Swagger :**
- Généré via `NestiaSwaggerComposer` (compatible OpenAPI 3.1)
- Serveur déclaré : `http://localhost:{PORT}`
- Accessible sur : `/docs`

### 12.2 `AppModule`

```ts
imports: [
  ConfigModule.forRoot({ isGlobal: true }),   // Variables d'env disponibles partout
  DbModule,
  AuthModule,
  CocktailsModule,
  CodesModule,
  IngredientsModule,
  CommandesModule,
]
```

### 12.3 Routes racines

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/` | Message de bienvenue avec liste des routes |
| GET | `/health` | Health check (`{ status: 'ok', timestamp }`) |

---

## 13. Sécurité & Guards

### 13.1 Architecture

```
Request
  └─ JwtAuthGuard          → vérifie et décode le JWT
       └─ JwtStrategy      → extrait le payload, injecte dans request.user
            └─ RolesGuard  → vérifie request.user.is_admin si @Roles('admin')
```

### 13.2 Niveaux d'accès

| Niveau | Mécanisme | Routes concernées |
|---|---|---|
| **Public** | Aucun guard | GET /cocktails, GET /ingredients, POST /commandes, GET /commandes/public/:token, POST /auth/login |
| **Authentifié** | `@UseGuards(JwtAuthGuard)` | GET /commandes/:id |
| **Admin** | `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('admin')` | Toutes les routes POST/PATCH/DELETE sur les ressources, GET /commandes, GET /codes |

### 13.3 Gestion des erreurs d'auth

| Situation | Exception levée |
|---|---|
| Utilisateur introuvable | `UnauthorizedException` |
| Compte inactif | `UnauthorizedException` |
| Mot de passe incorrect | `UnauthorizedException` |
| Token absent ou invalide | `UnauthorizedException` (Passport) |
| Token valide mais rôle insuffisant | `ForbiddenException` (RolesGuard) |

---

## 14. Validation & Transformation

### 14.1 class-validator

Décorateurs utilisés dans les DTOs :

| Décorateur | Usage |
|---|---|
| `@IsString()` | Valide que le champ est une chaîne |
| `@IsEmail()` | Valide le format email |
| `@IsInt()` | Valide un entier |
| `@Min(n)` | Valeur minimum |
| `@IsBoolean()` | Valide un booléen |
| `@IsArray()` | Valide un tableau |
| `@ArrayMinSize(n)` | Taille minimale d'un tableau |
| `@ValidateNested()` | Valide récursivement les objets imbriqués |
| `@IsOptional()` | Champ optionnel |
| `@IsIn([...])` | Valeur parmi une liste |
| `@Length(min, max)` | Longueur d'une chaîne |

### 14.2 typia (via Nestia)

Pour les routes utilisant `TypedRoute` (Nestia), la validation est **compilée** par le plugin TypeScript au moment du build. Cela remplace la réflexion runtime par du code de validation généré statiquement, ce qui améliore les performances.

---

## 15. SDK Nestia

**Fichier de config :** `nestia.config.ts`

Nestia génère automatiquement un **SDK TypeScript client** à partir des contrôleurs NestJS. Le SDK est généré dans `packages/nestia-sdk/src/` du monorepo.

**Contrôleurs inclus dans le SDK :**
- `commandes.controller`
- `codes.controller`
- `ingredients.controller`
- `cocktails.controller`
- `auth.controller`

**Commande :** `npm run sdk`

Ce SDK peut ensuite être importé par les applications front-end (Next.js, React, etc.) pour bénéficier d'un client typé de l'API sans avoir à écrire les appels HTTP manuellement.

---

## 16. Seed de la base de données

**Fichier :** `src/drizzle/seed.ts`  
**Commande :** `npm run db:seed`

Le seed remet la base dans un état connu et rechargeable. Il supprime toutes les données existantes puis insère :

**Ingrédients (8) :** Rhum blanc, Menthe, Citron vert, Sucre de canne, Eau gazeuse, Vodka, Jus d'orange, Grenadine

**Cocktails (3) :**

| Cocktail | Prix | Recette |
|---|---|---|
| Mojito | 9€ | Rhum blanc 5cl, Menthe 10 feuilles, Citron vert 1 pièce, Sucre de canne 2cl, Eau gazeuse 10cl |
| Screwdriver | 8€ | Vodka 5cl, Jus d'orange 15cl |
| Tequila Sunrise | 9€ | Jus d'orange 15cl, Grenadine 2cl |

**Code promo :** `GRANDOPENING`

**Commandes de test (2) :**
- Alice Martin : 2× Mojito + 1× Screwdriver = 26€ (PENDING)
- Bob Dupont : 1× Tequila Sunrise = 9€ (READY)

**Admin :**
- Email : `quentin.lkss@gmail.com`
- Mot de passe : `masterbarman` (stocké hashé bcrypt)

---

## 17. Migrations Drizzle

**Dossier :** `apps/api/drizzle/`  
**Fichier actuel :** `0000_boring_ego.sql`

### Workflow migrations

```bash
# 1. Modifier les schémas dans src/drizzle/schemas/
# 2. Générer la migration
npm run db:generate

# 3. Vérifier le SQL généré dans apps/api/drizzle/
# 4. Appliquer en base
npm run db:migrate
```

### Contenu de la migration initiale

Crée l'ensemble du schéma :
- Type ENUM PostgreSQL `commande_status` (5 valeurs)
- 7 tables : `users`, `cocktails`, `ingredients`, `commandes`, `codes`, `cocktails_ingredients`, `cocktails_commandes`
- Toutes les Foreign Keys pour les relations M2M
- Contrainte `UNIQUE` sur `commandes.public_token`
- Timestamps avec triggers d'auto-update

---

## 18. Diagramme entité-relation

```
┌─────────────────┐     ┌────────────────────────────┐     ┌──────────────────┐
│     COCKTAILS   │     │   COCKTAILS_INGREDIENTS     │     │   INGREDIENTS    │
├─────────────────┤     ├────────────────────────────┤     ├──────────────────┤
│ id (PK)         │◄───┤ cocktail_id (FK)            │────►│ id (PK)          │
│ name            │     │ ingredient_id (FK)          │     │ name             │
│ image           │     │ quantity                    │     │ stock            │
│ price           │     │ unity                       │     └──────────────────┘
└────────┬────────┘     └────────────────────────────┘
         │
         │              ┌────────────────────────────┐     ┌──────────────────┐
         │              │   COCKTAILS_COMMANDES       │     │    COMMANDES     │
         │              ├────────────────────────────┤     ├──────────────────┤
         └─────────────►│ cocktail_id (FK)            │     │ id (PK)          │
                        │ commande_id (FK)            │◄────│ customer_name    │
                        │ quantity                    │     │ promo_code       │
                        └────────────────────────────┘     │ public_token     │
                                                           │ total_price      │
┌─────────────────┐                                        │ status (ENUM)    │
│      USERS      │                                        └──────────────────┘
├─────────────────┤
│ id (PK)         │     ┌──────────────────┐
│ name            │     │      CODES       │
│ email           │     ├──────────────────┤
│ password (hash) │     │ id (PK)          │
│ is_admin        │     │ code             │
│ is_active       │     └──────────────────┘
└─────────────────┘
```

---

## 19. Récapitulatif des endpoints

### Routes publiques

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/` | Bienvenue |
| GET | `/health` | Health check |
| POST | `/auth/login` | Connexion |
| GET | `/cocktails` | Liste les cocktails |
| GET | `/cocktails/:id` | Détail d'un cocktail + ingrédients |
| GET | `/cocktails/:id/ingredients` | Ingrédients d'un cocktail |
| GET | `/ingredients` | Liste les ingrédients |
| GET | `/ingredients/:id` | Détail d'un ingrédient |
| POST | `/commandes` | Passer une commande |
| GET | `/commandes/public/:token` | Suivre sa commande |

### Routes authentifiées (JWT)

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/commandes/:id` | Détail d'une commande |

### Routes admin (JWT + is_admin)

| Méthode | Chemin | Description |
|---|---|---|
| POST | `/cocktails` | Créer un cocktail |
| PATCH | `/cocktails/:id` | Modifier un cocktail |
| POST | `/cocktails/:id/ingredients` | Ajouter un ingrédient |
| PATCH | `/cocktails/:id/ingredients/:linkId` | Modifier une liaison |
| DELETE | `/cocktails/:id/ingredients/:linkId` | Supprimer une liaison |
| POST | `/ingredients` | Créer un ingrédient |
| PATCH | `/ingredients/:id` | Modifier un ingrédient |
| PATCH | `/ingredients/:id/in-stock` | Marquer en stock |
| PATCH | `/ingredients/:id/out-of-stock` | Marquer en rupture |
| DELETE | `/ingredients/:id` | Supprimer un ingrédient |
| POST | `/codes` | Créer un code promo |
| GET | `/codes` | Lister les codes promo |
| DELETE | `/codes/:id` | Supprimer un code promo |
| GET | `/commandes` | Lister toutes les commandes |
| PATCH | `/commandes/:id/status` | Mettre à jour le statut |

---

## 20. Module tRPC (POC)

**Chemin :** `src/trpc/`  
**Packages ajoutés :** `@trpc/server@^11`, `zod@^3`

### Objectif

Intégrer tRPC en parallèle de l'API REST existante, sans toucher aux modules en place, pour valider la faisabilité d'un typage end-to-end sans génération de code côté client (contrairement au SDK Nestia). tRPC expose un router monté en tant que middleware Express sur `/trpc`.

### Structure

```
src/trpc/
├── trpc.init.ts       # initTRPC, createContext, publicProcedure
├── trpc.service.ts    # TrpcService — construit le router via DI NestJS
├── trpc.middleware.ts # NestMiddleware — adapte tRPC à Express
└── trpc.module.ts     # NestModule — enregistre le middleware sur /trpc
```

### 20.1 `trpc.init.ts` — Initialisation

```ts
export function createContext({ req, res }: CreateExpressContextOptions) {
  return { req, res };
}
export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();
export const router = t.router;
export const publicProcedure = t.procedure;
```

Le contexte expose `req` et `res` pour permettre aux procédures d'accéder aux headers (utile plus tard pour l'authentification JWT).

### 20.2 `TrpcService` — Router

```ts
@Injectable()
export class TrpcService {
  readonly appRouter: ReturnType<typeof this.createRouter>;

  constructor(private readonly cocktailsService: CocktailsService) {
    this.appRouter = this.createRouter();
  }

  private createRouter() {
    return router({
      cocktails: router({
        list: publicProcedure.query(() => this.cocktailsService.list()),
        getById: publicProcedure
          .input(z.object({ id: z.string() }))
          .query(({ input }) => this.cocktailsService.getById(input.id)),
      }),
    });
  }
}

export type AppRouter = TrpcService['appRouter'];
```

Le router est construit **dans le constructeur** (pas en propriété de classe) pour garantir que l'injection NestJS est complète avant son initialisation. `CocktailsService` est réutilisé directement : pas de doublon de logique métier.

`AppRouter` est exporté en tant que type pur — il peut être importé par un client TypeScript pour bénéficier du typage complet sans aucune génération de code.

### 20.3 `TrpcMiddleware` — Adapter Express

```ts
@Injectable()
export class TrpcMiddleware implements NestMiddleware {
  constructor(private readonly trpcService: TrpcService) {}

  use(req: Request, res: Response, next: NextFunction) {
    return createExpressMiddleware({
      router: this.trpcService.appRouter,
      createContext,
    })(req, res, next);
  }
}
```

`createExpressMiddleware` est l'adaptateur officiel tRPC pour Express. NestJS utilisant Express sous le capot, il s'intègre sans friction.

### 20.4 `TrpcModule` — Enregistrement

```ts
@Module({
  imports: [CocktailsModule],
  providers: [TrpcService, TrpcMiddleware],
})
export class TrpcModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TrpcMiddleware).forRoutes('/trpc');
  }
}
```

Le module importe `CocktailsModule` (qui exporte `CocktailsService`) et monte le middleware sur le préfixe `/trpc`. Tout appel vers `/trpc/*` est intercepté par tRPC avant d'atteindre les contrôleurs NestJS.

`CocktailsModule` a été mis à jour pour exporter `CocktailsService` :
```ts
exports: [CocktailsService]
```

### 20.5 Procédures exposées

| Procédure tRPC | Type | Input | Description |
|---|---|---|---|
| `cocktails.list` | query | — | Liste tous les cocktails |
| `cocktails.getById` | query | `{ id: string }` | Retourne un cocktail + ses ingrédients |

**Exemples d'appels (client HTTP brut) :**

```
GET /trpc/cocktails.list
GET /trpc/cocktails.getById?input={"id":"01JXXXXXXXXXXXXXXXX"}
```

### 20.6 Différences avec l'API REST

| Aspect | REST (Nestia) | tRPC |
|---|---|---|
| Transport | HTTP REST (GET/POST/PATCH/DELETE) | HTTP POST uniquement |
| Typage client | SDK généré (`npm run sdk`) | Import direct du type `AppRouter` |
| Validation input | class-validator + DTOs | Zod inline |
| Documentation | Swagger `/docs` | Inférence TypeScript |
| Cas d'usage | Clients hétérogènes, API publique | Clients TypeScript fullstack uniquement |

---

## 21. WebSocket — Suivi de commande en temps réel

### Objectif

Permettre à un client de suivre l'évolution du statut de sa commande en temps réel, sans polling. Quand un admin met à jour le statut via `PATCH /commandes/:id/status`, l'événement est immédiatement poussé vers le client connecté via socket.io.

### Stack

- **`@nestjs/websockets`** + **`@nestjs/platform-socket.io`** — intégration WebSocket NestJS
- **`socket.io`** (serveur) + **`socket.io-client`** (frontend)

### Structure

```
apps/api/src/commandes/
├── commandes.gateway.ts   ← nouveau : WebSocket gateway
├── commandes.service.ts   ← modifié : émet l'event après updateStatus
└── commandes.module.ts    ← modifié : enregistre CommandesGateway
```

### 21.1 `CommandesGateway`

```ts
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true },
})
export class CommandesGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join:commande')
  handleJoin(@MessageBody() token: string, @ConnectedSocket() client: Socket) {
    client.join(`commande:${token}`);
  }

  emitStatusUpdate(publicToken: string, status: string) {
    this.server.to(`commande:${publicToken}`).emit('commande:status', { status });
  }
}
```

**Principe des rooms socket.io :** à la connexion, le client envoie `join:commande` avec le `publicToken` de sa commande. Le serveur l'ajoute à la room `commande:{token}`. Quand le statut change, seuls les clients de cette room reçoivent l'événement.

### 21.2 Émission depuis `CommandesService`

```ts
async updateStatus(id: string, status: CommandeStatus): Promise<CommandeRow> {
  const [updated] = await this.db
    .update(commandes).set({ status }).where(eq(commandes.id, id)).returning();

  if (!updated) throw new NotFoundException('Commande introuvable');

  // Pousse le nouveau statut vers tous les clients qui suivent cette commande
  this.gateway.emitStatusUpdate(updated.publicToken, updated.status);

  return updated;
}
```

Le gateway est injecté via le constructeur grâce au DI NestJS. Aucun couplage direct entre le contrôleur et le WebSocket.

### 21.3 Enregistrement dans `CommandesModule`

```ts
@Module({
  imports: [DbModule],
  controllers: [CommandesController],
  providers: [CommandesService, CommandesGateway],
})
export class CommandesModule {}
```

`CommandesGateway` est déclaré comme `provider` au même titre que le service. NestJS gère son cycle de vie et son injection automatiquement.

### 21.4 Client Next.js (`/commandes/[token]`)

```ts
useEffect(() => {
  const socket = io(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001', {
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    socket.emit('join:commande', token); // rejoint la room
  });

  socket.on('commande:status', ({ status }) => {
    setData((prev) =>
      prev ? { ...prev, commande: { ...prev.commande, status } } : prev
    );
  });

  return () => socket.disconnect();
}, [token]);
```

Le `fetchCommande()` initial (REST) charge l'état courant au montage. Ensuite socket.io prend le relais pour les mises à jour.

### 21.5 Flux complet

```
Admin (PATCH /commandes/:id/status)
  → CommandesController
  → CommandesService.updateStatus()
      → DB update
      → CommandesGateway.emitStatusUpdate(publicToken, status)
          → socket.io room "commande:{token}"
              → Client web reçoit "commande:status"
                  → React state mis à jour instantanément
```

### 21.6 CORS WebSocket

Le gateway configure son propre CORS indépendamment du CORS HTTP déclaré dans `main.ts` :

```ts
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true },
})
```

Les deux configurations (`app.enableCors()` pour HTTP et le décorateur `@WebSocketGateway` pour WS) doivent être cohérentes.

---

## 22. Convex — Notifications temps réel (POC)

### Objectif

Démontrer qu'une feature temps réel peut être branchée **directement sur le frontend**, sans passer par l'API NestJS, en utilisant [Convex](https://convex.dev) en self-hosted (Docker). Les notifications se propagent instantanément à tous les clients sans polling ni WebSocket manuel.

### Infrastructure

Convex tourne en local via Docker Compose (`convex.yml`) :

- **Backend** : `ghcr.io/get-convex/convex-backend:latest` → port `3210`
- **Dashboard** : `ghcr.io/get-convex/convex-dashboard:latest` → port `6791`
- **Stockage** : volume Docker `data:/convex/data`

```bash
docker compose -f convex.yml up -d
```

> **Attention** : ne pas mettre `DATABASE_URL` avec un nom de base dans l'URL (`/lukyssbar`). Convex gère sa propre base — passer `DATABASE_URL=` (vide) dans `convex.yml` pour éviter le conflit avec le `.env` racine.

Pour synchroniser le schéma et les fonctions sur l'instance locale :

```bash
npx convex dev --url http://localhost:3210
```

### Structure

```
convex/
├── schema.ts          # Définition de la table notifications
├── notifications.ts   # Query + mutations
└── _generated/        # Auto-généré par convex dev
    ├── api.d.ts
    ├── api.js
    ├── dataModel.d.ts
    ├── server.d.ts
    └── server.js
```

### 22.1 `convex/schema.ts` — Schéma

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  notifications: defineTable({
    message: v.string(),
    type: v.union(v.literal("info"), v.literal("success"), v.literal("error")),
    read: v.boolean(),
  }).index("by_read", ["read"]),
});
```

### 22.2 `convex/notifications.ts` — Fonctions

```ts
export const list = query({
  args: {},
  handler: async (ctx) =>
    await ctx.db.query("notifications").order("desc").collect(),
});

export const add = mutation({
  args: { message: v.string(), type: v.union(...) },
  handler: async (ctx, { message, type }) =>
    await ctx.db.insert("notifications", { message, type, read: false }),
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => ctx.db.patch(id, { read: true }),
});

export const remove = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});
```

### 22.3 Intégration Next.js (`apps/web`)

**Dépendance** : `convex` ajoutée dans `apps/web/package.json`.

**Alias tsconfig** (`apps/web/tsconfig.json`) pour résoudre les fichiers générés hors du projet Next :

```json
"paths": {
  "@/*": ["./*"],
  "@convex/*": ["../../convex/*"]
}
```

Turbopack (Next.js 16) résout automatiquement les alias tsconfig — aucune configuration `webpack` nécessaire.

**Provider** (`apps/web/components/convex-provider.tsx`) :

```tsx
"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? "http://localhost:3210"
);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

Wrappé dans `apps/web/app/layout.tsx` autour de `{children}`.

### 22.4 Page POC (`/notifications`)

```tsx
const notifications = useQuery(api.notifications.list);  // temps réel automatique
const add           = useMutation(api.notifications.add);
const markRead      = useMutation(api.notifications.markRead);
const remove        = useMutation(api.notifications.remove);
```

`useQuery` de Convex maintient une connexion live : tout insert/update déclenche un re-render immédiat sur tous les clients connectés, sans polling.

### 22.5 Différences avec Socket.io (section 21)

| | WebSocket (Socket.io) | Convex |
|---|---|---|
| Infra | Géré dans NestJS | Backend séparé (Docker) |
| Côté serveur | `CommandesGateway` + rooms | Fonctions `query` / `mutation` |
| Côté client | `io()` + listeners manuels | `useQuery` / `useMutation` |
| Persistance | Non (événements éphémères) | Oui (base de données intégrée) |
| Temps réel | Push manuel (`emit`) | Réactif automatique |
| Cas d'usage ici | Suivi statut commande | Notifications persistantes |

---

*Documentation générée depuis l'analyse du code source de `apps/api/`.*
