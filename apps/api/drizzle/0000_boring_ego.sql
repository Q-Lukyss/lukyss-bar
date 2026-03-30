CREATE TYPE "public"."commande_status" AS ENUM('PENDING', 'CONFIRMED', 'IN_PREPARATION', 'READY', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "cocktails" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"price" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cocktails_commandes" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"cocktail_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"commande_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cocktails_ingredients" (
	"id" text PRIMARY KEY NOT NULL,
	"cocktail_id" text NOT NULL,
	"ingredient_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"unity" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "codes" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commandes" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"promo_code" text NOT NULL,
	"public_token" text NOT NULL,
	"total_price" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"status" "commande_status" DEFAULT 'PENDING' NOT NULL,
	CONSTRAINT "commandes_public_token_unique" UNIQUE("public_token")
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"stock" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "cocktails_commandes" ADD CONSTRAINT "cocktails_commandes_cocktail_id_cocktails_id_fk" FOREIGN KEY ("cocktail_id") REFERENCES "public"."cocktails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cocktails_commandes" ADD CONSTRAINT "cocktails_commandes_commande_id_commandes_id_fk" FOREIGN KEY ("commande_id") REFERENCES "public"."commandes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cocktails_ingredients" ADD CONSTRAINT "cocktails_ingredients_cocktail_id_cocktails_id_fk" FOREIGN KEY ("cocktail_id") REFERENCES "public"."cocktails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cocktails_ingredients" ADD CONSTRAINT "cocktails_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;