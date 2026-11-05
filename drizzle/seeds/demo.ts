import { ulid } from "ulid";
import type { AppDb } from "../../src/db";
import { users, shops, products, platformSettings } from "../../src/db";
import { eq } from "drizzle-orm";

/**
 * Seed de démonstration pour développement local Jaayma.sn
 * Idempotent : vérifie la présence avant insertion.
 */
export async function seedDemo(db: AppDb) {
  console.log("🌱 Début du seed de démonstration...");

  // 1. Paramètres de la plateforme
  const existingSettings = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.id, "global"))
    .get();

  if (!existingSettings) {
    await db.insert(platformSettings).values({
      id: "global",
      explorerEnabled: true,
      maintenanceEnabled: false,
      proPriceXof: 1000,
      proPlusPriceXof: 10000,
      updatedAt: new Date(),
    });
    console.log("✅ Paramètres plateforme initialisés.");
  }

  // 2. Utilisateur vendeur de démo
  const demoPhone = "+221770000001";
  let demoUser = await db
    .select()
    .from(users)
    .where(eq(users.phone, demoPhone))
    .get();

  if (!demoUser) {
    const userId = ulid();
    // Le hash réel sera calculé avec pbkdf2 dans le service auth
    await db.insert(users).values({
      id: userId,
      phone: demoPhone,
      name: "Moussa Diop",
      passwordHash: "demo_hash_to_be_updated",
      role: "seller",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    demoUser = await db.select().from(users).where(eq(users.id, userId)).get();
    console.log("✅ Vendeur de démo créé :", demoPhone);
  }

  // 3. Boutique de démo
  const demoSlug = "boutique-demo";
  let demoShop = await db
    .select()
    .from(shops)
    .where(eq(shops.slug, demoSlug))
    .get();

  if (!demoShop && demoUser) {
    const shopId = ulid();
    await db.insert(shops).values({
      id: shopId,
      ownerId: demoUser.id,
      slug: demoSlug,
      name: "Teranga Style",
      headline: "Mode & Accessoires traditionnels sénégalais",
      area: "Plateau, Dakar",
      description: "Articles confectionnés avec soin au cœur de Dakar.",
      category: "Mode",
      themeColor: "#C8265A",
      whatsapp: demoPhone,
      deliveryFee: 1500,
      deliveryNote: "Livraison partout à Dakar sous 24h",
      status: "ACTIVE",
      featured: true,
      plan: "free",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    demoShop = await db.select().from(shops).where(eq(shops.id, shopId)).get();
    console.log("✅ Boutique de démo créée :", demoSlug);
  }

  // 4. Produits de démo
  if (demoShop) {
    const existingProducts = await db
      .select()
      .from(products)
      .where(eq(products.shopId, demoShop.id))
      .all();

    if (existingProducts.length === 0) {
      await db.insert(products).values([
        {
          id: ulid(),
          shopId: demoShop.id,
          name: "Boubou Traditionnel Bazin Riche",
          description: "Magnifique ensemble 3 pièces bazin brodé.",
          price: 35000,
          stock: 5,
          position: 0,
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: ulid(),
          shopId: demoShop.id,
          name: "Collier Perles artisanales",
          description: "Collier fait main aux couleurs chaudes.",
          price: 8500,
          stock: 12,
          position: 1,
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      console.log("✅ 2 produits de démo créés.");
    }
  }

  console.log("🎉 Seed de démonstration terminé.");
}

