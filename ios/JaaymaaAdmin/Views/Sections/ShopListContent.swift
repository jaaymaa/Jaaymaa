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
            subtitle: "\(page.total) boutiques"
        ) {
            if page.items.isEmpty {
                ContentUnavailableView(
                    "Aucune boutique",
                    systemImage: "storefront",
                    description: Text("Les boutiques correspondant à ta recherche apparaîtront ici.")
                )
                .padding(.vertical, 8)
            }

            ForEach(Array(page.items.enumerated()), id: \.element.id) { index, shop in
                ShopListRow(shop: shop) {
                    update(shop, $0)
                }

                if index < page.items.count - 1 {
                    Divider()
                        .padding(.leading, 66)
                }
            }

            if let actionError {
                Label(actionError, systemImage: "exclamationmark.circle.fill")
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

private struct ShopListRow: View {
    let shop: AdminShop
    let onUpdate: ([String: Any]) -> Void

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            ShopLogoView(name: shop.name, url: shop.logoUrl)

            VStack(alignment: .leading, spacing: 6) {
                Text(shop.name)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(JaaymaStyle.ink)
                    .lineLimit(1)

                Text(shop.owner?.name ?? shop.owner?.phone ?? "@\(shop.slug)")
                    .font(.caption)
                    .foregroundStyle(JaaymaStyle.muted)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    ShopBadge(title: planTitle(shop.plan), color: planColor(shop.plan))
                    ShopBadge(title: statusLabel(shop.status), color: statusColor(shop.status))
                }

                Text("\(shop.counts.products) produits · \(shop.counts.orders) commandes")
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(JaaymaStyle.muted)
                    .lineLimit(1)
            }

            Spacer(minLength: 0)

            Menu {
                Section("Statut de la boutique") {
                    Button("Mettre en ligne") { onUpdate(["status": "ACTIVE"]) }
                    Button("Suspendre", role: .destructive) { onUpdate(["status": "SUSPENDED"]) }
                    Button("Remettre en brouillon") { onUpdate(["status": "DRAFT"]) }
                }

                Section("Formule") {
                    Button("Gratuit") { onUpdate(["plan": "free"]) }
                    Button("Pro · 30 jours") { onUpdate(["plan": "pro"]) }
                    Button("Pro+ · 30 jours") { onUpdate(["plan": "pro_plus"]) }
                }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(JaaymaStyle.ink)
                    .frame(width: 34, height: 34)
                    .background(JaaymaStyle.paper, in: Circle())
                    .contentShape(Circle())
            }
            .accessibilityLabel("Gérer \(shop.name)")
        }
        .padding(.vertical, 7)
    }

    private func planTitle(_ plan: String) -> String {
        switch plan.lowercased() {
        case "pro_plus": return "PRO+"
        case "pro": return "PRO"
        default: return "GRATUIT"
        }
    }

    private func planColor(_ plan: String) -> Color {
        switch plan.lowercased() {
        case "pro_plus": return JaaymaStyle.ink
        case "pro": return JaaymaStyle.hibiscus
        default: return JaaymaStyle.muted
        }
    }

    private func statusColor(_ status: String) -> Color {
        switch status {
        case "ACTIVE": return JaaymaStyle.green
        case "SUSPENDED": return JaaymaStyle.hibiscus
        default: return JaaymaStyle.muted
        }
    }
}

private struct ShopBadge: View {
    let title: String
    let color: Color

    var body: some View {
        Text(title)
            .font(.system(size: 9, weight: .bold))
            .lineLimit(1)
            .padding(.horizontal, 7)
            .padding(.vertical, 4)
            .foregroundStyle(color)
            .background(color.opacity(0.09), in: Capsule())
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
        .frame(width: 52, height: 52)
        .clipShape(RoundedRectangle(cornerRadius: 17, style: .continuous))
        .background(JaaymaStyle.sun.opacity(0.23), in: RoundedRectangle(cornerRadius: 17, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 17, style: .continuous)
                .stroke(JaaymaStyle.ink.opacity(0.08), lineWidth: 1)
        }
        .accessibilityLabel("Logo de \(name)")
    }

    private var fallback: some View {
        Text(monogram)
            .font(.system(size: 17, weight: .bold, design: .rounded))
            .foregroundStyle(JaaymaStyle.ink)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(JaaymaStyle.sun.opacity(0.23))
    }

    private var monogram: String {
        let initials = name.split(whereSeparator: \.isWhitespace).prefix(2).compactMap(\.first)
        return initials.isEmpty ? "J" : String(initials).uppercased()
    }
}
