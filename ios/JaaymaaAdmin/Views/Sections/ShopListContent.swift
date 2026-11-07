import SwiftUI

struct ShopListContent: View {
    let page: AdminPage<AdminShop>
    var subscriptionsOnly = false
    var metrics: PlanMetrics? = nil
    let onUpdate: (String, [String: Any]) async throws -> Void
    @State private var actionError: String?
    @State private var updatingShopId: String?
    @State private var completedUpdates = 0
    @State private var didFailUpdate = false

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
                HStack(alignment: .center) {
                    Text(subscriptionsOnly ? "Forfaits des boutiques" : "Toutes les boutiques")
                        .font(.system(size: 18, weight: .heavy, design: .rounded))
                        .foregroundStyle(JaaymaStyle.paper)

                    Spacer(minLength: 8)

                    JaaymaStatusBadge(title: "\(page.total) au total", tint: JaaymaStyle.sun, symbol: "storefront")
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
                        ShopListRow(shop: shop, isUpdating: updatingShopId == shop.id) { changes in
                            update(shop, changes)
                        }
                    }
                }

                if let actionError {
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "exclamationmark.circle.fill")
                            .font(.system(size: 13, weight: .semibold))
                        Text(actionError)
                            .font(.caption.weight(.semibold))
                            .fixedSize(horizontal: false, vertical: true)
                    }
                        .foregroundStyle(JaaymaStyle.hibiscus)
                        .padding(11)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(JaaymaStyle.hibiscus.opacity(0.12), in: RoundedRectangle(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(JaaymaStyle.hibiscus.opacity(0.22), lineWidth: 1))
                }
            }
        }
        .sensoryFeedback(.success, trigger: completedUpdates)
        .sensoryFeedback(.error, trigger: didFailUpdate)
    }

    private func update(_ shop: AdminShop, _ values: [String: Any]) {
        guard updatingShopId == nil else { return }
        updatingShopId = shop.id
        didFailUpdate = false
        Task {
            defer { updatingShopId = nil }
            do {
                try await onUpdate(shop.id, values)
                actionError = nil
                completedUpdates += 1
            } catch {
                actionError = error.localizedDescription
                didFailUpdate = true
            }
        }
    }
}

private struct ShopListRow: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let shop: AdminShop
    let isUpdating: Bool
    let onUpdate: ([String: Any]) -> Void

    private var isFreePlan: Bool { shop.plan.lowercased() == "free" }
    private var planAccent: Color {
        switch shop.plan.lowercased() {
        case "pro_plus": return JaaymaStyle.sun
        case "pro": return JaaymaStyle.green
        default: return JaaymaStyle.mist
        }
    }

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

                    HStack(spacing: 9) {
                        Label("\(shop.counts.products)", systemImage: "shippingbox")
                        Label("\(shop.counts.orders)", systemImage: "bag")
                    }
                    .font(.system(size: 10, weight: .medium, design: .rounded).monospacedDigit())
                    .foregroundStyle(JaaymaStyle.muted)
                    .lineLimit(1)
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
                    Group {
                        if isUpdating {
                            HStack(spacing: 7) {
                                JaaymaLoader(variant: .miniInk, size: 24)
                                Text("Mise à jour")
                            }
                        } else {
                            Label(isFreePlan ? "Activer Pro" : "Gérer le forfait", systemImage: "sparkles")
                        }
                    }
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                        .foregroundStyle(JaaymaStyle.ink)
                        .padding(.horizontal, 11)
                        .padding(.vertical, 8)
                        .background {
                            Capsule()
                                .fill(JaaymaStyle.sun)
                                .shadow(color: JaaymaStyle.cardShadow, radius: 0, x: 1, y: 2)
                        }
                        .overlay(Capsule().stroke(JaaymaStyle.ink, lineWidth: 2))
                }
                .buttonStyle(JaaymaInteractiveButtonStyle())
                .accessibilityLabel(
                    isUpdating
                        ? "Mise à jour de \(shop.name)"
                        : isFreePlan ? "Activer Pro pour \(shop.name)" : "Gérer le forfait de \(shop.name)"
                )
                .disabled(isUpdating)

                Spacer(minLength: 0)

                Button {
                    onUpdate(["status": shop.status == "ACTIVE" ? "SUSPENDED" : "ACTIVE"])
                } label: {
                    Group {
                        if isUpdating {
                            JaaymaLoader(variant: .miniInk, size: 24)
                        } else {
                            Label(statusActionTitle, systemImage: shop.status == "ACTIVE" ? "pause.fill" : "arrow.up.right")
                                .font(.system(size: 11, weight: .bold, design: .rounded))
                                .foregroundStyle(shop.status == "ACTIVE" ? JaaymaStyle.hibiscus : JaaymaStyle.green)
                        }
                    }
                    .lineLimit(1)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(JaaymaStyle.paper.opacity(0.66), in: Capsule())
                    .overlay(Capsule().stroke(JaaymaStyle.ink.opacity(0.13), lineWidth: 1))
                    .contentShape(Rectangle())
                }
                .buttonStyle(JaaymaInteractiveButtonStyle())
                .disabled(isUpdating)
                .accessibilityLabel(isUpdating ? "Mise à jour de \(shop.name)" : statusActionTitle)
            }
        }
        .padding(13)
        .frame(maxWidth: .infinity, alignment: .leading)
        .jaaymaCard(radius: 22, accent: planAccent)
        .animation(reduceMotion ? nil : .snappy(duration: 0.22), value: isUpdating)
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
        .background {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(JaaymaStyle.sun)
                .shadow(color: JaaymaStyle.cardShadow, radius: 0, x: 1, y: 2)
        }
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(JaaymaStyle.ink, lineWidth: 2)
        }
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
