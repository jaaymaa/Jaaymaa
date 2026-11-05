import SwiftUI

struct OverviewContent: View {
    let value: AdminOverview
    private let metricColumns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
    private let statColumns = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)]

    var body: some View {
        VStack(spacing: 18) {
            // 4 Top Global Metric Cards
            LazyVGrid(columns: metricColumns, spacing: 12) {
                MetricTile(
                    title: "Boutiques",
                    value: "\(value.metrics.totalShops)",
                    note: "\(value.metrics.activeShops) en ligne · \(value.metrics.suspendedShops) susp.",
                    symbol: "storefront.fill",
                    tone: .sun
                )
                MetricTile(
                    title: "Comptes",
                    value: "\(value.metrics.sellers)",
                    note: "\(value.metrics.activeProducts) produits en ligne",
                    symbol: "person.2.fill",
                    tone: .pink
                )
                MetricTile(
                    title: "Commandes",
                    value: "\(value.metrics.totalOrders)",
                    note: "\(value.metrics.newOrders) nouv. · \(value.metrics.todayOrders) auj.",
                    symbol: "bag.fill",
                    tone: .mint
                )
                MetricTile(
                    title: "Ventes encaissées",
                    value: formatFcfa(value.metrics.revenue),
                    note: "\(formatFcfa(value.metrics.revenueToday)) aujourd’hui",
                    symbol: "banknote.fill",
                    tone: .blue
                )
            }

            // Platform State Section (6 Quick Stats)
            SectionCard(
                title: "État de la plateforme",
                subtitle: "Répartition des boutiques et abonnements"
            ) {
                LazyVGrid(columns: statColumns, spacing: 10) {
                    MiniStat(
                        title: "Boutiques actives",
                        value: value.metrics.activeShops,
                        symbol: "checkmark.seal.fill",
                        color: JaaymaStyle.baobab
                    )
                    MiniStat(
                        title: "Brouillons",
                        value: value.metrics.draftShops,
                        symbol: "shippingbox.fill",
                        color: JaaymaStyle.muted
                    )
                    MiniStat(
                        title: "Pro actif",
                        value: value.metrics.proShops,
                        symbol: "creditcard.fill",
                        color: JaaymaStyle.goldText
                    )
                    MiniStat(
                        title: "Pro+ actif",
                        value: value.metrics.proPlusShops,
                        symbol: "sparkles",
                        color: JaaymaStyle.goldText
                    )
                    MiniStat(
                        title: "Pro expiré",
                        value: value.metrics.expiredProShops,
                        symbol: "exclamationmark.triangle.fill",
                        color: JaaymaStyle.hibiscus
                    )
                    MiniStat(
                        title: "Pro+ expiré",
                        value: value.metrics.expiredProPlusShops,
                        symbol: "exclamationmark.triangle.fill",
                        color: JaaymaStyle.hibiscus
                    )
                }
            }

            // Recent Orders Section
            SectionCard(
                title: "Activité récente",
                subtitle: "Nouvelles commandes enregistrées"
            ) {
                if value.recentOrders.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "bag.badge.questionmark")
                            .font(.system(size: 28))
                            .foregroundStyle(JaaymaStyle.muted)
                        Text("Aucune commande récente.")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(JaaymaStyle.muted)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
                } else {
                    VStack(spacing: 10) {
                        ForEach(value.recentOrders) { order in
                            HStack(spacing: 12) {
                                Image(systemName: "bag.fill")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(JaaymaStyle.ink)
                                    .frame(width: 38, height: 38)
                                    .background(JaaymaStyle.sun.opacity(0.4), in: RoundedRectangle(cornerRadius: 10))
                                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(JaaymaStyle.ink, lineWidth: 1.5))

                                VStack(alignment: .leading, spacing: 3) {
                                    Text(order.customerName)
                                        .font(.system(size: 14, weight: .black, design: .rounded))
                                        .foregroundStyle(JaaymaStyle.ink)
                                    Text("\(order.shop.name) · \(order.reference)")
                                        .font(.system(size: 11, weight: .medium))
                                        .foregroundStyle(JaaymaStyle.muted)
                                }

                                Spacer()

                                Text(formatFcfa(order.total))
                                    .font(.system(size: 14, weight: .black, design: .rounded))
                                    .foregroundStyle(JaaymaStyle.ink)
                            }
                            .padding(12)
                            .background(Color.white, in: RoundedRectangle(cornerRadius: 14))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(JaaymaStyle.ink, lineWidth: 1.5))
                            .shadow(color: JaaymaStyle.ink, radius: 0, x: 2, y: 2)
                        }
                    }
                }
            }

            // Explanatory footnote
            Text("Les ventes encaissées totalisent les commandes marquées comme payées.")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(JaaymaStyle.muted.opacity(0.8))
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top, 4)
        }
    }
}
