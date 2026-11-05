import SwiftUI

struct ShopListContent: View {
    let page: AdminPage<AdminShop>
    var subscriptionsOnly = false
    var metrics: PlanMetrics? = nil
    let onUpdate: (String, [String: Any]) async throws -> Void
    @State private var actionError: String?

    var body: some View {
        VStack(spacing: 16) {
            // Subscription Metrics (when viewing Subscriptions)
            if let metrics {
                HStack(spacing: 10) {
                    MiniStat(
                        title: "Pro actifs",
                        value: metrics.proShops,
                        symbol: "creditcard.fill",
                        color: JaaymaStyle.goldText
                    )
                    MiniStat(
                        title: "Pro+ actifs",
                        value: metrics.proPlusShops,
                        symbol: "sparkles",
                        color: JaaymaStyle.baobab
                    )
                    MiniStat(
                        title: "Expirés",
                        value: metrics.expiredProShops + metrics.expiredProPlusShops,
                        symbol: "exclamationmark.triangle.fill",
                        color: JaaymaStyle.hibiscus
                    )
                }
            }

            // Shop Cards List
            SectionCard(
                title: subscriptionsOnly ? "Abonnements des boutiques" : "Catalogue des boutiques",
                subtitle: "\(page.total) résultat\(page.total != 1 ? "s" : "")"
            ) {
                if page.items.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "storefront")
                            .font(.system(size: 32))
                            .foregroundStyle(JaaymaStyle.muted)
                        Text("Aucune boutique trouvée.")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(JaaymaStyle.muted)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
                } else {
                    VStack(spacing: 12) {
                        ForEach(page.items) { shop in
                            shopCard(shop)
                        }
                    }
                }

                if let actionError {
                    HStack(spacing: 8) {
                        Image(systemName: "exclamationmark.triangle.fill")
                        Text(actionError)
                    }
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(JaaymaStyle.darkHibiscus)
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(JaaymaStyle.hibiscus.opacity(0.12), in: RoundedRectangle(cornerRadius: 10))
                }
            }
        }
    }

    private func shopCard(_ shop: AdminShop) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "storefront.fill")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(JaaymaStyle.ink)
                    .frame(width: 40, height: 40)
                    .background(JaaymaStyle.sun.opacity(0.45), in: RoundedRectangle(cornerRadius: 11))
                    .overlay(RoundedRectangle(cornerRadius: 11).stroke(JaaymaStyle.ink, lineWidth: 1.5))

                VStack(alignment: .leading, spacing: 3) {
                    Text(shop.name)
                        .font(.system(size: 15, weight: .black, design: .rounded))
                        .foregroundStyle(JaaymaStyle.ink)

                    if let owner = shop.owner {
                        Text("\(owner.name?.isEmpty == true ? "Vendeur" : (owner.name ?? "Vendeur")) · \(owner.phone ?? "")")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(JaaymaStyle.muted)
                    } else {
                        Text(shop.slug)
                            .font(.system(size: 12, weight: .medium, design: .monospaced))
                            .foregroundStyle(JaaymaStyle.muted)
                    }
                }

                Spacer()

                // Actions Menu
                Menu {
                    Section("Statut boutique") {
                        Button("Mettre en ligne") { update(shop, ["status": "ACTIVE"]) }
                        Button("Suspendre") { update(shop, ["status": "SUSPENDED"]) }
                        Button("Remettre en brouillon") { update(shop, ["status": "DRAFT"]) }
                    }
                    Section("Abonnement") {
                        Button("Passer en Gratuit") { update(shop, ["plan": "free"]) }
                        Button("Activer Pro (30j)") { update(shop, ["plan": "pro"]) }
                        Button("Activer Pro+ (30j)") { update(shop, ["plan": "pro_plus"]) }
                    }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(JaaymaStyle.ink)
                        .padding(8)
                        .background(Color.white, in: RoundedRectangle(cornerRadius: 8))
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(JaaymaStyle.ink, lineWidth: 1.5))
                        .shadow(color: JaaymaStyle.ink, radius: 0, x: 1.5, y: 1.5)
                }
            }

            // Badges row
            HStack(spacing: 8) {
                // Status Badge
                statusBadge(shop.status)

                // Plan Badge
                planBadge(shop.plan)

                Spacer()

                // Activity Counters
                HStack(spacing: 6) {
                    Text("\(shop.counts.products) prod.")
                    Text("·")
                    Text("\(shop.counts.orders) cmd.")
                }
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(JaaymaStyle.muted)
            }
        }
        .padding(14)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(JaaymaStyle.ink, lineWidth: 1.8))
        .shadow(color: JaaymaStyle.ink, radius: 0, x: 2.5, y: 2.5)
    }

    private func statusBadge(_ status: String) -> some View {
        let (label, bg, fg) = statusInfo(status)
        return Text(label)
            .font(.system(size: 10, weight: .black))
            .padding(.horizontal, 8)
            .padding(.vertical, 3.5)
            .background(bg, in: Capsule())
            .overlay(Capsule().stroke(JaaymaStyle.ink, lineWidth: 1.2))
            .foregroundStyle(fg)
    }

    private func statusInfo(_ status: String) -> (String, Color, Color) {
        switch status.uppercased() {
        case "ACTIVE":
            return ("En ligne", JaaymaStyle.mint, JaaymaStyle.baobab)
        case "SUSPENDED":
            return ("Suspendue", JaaymaStyle.pinkTone, JaaymaStyle.darkHibiscus)
        default:
            return ("Brouillon", Color(red: 235 / 255, green: 235 / 255, blue: 235 / 255), JaaymaStyle.muted)
        }
    }

    private func planBadge(_ plan: String) -> some View {
        let isPro = plan.lowercased() == "pro"
        let isProPlus = plan.lowercased() == "pro_plus"

        return Text(isPro ? "PRO" : (isProPlus ? "PRO+" : "GRATUIT"))
            .font(.system(size: 10, weight: .black))
            .padding(.horizontal, 8)
            .padding(.vertical, 3.5)
            .background(
                isProPlus ? JaaymaStyle.sun : (isPro ? JaaymaStyle.sun.opacity(0.4) : Color.white),
                in: Capsule()
            )
            .overlay(Capsule().stroke(JaaymaStyle.ink, lineWidth: 1.2))
            .foregroundStyle(JaaymaStyle.ink)
    }

    private func update(_ shop: AdminShop, _ values: [String: Any]) {
        Task {
            do {
                try await onUpdate(shop.id, values)
                actionError = nil
            } catch {
                actionError = error.localizedDescription
            }
        }
    }
}
