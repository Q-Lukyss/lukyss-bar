-- Portage du schema Drizzle (apps/api/drizzle/0000_silky_black_tarantula.sql)
CREATE TYPE "commande_status" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PREPARATION', 'READY', 'COMPLETED');

CREATE TABLE "cocktails" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "image" text,
    "price" integer NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "ingredients" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "stock" boolean NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "codes" (
    "id" text PRIMARY KEY NOT NULL,
    "code" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "commandes" (
    "id" text PRIMARY KEY NOT NULL,
    "customer_name" text NOT NULL,
    "promo_code" text NOT NULL,
    "public_token" text NOT NULL,
    "total_price" integer NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "status" "commande_status" DEFAULT 'PENDING' NOT NULL,
    CONSTRAINT "commandes_public_token_unique" UNIQUE ("public_token")
);

CREATE TABLE "cocktails_commandes" (
    "id" text PRIMARY KEY NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "cocktail_id" text NOT NULL REFERENCES "cocktails" ("id"),
    "quantity" integer NOT NULL,
    "commande_id" text NOT NULL REFERENCES "commandes" ("id")
);

CREATE TABLE "cocktails_ingredients" (
    "id" text PRIMARY KEY NOT NULL,
    "cocktail_id" text NOT NULL REFERENCES "cocktails" ("id"),
    "ingredient_id" text NOT NULL REFERENCES "ingredients" ("id"),
    "quantity" integer NOT NULL,
    "unity" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "users" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "password" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "is_admin" boolean NOT NULL,
    "is_active" boolean NOT NULL
);
