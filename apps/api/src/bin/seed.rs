use std::collections::HashMap;

use anyhow::Context;
use sqlx::postgres::PgPoolOptions;
use ulid::Ulid;
use uuid::Uuid;

/// Miroir de `apps/api/src/drizzle/seed.ts` — même jeu de données de dev.
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    let database_url = std::env::var("DATABASE_URL")?;
    let pool = PgPoolOptions::new().connect(&database_url).await?;

    sqlx::query!("DELETE FROM cocktails_commandes")
        .execute(&pool)
        .await?;
    sqlx::query!("DELETE FROM cocktails_ingredients")
        .execute(&pool)
        .await?;
    sqlx::query!("DELETE FROM commandes").execute(&pool).await?;
    sqlx::query!("DELETE FROM cocktails").execute(&pool).await?;
    sqlx::query!("DELETE FROM ingredients")
        .execute(&pool)
        .await?;
    sqlx::query!("DELETE FROM codes").execute(&pool).await?;
    sqlx::query!("DELETE FROM users").execute(&pool).await?;

    // 1) Ingredients
    let ingredient_defs = [
        "Rhum blanc",
        "Menthe",
        "Citron vert",
        "Sucre de canne",
        "Eau gazeuse",
        "Vodka",
        "Jus d'orange",
        "Grenadine",
    ];
    let mut ingredient_ids: HashMap<&str, String> = HashMap::new();
    for name in ingredient_defs {
        let id = Ulid::new().to_string();
        sqlx::query!(
            "INSERT INTO ingredients (id, name, stock) VALUES ($1, $2, true)",
            id,
            name
        )
        .execute(&pool)
        .await?;
        ingredient_ids.insert(name, id);
    }

    // 2) Cocktails
    let cocktail_defs: [(&str, i32); 3] =
        [("Mojito", 9), ("Screwdriver", 8), ("Tequila Sunrise", 9)];
    let mut cocktail_ids: HashMap<&str, String> = HashMap::new();
    for (name, price) in cocktail_defs {
        let id = Ulid::new().to_string();
        sqlx::query!(
            "INSERT INTO cocktails (id, name, image, price) VALUES ($1, $2, NULL, $3)",
            id,
            name,
            price
        )
        .execute(&pool)
        .await?;
        cocktail_ids.insert(name, id);
    }

    // 3) Recettes cocktails
    let recipe_defs: [(&str, &str, i32, &str); 9] = [
        ("Mojito", "Rhum blanc", 5, "cl"),
        ("Mojito", "Menthe", 10, "feuilles"),
        ("Mojito", "Citron vert", 1, "pièce"),
        ("Mojito", "Sucre de canne", 2, "cl"),
        ("Mojito", "Eau gazeuse", 10, "cl"),
        ("Screwdriver", "Vodka", 5, "cl"),
        ("Screwdriver", "Jus d'orange", 15, "cl"),
        ("Tequila Sunrise", "Jus d'orange", 15, "cl"),
        ("Tequila Sunrise", "Grenadine", 2, "cl"),
    ];
    for (cocktail_name, ingredient_name, quantity, unity) in recipe_defs {
        let id = Ulid::new().to_string();
        sqlx::query!(
            "INSERT INTO cocktails_ingredients (id, cocktail_id, ingredient_id, quantity, unity) VALUES ($1, $2, $3, $4, $5)",
            id,
            cocktail_ids[cocktail_name],
            ingredient_ids[ingredient_name],
            quantity,
            unity
        )
        .execute(&pool)
        .await?;
    }

    // 4) Codes promo
    let promo_code = "GRANDOPENING";
    sqlx::query!(
        "INSERT INTO codes (id, code) VALUES ($1, $2)",
        Ulid::new().to_string(),
        promo_code
    )
    .execute(&pool)
    .await?;

    // 5) Commandes
    let commande1_id = Ulid::new().to_string();
    let commande2_id = Ulid::new().to_string();
    let commande1_total = cocktail_defs[0].1 * 2 + cocktail_defs[1].1; // Mojito*2 + Screwdriver
    let commande2_total = cocktail_defs[2].1; // Tequila Sunrise

    sqlx::query!(
        r#"INSERT INTO commandes (id, customer_name, promo_code, public_token, total_price, status)
           VALUES ($1, $2, $3, $4, $5, 'PENDING'::commande_status)"#,
        commande1_id,
        "Alice Martin",
        promo_code,
        Uuid::new_v4().simple().to_string(),
        commande1_total
    )
    .execute(&pool)
    .await?;

    sqlx::query!(
        r#"INSERT INTO commandes (id, customer_name, promo_code, public_token, total_price, status)
           VALUES ($1, $2, $3, $4, $5, 'READY'::commande_status)"#,
        commande2_id,
        "Bob Dupont",
        promo_code,
        Uuid::new_v4().simple().to_string(),
        commande2_total
    )
    .execute(&pool)
    .await?;

    // 6) Lignes de commande
    let line_defs = [
        (commande1_id.clone(), "Mojito", 2i32),
        (commande1_id.clone(), "Screwdriver", 1i32),
        (commande2_id.clone(), "Tequila Sunrise", 1i32),
    ];
    for (commande_id, cocktail_name, quantity) in line_defs {
        sqlx::query!(
            "INSERT INTO cocktails_commandes (id, cocktail_id, quantity, commande_id) VALUES ($1, $2, $3, $4)",
            Ulid::new().to_string(),
            cocktail_ids[cocktail_name],
            quantity,
            commande_id
        )
        .execute(&pool)
        .await?;
    }

    // 7) User admin — le mot de passe vient de l'environnement (jamais en
    // dur dans le code), pour pouvoir seeder un vrai admin en prod avec un
    // mot de passe différent de celui utilisé en dev/CI :
    // `docker compose exec -e SEED_ADMIN_PASSWORD='...' api seed`.
    let admin_password = std::env::var("SEED_ADMIN_PASSWORD")
        .context("SEED_ADMIN_PASSWORD est manquant dans l'environnement")?;
    let hashed = bcrypt::hash(&admin_password, bcrypt::DEFAULT_COST)?;
    sqlx::query!(
        "INSERT INTO users (id, name, email, password, is_active, is_admin) VALUES ($1, $2, $3, $4, true, true)",
        Ulid::new().to_string(),
        "Quentin Lachery",
        "quentin.lkss@gmail.com",
        hashed
    )
    .execute(&pool)
    .await?;

    println!("✅ Seed OK");
    Ok(())
}
