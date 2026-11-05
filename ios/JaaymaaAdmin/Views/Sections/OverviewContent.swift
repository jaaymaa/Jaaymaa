import SwiftUI

struct OverviewContent: View {
    let value: AdminOverview
    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            // Symmetrical 2x2 Hero Metrics
            LazyVGrid(columns: columns, spacing: 12) {
                MetricTile(
                    title: "Boutiques",
                    value: "\(value.metrics.totalShops)",
                    subtitle: "\(value.metrics.activeShops) actives",
                    symbol: "storefront.fill",
                    tone: JaaymaStyle.sun
                )

                MetricTile(
                    title: "Vendeurs",
                    value: "\(value.metrics.sellers)",
                    subtitle: "\(value.metrics.activeProducts) articles",
                    symbol: "person.2.fill",
                    tone: JaaymaStyle.pinkTone
                )

                MetricTile(
                    title: "Commandes",
                    value: "\(value.metrics.totalOrders)",
                    subtitle: "\(value.metrics.newOrders) nouv.",
                    symbol: "bag.fill",
                    tone: JaaymaStyle.mint
                )

                MetricTile(
                    title: "Ventes totales",
                    value: formatFcfa(value.metrics.revenue),
                    subtitle: "\(formatFcfa(value.metrics.revenueToday)) j.",
                    symbol: "banknote.fill",
                    tone: JaaymaStyle.blueTone
                )
            }

            // Symmetrical 3 Mini Stats Bar
            HStack(spacing: 10) {
                MiniStat(title: "Formules Pro", value: value.metrics.proShops, color: JaaymaStyle.hibiscus)
                MiniStat(title: "Formules Pro+", value: value.metrics.proPlusShops, color: JaaymaStyle.baobab)
                MiniStat(title: "À traiter", value: value.metrics.newOrders, color: JaaymaStyle.ink)
            }

            // Recent Orders Section Card
            SectionCard(title: "Commandes récentes", subtitle: "Flux d’activité en temps réel") {
                if value.recentOrders.isEmpty {
                    HStack(spacing: 12) {
                        Image(systemName: "tray")
                            .font(.system(size: 20))
                            .foregroundStyle(JaaymaStyle.muted)
                        Text("Aucune commande enregistrée pour l'instant.")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(JaaymaStyle.muted)
                    }
                    .padding(.vertical, 12)
                } else {
                    VStack(spacing: 10) {
                        ForEach(value.recentOrders) { order in
                            HStack(spacing: 12) {
                                Image(systemName: "bag.fill")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(JaaymaStyle.ink)
                                    .frame(width: 36, height: 36)
                                    .background(JaaymaStyle.sun.opacity(0.4), in: RoundedRectangle(cornerRadius: 10))
                                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(JaaymaStyle.ink, lineWidth: 1.2))

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(order.customerName)
                                        .font(.system(size: 14, weight: .bold, design: .rounded))
                                        .foregroundStyle(JaaymaStyle.ink)

                                    HStack(spacing: 4) {
                                        Text(order.shop.name)
                                            .font(.system(size: 11, weight: .bold))
                                            .foregroundStyle(JaaymaStyle.hibiscus)

                                        Text("·")
                                            .foregroundStyle(JaaymaStyle.muted)

                                        Text(order.reference)
                                            .font(.system(size: 11, weight: .medium, design: .monospaced))
                                            .foregroundStyle(JaaymaStyle.muted)
                                    }
                                }

                                Spacer()

                                Text(formatFcfa(order.total))
                                    .font(.system(size: 14, weight: .black, design: .rounded))
                                    .foregroundStyle(JaaymaStyle.ink)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(JaaymaStyle.chip, in: Capsule())
                                    .overlay(Capsule().stroke(JaaymaStyle.ink.opacity(0.2), lineWidth: 1))
                            }
                            .padding(10)
                            .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 14))

                            if order.id != value.recentOrders.last?.id {
                                Divider().background(JaaymaStyle.line)
                            }
                        }
                    }
                }
            }
        }
    }
}
