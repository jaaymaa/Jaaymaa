import SwiftUI

struct ShopListContent: View {
    let page: AdminPage<AdminShop>
    var subscriptionsOnly = false
    var metrics: PlanMetrics? = nil
    let onUpdate: (String, [String: Any]) async throws -> Void
    @State private var actionError: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Subscription Metrics (when viewing subscriptions)
            if let metrics {
                HStack(spacing: 10) {
                    MiniStat(title: "Pro actif", value: metrics.proShops, color: JaaymaStyle.hibiscus)
                    MiniStat(title: "Pro+ actif", value: metrics.proPlusShops, color: JaaymaStyle.baobab)
                    MiniStat(
                        title: "Expirés",
                        value: metrics.expiredProShops + metrics.expiredProPlusShops,
                        color: JaaymaStyle.muted
                    )
                }
            }

            // Shops List Card
            SectionCard(
                title: subscriptionsOnly ? "Abonnements des boutiques" : "Catalogue des boutiques",
                subtitle: "\(page.total) boutique\(page.total > 1 ? "s" : "") au total"
            ) {
                if page.items.isEmpty {
                    HStack(spacing: 12) {
                        Image(systemName: "storefront")
                            .font(.system(size: 20))
                            .foregroundStyle(JaaymaStyle.muted)
                        Text("Aucune boutique trouvée.")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(JaaymaStyle.muted)
                    }
                    .padding(.vertical, 12)
                } else {
                    VStack(spacing: 12) {
                        ForEach(page.items) { shop in
                            shopRow(shop)

                            if shop.id != page.items.last?.id {
                                Divider().background(JaaymaStyle.line)
                            }
                        }
                    }
                }

                if let actionError {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.circle.fill")
                        Text(actionError)
                    }
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(JaaymaStyle.hibiscus)
                    .padding(8)
                    .background(JaaymaStyle.hibiscus.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
                }
            }
        }
    }

    private func shopRow(_ shop: AdminShop) -> some View {
        HStack(alignment: .top, spacing: 12) {
            // Store Icon
            Image(systemName: "storefront.fill")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(JaaymaStyle.ink)
                .frame(width: 38, height: 38)
                .background(JaaymaStyle.sun, in: RoundedRectangle(cornerRadius: 11))
                .overlay(RoundedRectangle(cornerRadius: 11).stroke(JaaymaStyle.ink, lineWidth: 1.2))

            // Shop Details
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(shop.name)
                        .font(.system(size: 14, weight: .black, design: .rounded))
                        .foregroundStyle(JaaymaStyle.ink)

                    planBadge(for: shop.plan)
                }

                if let ownerName = shop.owner?.name, !ownerName.isEmpty {
                    Text(ownerName)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(JaaymaStyle.ink)
                }

                if let phone = shop.owner?.phone, !phone.isEmpty {
                    Text(phone)
                        .font(.system(size: 11, weight: .medium, design: .monospaced))
                        .foregroundStyle(JaaymaStyle.muted)
                }

                // Stats & Status Pills
                HStack(spacing: 6) {
                    statusPill(for: shop.status)

                    Text("·")
                        .foregroundStyle(JaaymaStyle.muted)

                    Text("\(shop.counts.products) prod.")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(JaaymaStyle.muted)

                    Text("·")
                        .foregroundStyle(JaaymaStyle.muted)

                    Text("\(shop.counts.orders) cmd.")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(JaaymaStyle.muted)
                }
                .padding(.top, 2)
            }

            Spacer(minLength: 4)

            // Tactile Action Menu
            Menu {
                Section("Changer le statut") {
                    Button { update(shop, ["status": "ACTIVE"]) } label: {
                        Label("Activer / Mettre en ligne", systemImage: "checkmark.circle")
                    }
                    Button { update(shop, ["status": "SUSPENDED"]) } label: {
                        Label("Suspendre la boutique", systemImage: "pause.circle")
                    }
                    Button { update(shop, ["status": "DRAFT"]) } label: {
                        Label("Remettre en brouillon", systemImage: "pencil.circle")
                    }
                }

                Section("Changer d'abonnement") {
                    Button { update(shop, ["plan": "free"]) } label: {
                        Label("Formule Gratuite", systemImage: "sparkles")
                    }
                    Button { update(shop, ["plan": "pro"]) } label: {
                        Label("Passer en Pro (30j)", systemImage: "star.fill")
                    }
                    Button { update(shop, ["plan": "pro_plus"]) } label: {
                        Label("Passer en Pro+ (30j)", systemImage: "crown.fill")
                    }
                }
            } label: {
                Image(systemName: "ellipsis.circle.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(JaaymaStyle.ink)
                    .padding(4)
            }
        }
        .padding(10)
        .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 14))
    }

    private func planBadge(for plan: String) -> some View {
        let isPro = plan.lowercased() == "pro"
        let isProPlus = plan.lowercased().contains("plus")

        return Text(plan.uppercased())
            .font(.system(size: 9, weight: .black))
            .tracking(0.8)
            .foregroundStyle(isProPlus ? JaaymaStyle.baobab : (isPro ? JaaymaStyle.darkHibiscus : JaaymaStyle.muted))
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(
                isProPlus ? JaaymaStyle.mint : (isPro ? JaaymaStyle.pinkTone : JaaymaStyle.chip),
                in: RoundedRectangle(cornerRadius: 6)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 6)
                    .stroke(JaaymaStyle.ink.opacity(0.15), lineWidth: 1)
            )
    }

    private func statusPill(for status: String) -> some View {
        let (label, color) = statusConfig(status)
        return HStack(spacing: 4) {
            Circle().fill(color).frame(width: 5, height: 5)
            Text(label)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(color)
        }
    }

    private func statusConfig(_ status: String) -> (String, Color) {
        switch status.uppercased() {
        case "ACTIVE": return ("En ligne", JaaymaStyle.baobab)
        case "SUSPENDED": return ("Suspendue", JaaymaStyle.hibiscus)
        case "DRAFT": return ("Brouillon", JaaymaStyle.sunAlt)
        default: return (status, JaaymaStyle.muted)
        }
    }

    private func update(_ shop: AdminShop, _ values: [String: Any]) {
        JaaymaHaptics.medium()
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
