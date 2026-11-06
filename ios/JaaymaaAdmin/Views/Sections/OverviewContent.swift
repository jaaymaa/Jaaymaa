import SwiftUI

struct OverviewContent: View {
    let value: AdminOverview
    private let columns = [GridItem(.adaptive(minimum: 150, maximum: 250), spacing: 12)]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            MetricTile(
                title: "Boutiques",
                value: "\(value.metrics.totalShops)",
                note: "\(value.metrics.activeShops) en ligne",
                symbol: "storefront.fill",
                tint: JaaymaStyle.sun
            )
            MetricTile(
                title: "Vendeurs",
                value: "\(value.metrics.sellers)",
                note: "\(value.metrics.activeProducts) produits actifs",
                symbol: "person.2.fill",
                tint: Color(red: 246 / 255, green: 195 / 255, blue: 210 / 255)
            )
            MetricTile(
                title: "Commandes",
                value: "\(value.metrics.totalOrders)",
                note: "\(value.metrics.newOrders) nouvelles",
                symbol: "bag.fill",
                tint: Color(red: 207 / 255, green: 239 / 255, blue: 230 / 255)
            )
            MetricTile(
                title: "Ventes encaissées",
                value: formatFcfa(value.metrics.revenue),
                note: "\(formatFcfa(value.metrics.revenueToday)) aujourd’hui",
                symbol: "banknote.fill",
                tint: Color(red: 220 / 255, green: 229 / 255, blue: 1)
            )
        }

        HStack(spacing: 12) {
            MiniStat(title: "Pro", value: value.metrics.proShops, color: JaaymaStyle.hibiscus)
            MiniStat(title: "Pro+", value: value.metrics.proPlusShops, color: JaaymaStyle.green)
            MiniStat(title: "À traiter", value: value.metrics.newOrders, color: JaaymaStyle.ink)
        }

        SectionCard(title: "Commandes récentes", subtitle: "Activité de la plateforme") {
            if value.recentOrders.isEmpty {
                Text("Aucune commande pour le moment.")
                    .font(.subheadline)
                    .foregroundStyle(JaaymaStyle.muted)
            } else {
                ForEach(value.recentOrders) { order in
                    HStack(spacing: 12) {
                        Image(systemName: "bag")
                            .foregroundStyle(JaaymaStyle.ink)
                            .padding(11)
                            .background(JaaymaStyle.sun.opacity(0.35), in: RoundedRectangle(cornerRadius: 12))
                        VStack(alignment: .leading, spacing: 3) {
                            Text(order.customerName)
                                .font(.subheadline.weight(.bold))
                            Text("\(order.shop.name) · \(order.reference)")
                                .font(.caption)
                                .foregroundStyle(JaaymaStyle.muted)
                        }
                        Spacer()
                        Text(formatFcfa(order.total))
                            .font(.subheadline.weight(.heavy))
                            .foregroundStyle(JaaymaStyle.ink)
                    }
                    .padding(.vertical, 4)
                }
            }
        }
    }
}

