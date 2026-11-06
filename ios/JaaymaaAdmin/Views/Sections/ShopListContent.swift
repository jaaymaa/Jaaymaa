import SwiftUI

struct ShopListContent: View {
    let page: AdminPage<AdminShop>
    var subscriptionsOnly = false
    var metrics: PlanMetrics? = nil
    let onUpdate: (String, [String: Any]) async throws -> Void
    @State private var actionError: String?

    var body: some View {
        if let metrics {
            HStack(spacing: 10) {
                MiniStat(title: "Pro actif", value: metrics.proShops, color: JaaymaStyle.hibiscus)
                MiniStat(title: "Pro+ actif", value: metrics.proPlusShops, color: JaaymaStyle.green)
                MiniStat(
                    title: "Expirés",
                    value: metrics.expiredProShops + metrics.expiredProPlusShops,
                    color: JaaymaStyle.muted
                )
            }
        }

        SectionCard(
            title: subscriptionsOnly ? "Forfaits des boutiques" : "Toutes les boutiques",
            subtitle: "\(page.total) résultats"
        ) {
            if page.items.isEmpty {
                Text("Aucune boutique à afficher.")
                    .foregroundStyle(JaaymaStyle.muted)
            }

            ForEach(page.items) { shop in
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: "storefront")
                        .foregroundStyle(JaaymaStyle.ink)
                        .padding(11)
                        .background(JaaymaStyle.sun.opacity(0.4), in: RoundedRectangle(cornerRadius: 12))

                    VStack(alignment: .leading, spacing: 4) {
                        Text(shop.name)
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(JaaymaStyle.ink)
                        Text(shop.owner?.name ?? shop.owner?.phone ?? shop.slug)
                            .font(.caption)
                            .foregroundStyle(JaaymaStyle.muted)
                        Text("\(shop.plan.uppercased()) · \(statusLabel(shop.status)) · \(shop.counts.orders) commandes")
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(JaaymaStyle.green)
                    }

                    Spacer(minLength: 0)

                    Menu {
                        Section("Statut de la boutique") {
                            Button("Mettre en ligne") { update(shop, ["status": "ACTIVE"]) }
                            Button("Suspendre") { update(shop, ["status": "SUSPENDED"]) }
                            Button("Remettre en brouillon") { update(shop, ["status": "DRAFT"]) }
                        }
                        Section("Formule") {
                            Button("Gratuit") { update(shop, ["plan": "free"]) }
                            Button("Pro · 30 jours") { update(shop, ["plan": "pro"]) }
                            Button("Pro+ · 30 jours") { update(shop, ["plan": "pro_plus"]) }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .font(.title3)
                            .foregroundStyle(JaaymaStyle.ink)
                            .padding(.leading, 5)
                    }
                }
                .padding(.vertical, 4)
            }

            if let actionError {
                Text(actionError)
                    .font(.caption)
                    .foregroundStyle(JaaymaStyle.hibiscus)
            }
        }
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

