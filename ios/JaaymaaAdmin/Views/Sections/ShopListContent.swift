import SwiftUI

struct ShopListContent: View {
    let page: AdminPage<AdminShop>
    var subscriptionsOnly = false
    var metrics: PlanMetrics? = nil
    let onUpdate: (String, [String: Any]) async throws -> Void
    @State private var actionError: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            if let metrics {
                HStack(spacing: 10) {
                    MiniStat(title: "Pro actif", value: metrics.proShops, color: JaaymaStyle.green)
                    MiniStat(title: "Pro+ actif", value: metrics.proPlusShops, color: JaaymaStyle.ink)
                    MiniStat(
                        title: "Expirés",
                        value: metrics.expiredProShops + metrics.expiredProPlusShops,
                        color: JaaymaStyle.hibiscus
                    )
                }
            }

            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .firstTextBaseline) {
                    Text(subscriptionsOnly ? "Forfaits des boutiques" : "Toutes les boutiques")
                        .font(.system(size: 18, weight: .heavy, design: .rounded))
                        .foregroundStyle(JaaymaStyle.paper)

                    Spacer(minLength: 8)

                    Text("\(page.total) au total")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(JaaymaStyle.paper.opacity(0.62))
                }

                if page.items.isEmpty {
                    ContentUnavailableView(
                        "Aucune boutique",
                        systemImage: "storefront",
                        description: Text("Les boutiques correspondant à ta recherche apparaîtront ici.")
                    )
                    .padding(.vertical, 18)
                } else {
                    ForEach(page.items) { shop in
                        ShopListRow(shop: shop) { changes in
                            update(shop, changes)
                        }
                    }
                }

                if let actionError {
                    Label(actionError, systemImage: "exclamationmark.circle.fill")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(JaaymaStyle.hibiscus)
                        .padding(11)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(JaaymaStyle.hibiscus.opacity(0.12), in: RoundedRectangle(cornerRadius: 14))
                }
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

private struct ShopListRow: View {
    let shop: AdminShop
    let onUpdate: ([String: Any]) -> Void

    private var isFreePlan: Bool { shop.plan.lowercased() == "free" }

