import SwiftUI

struct AnalyticsContent: View {
    let value: AdminAnalytics

    var body: some View {
        VStack(spacing: 18) {
            if value.status == "ready", let current = value.current {
                // 4 Top Analytics Metric Cards
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                    MetricTile(
                        title: "Visiteurs actifs",
                        value: "\(current.activeUsers)",
                        note: "Sur \(value.rangeDays ?? 28) jours",
                        symbol: "person.fill",
                        tone: .sun
                    )
                    MetricTile(
                        title: "Sessions",
                        value: "\(current.sessions)",
                        note: "\(current.newUsers) nouveaux visiteurs",
                        symbol: "waveform.path",
                        tone: .mint
                    )
                    MetricTile(
                        title: "Pages vues",
                        value: "\(current.pageViews)",
                        note: "Toutes pages confondues",
                        symbol: "eye.fill",
                        tone: .blue
                    )
                    MetricTile(
                        title: "Achats suivis",
                        value: "\(current.purchases)",
                        note: formatFcfa(Int(current.revenue)),
                        symbol: "cart.fill",
                        tone: .pink
                    )
                }

                // Top Pages Card
                SectionCard(
                    title: "Pages les plus consultées",
                    subtitle: "Trafic organique et direct"
                ) {
                    if (value.topPages ?? []).isEmpty {
                        Text("Aucune donnée de page pour la période.")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(JaaymaStyle.muted)
                            .padding(.vertical, 14)
                    } else {
                        VStack(spacing: 10) {
                            ForEach(value.topPages ?? []) { page in
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(page.title.isEmpty ? page.path : page.title)
                                            .font(.system(size: 13, weight: .black, design: .rounded))
                                            .foregroundStyle(JaaymaStyle.ink)
                                            .lineLimit(1)
                                        Text(page.path)
                                            .font(.system(size: 11, weight: .medium, design: .monospaced))
                                            .foregroundStyle(JaaymaStyle.muted)
                                            .lineLimit(1)
                                    }
                                    Spacer()
                                    Text("\(page.views) vues")
                                        .font(.system(size: 12, weight: .black, design: .rounded))
                                        .foregroundStyle(JaaymaStyle.goldText)
                                }
                                .padding(11)
                                .background(Color.white, in: RoundedRectangle(cornerRadius: 12))
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.ink, lineWidth: 1.5))
                            }
                        }
                    }
                }
            } else {
                InfoCard(
                    title: value.status == "setup_required" ? "Google Analytics à configurer" : "Analytics indisponible",
                    detail: value.message ?? "Vérifie les variables GA_SERVICE_ACCOUNT_JSON et GA_PROPERTY_ID dans Cloudflare.",
                    symbol: "chart.bar.xaxis"
                )
            }
        }
    }
}
