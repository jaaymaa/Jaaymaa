# Plan de Migration de l'API externe vers Cloudflare D1 & R2

> Ce document détaille la cartographie complète des fonctions de `src/lib/api.ts` vers les futurs services D1/R2 locaux, ainsi que l'ordre des remplacements.

---

## 1. Cartographie des fonctions API

### Authentification & Sessions
| Fonction existante | Service cible D1 | Fichiers impactés |
|---|---|---|
| `api.register(data)` | `authService.register(phone, password, name)` | `src/app/actions/auth.ts`, `src/lib/auth.ts` |
| `api.login(data)` | `authService.login(phone, password)` | `src/app/actions/auth.ts`, `src/lib/auth.ts` |
| `api.getMe(token)` | `authService.getSessionUser(token)` | `src/lib/auth.ts`, Server Components |

### Boutiques (Shops)
| Fonction existante | Service cible D1 | Fichiers impactés |
|---|---|---|
| `api.getShops(params)` | `shopService.listShops(filters)` | `src/app/explorer/page.tsx`, `src/app/api/explore/shops` |
| `api.getExploreShops(params)` | `shopService.exploreShops(filters, pagination)` | `src/app/explorer/page.tsx`, API explore |
| `api.getShopBySlug(slug)` | `shopService.getBySlug(slug)` | `src/app/[shopSlug]/page.tsx`, layout, checkout |
| `api.getShopById(id)` | `shopService.getById(id)` | Server Actions |
| `api.getShopByOwner(ownerId, token)` | `shopService.getByOwnerId(ownerId)` | `src/app/espace/page.tsx`, `src/app/actions/shop.ts` |
| `api.createShop(data, token)` | `shopService.create(data, ownerId)` | `src/app/actions/shop.ts` |
| `api.updateShop(id, data, token)` | `shopService.update(id, data, ownerId)` | `src/app/actions/shop.ts` |

### Produits (Products)
| Fonction existante | Service cible D1 | Fichiers impactés |
|---|---|---|
| `api.getExploreProducts(params)` | `productService.explore(filters, pagination)` | `src/app/explorer/page.tsx`, API explore |
| `api.getProductsByShop(shopId, token)` | `productService.listByShop(shopId)` | `src/app/espace/produits/page.tsx` |
| `api.getProductById(id, token)` | `productService.getById(id)` | `src/app/espace/produits/[id]/page.tsx` |
| `api.getPublicProductByShopSlug(...)` | `productService.getPublicBySlug(...)` | `src/app/[shopSlug]/produit/[productId]` |
| `api.createProduct(shopId, data, token)` | `productService.create(shopId, data)` | `src/app/actions/product.ts` |
| `api.updateProduct(id, data, token)` | `productService.update(id, data, shopId)` | `src/app/actions/product.ts` |
| `api.deleteProduct(id, token)` | `productService.delete(id, shopId)` | `src/app/actions/product.ts` |

### Commandes (Orders)
| Fonction existante | Service cible D1 | Fichiers impactés |
|---|---|---|
| `api.createOrder(data)` | `orderService.create(data)` | `src/app/actions/checkout.ts` |
| `api.getOrderById(id, token)` | `orderService.getById(id, sellerId)` | `src/app/espace/commandes/[orderId]` |
| `api.getOrderByReference(ref)` | `orderService.getByPublicTokenOrRef(ref)` | `src/app/[shopSlug]/commande/[publicToken]` |
| `api.getOrdersByShop(shopId, token)` | `orderService.listByShop(shopId)` | `src/app/espace/commandes/page.tsx` |
| `api.updateOrderStatus(id, ...)` | `orderService.updateStatus(id, ...)` | `src/app/actions/order.ts` |

### Médias & Upload (R2)
| Fonction existante | Service cible R2 / D1 | Fichiers impactés |
|---|---|---|
| `api.createImageUpload(...)` | `r2Service.put(key, buffer, mime)` | `src/app/api/upload/route.ts` |
| `api.createProductImageUpload(...)` | `r2Service.put(key, buffer, mime)` | `src/app/api/upload/route.ts` |
| Flux lecture image (`/uploads/file/`) | `MEDIA_BUCKET.get(key)` | `src/app/api/images/[...key]/route.ts` |

### Abonnements (Subscriptions)
| Fonction existante | Service cible D1 | Fichiers impactés |
|---|---|---|
| `api.getProSubscriptionPrice()` | `settingService.getSubscriptionPrices()` | `src/app/espace/abonnement/page.tsx` |
| `api.createSubscriptionPayment(...)` | `subscriptionService.createIntent(...)` | `src/app/actions/subscription.ts` |
| `api.getSubscriptionPayment(...)` | `subscriptionService.getById(...)` | `src/app/espace/abonnement/page.tsx` |

### Administration & Réglages
| Fonction existante | Service cible D1 | Fichiers impactés |
|---|---|---|
| `api.getAdminAccess(token)` | `adminService.verifyAdmin(userId)` | `src/app/admin/layout.tsx` |
| `api.getAdminOverview(token)` | `adminService.getOverview()` | `src/app/admin/page.tsx` |
| `api.getAdminShops(token, params)` | `adminService.listShops(params)` | `src/app/admin/boutiques/page.tsx` |
| `api.getAdminOrders(token, params)` | `adminService.listOrders(params)` | `src/app/admin/commandes/page.tsx` |
| `api.getAdminAccounts(token, params)` | `adminService.listAccounts(params)` | `src/app/admin/comptes/page.tsx` |
| `api.getAdminSettings(token)` | `adminService.getSettings()` | `src/app/admin/reglages/page.tsx` |
| `api.getPublicFeatures()` | `settingService.getPublicFeatures()` | `src/middleware.ts` |
| `api.adminSetExplorerEnabled(...)` | `adminService.setExplorerEnabled(...)` | `src/app/actions/admin.ts` |
| `api.adminSetMaintenanceEnabled(...)` | `adminService.setMaintenanceEnabled(...)` | `src/app/actions/admin.ts` |
| `api.adminSetProSubscriptionPrice(...)`| `adminService.setProPrice(...)` | `src/app/actions/admin.ts` |
| `api.adminUpdateShopPlan(...)` | `adminService.updateShopPlan(...)` | `src/app/actions/admin.ts` |
| `api.adminUpdateShopStatus(...)` | `adminService.updateShopStatus(...)` | `src/app/actions/admin.ts` |

---

## 2. Ordre de bascule planifié

1. **Phase 1 :** Infrastructure D1 (schéma, client, migrations, séparation R2, arrêt cron ping)
2. **Phase 2 :** Authentification & Sessions (remplacement de `auth.ts`, `actions/auth.ts`, login, register)
3. **Phase 3 :** Boutiques, Produits & Médias R2 (upload direct R2, CRUD catalogue D1)
4. **Phase 4 :** Checkout & Commandes (panier, validation D1, snapshots, tokens sécurisés)
5. **Phase 5 :** Espace Vendeur (dashboard, gestion commandes, abonnements)
6. **Phase 6 :** Administration (statistiques, boutiques, réglages, maintenance)
7. **Phase 7 :** Nettoyage final (`src/lib/api.ts` supprimé, suppression complète des variables externes)