    var body: some View {
        VStack(alignment: .leading, spacing: 11) {
            HStack(alignment: .center, spacing: 11) {
                ShopLogoView(name: shop.name, url: shop.logoUrl)

                VStack(alignment: .leading, spacing: 4) {
                    Text(shop.name)
                        .font(.system(size: 16, weight: .heavy, design: .rounded))
                        .foregroundStyle(JaaymaStyle.ink)
                        .lineLimit(1)

                    Text(ownerLabel)
                        .font(.caption)
                        .foregroundStyle(JaaymaStyle.muted)
                        .lineLimit(1)

                    Text("\(shop.counts.products) produits · \(shop.counts.orders) commandes")
                        .font(.system(size: 11.5, weight: .medium))
                        .foregroundStyle(JaaymaStyle.muted)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                }

                Spacer(minLength: 2)

                VStack(alignment: .trailing, spacing: 8) {
                    ShopPlanBadge(plan: shop.plan)
                    ShopStatusStamp(status: shop.status)
                }
            }

            HStack(spacing: 8) {
                Menu {
                    Section("Formule") {
                        Button("Gratuit") { onUpdate(["plan": "free"]) }
                        Button("Pro · 30 jours") { onUpdate(["plan": "pro"]) }
                        Button("Pro+ · 30 jours") { onUpdate(["plan": "pro_plus"]) }
                    }
                    Section("Statut de la boutique") {
                        Button("Mettre en ligne") { onUpdate(["status": "ACTIVE"]) }
                        Button("Suspendre", role: .destructive) { onUpdate(["status": "SUSPENDED"]) }
                        Button("Remettre en brouillon") { onUpdate(["status": "DRAFT"]) }
                    }
                } label: {
                    Label(isFreePlan ? "Activer Pro" : "Gérer le forfait", systemImage: "sparkles")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                        .foregroundStyle(JaaymaStyle.ink)
                        .padding(.horizontal, 11)
                        .padding(.vertical, 8)
                        .background(JaaymaStyle.sun, in: Capsule())
                        .overlay(Capsule().stroke(JaaymaStyle.ink, lineWidth: 2))
                        .shadow(color: JaaymaStyle.cardShadow, radius: 0, x: 1, y: 2)
                }
                .accessibilityLabel(isFreePlan ? "Activer Pro pour \(shop.name)" : "Gérer le forfait de \(shop.name)")

                Spacer(minLength: 0)

                Button {
                    onUpdate(["status": shop.status == "ACTIVE" ? "SUSPENDED" : "ACTIVE"])
                } label: {
                    Text(statusActionTitle)
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundStyle(shop.status == "ACTIVE" ? JaaymaStyle.hibiscus : JaaymaStyle.green)
                        .lineLimit(1)
                        .padding(.vertical, 8)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
        .padding(13)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(JaaymaStyle.ink, lineWidth: 2.5))
        .shadow(color: JaaymaStyle.cardShadow, radius: 0, x: 2, y: 4)
        .environment(\.colorScheme, .light)
    }

    private var ownerLabel: String {
        if let name = shop.owner?.name, !name.isEmpty { return name }
        if let phone = shop.owner?.phone, !phone.isEmpty { return phone }
        return "@\(shop.slug)"
    }

    private var statusActionTitle: String {
        switch shop.status {
        case "ACTIVE": return "Suspendre"
        case "SUSPENDED": return "Réactiver"
        default: return "Publier"
        }
    }
}

private struct ShopPlanBadge: View {
    let plan: String

    private var title: String {
        switch plan.lowercased() {
        case "pro_plus": return "PRO+"
        case "pro": return "PRO"
        default: return "GRATUIT"
        }
    }

    private var fill: Color {
        switch plan.lowercased() {
        case "pro_plus": return JaaymaStyle.sun
        case "pro": return JaaymaStyle.green
        default: return JaaymaStyle.mist
        }
    }

    private var foreground: Color {
        plan.lowercased() == "pro" ? .white : JaaymaStyle.ink
    }

    var body: some View {
        Text(title)
            .font(.system(size: 10, weight: .heavy, design: .rounded))
            .tracking(0.35)
            .lineLimit(1)
            .padding(.horizontal, 9)
            .padding(.vertical, 5)
            .foregroundStyle(foreground)
            .background(fill, in: Capsule())
    }
}

private struct ShopStatusStamp: View {
    let status: String

    private var title: String { statusLabel(status).uppercased() }

    private var tint: Color {
        switch status {
        case "ACTIVE": return JaaymaStyle.green
        case "SUSPENDED": return JaaymaStyle.hibiscus
        default: return JaaymaStyle.muted
        }
    }

    var body: some View {
        Text(title)
            .font(.system(size: 8, weight: .heavy, design: .rounded))
            .tracking(0.25)
            .lineLimit(1)
            .padding(.horizontal, 6)
            .padding(.vertical, 4)
            .foregroundStyle(tint)
            .background(tint.opacity(0.08), in: RoundedRectangle(cornerRadius: 6))
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(tint, lineWidth: 1.25))
            .rotationEffect(.degrees(-2))
    }
}

private struct ShopLogoView: View {
    let name: String
    let url: String?

    var body: some View {
        AsyncImage(url: url.flatMap { URL(string: $0) }) { phase in
            if let image = phase.image {
                image
                    .resizable()
                    .scaledToFill()
            } else {
                fallback
            }
        }
        .frame(width: 54, height: 54)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .background(JaaymaStyle.sun, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(JaaymaStyle.ink, lineWidth: 2))
        .shadow(color: JaaymaStyle.cardShadow, radius: 0, x: 1, y: 2)
        .accessibilityLabel("Logo de \(name)")
    }

    private var fallback: some View {
        Text(monogram)
            .font(.system(size: 18, weight: .heavy, design: .rounded))
            .foregroundStyle(JaaymaStyle.ink)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(JaaymaStyle.sun)
    }

    private var monogram: String {
        let initials = name.split(whereSeparator: \.isWhitespace).prefix(2).compactMap(\.first)
        return initials.isEmpty ? "J" : String(initials).uppercased()
    }
}
