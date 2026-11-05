import SwiftUI

struct AnalyticsContent: View {
    let value: AdminAnalytics

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            if value.status == "ready", let current = value.current {
                // Symmetrical 2x2 Metric Grid
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                    MetricTile(
                        title: "Visiteurs actifs",
                        value: "\(current.activeUsers)",
                        subtitle: "\(value.rangeDays ?? 28) derniers jours",
                        symbol: "person.fill",
                        tone: JaaymaStyle.sun
                    )

                    MetricTile(
                        title: "Sessions",
                        value: "\(current.sessions)",
                        subtitle: "\(current.newUsers) nouveaux",
                        symbol: "waveform.path",
                        tone: JaaymaStyle.mint
                    )

                    MetricTile(
                        title: "Pages vues",
                        value: "\(current.pageViews)",
                        subtitle: "Consultations totales",
                        symbol: "eye.fill",
                        tone: JaaymaStyle.blueTone
                    )

                    MetricTile(
                        title: "Achats suivis",
                        value: "\(current.purchases)",
                        subtitle: formatFcfa(Int(current.revenue)),
                        symbol: "cart.fill",
                        tone: JaaymaStyle.pinkTone
                    )
                }

                // Top Pages Card
                SectionCard(title: "Pages les plus consultées", subtitle: "Audience par URL") {
                    if let pages = value.topPages, !pages.isEmpty {
                        VStack(spacing: 10) {
                            ForEach(pages) { page in
                                HStack {
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(page.title.isEmpty ? page.path : page.title)
                                            .font(.system(size: 13, weight: .bold, design: .rounded))
                                            .foregroundStyle(JaaymaStyle.ink)

                                        Text(page.path)
                                            .font(.system(size: 11, weight: .medium, design: .monospaced))
                                            .foregroundStyle(JaaymaStyle.muted)
                                    }

                                    Spacer()

                                    Text("\(page.views) vues")
                                        .font(.system(size: 12, weight: .black, design: .rounded))
                                        .foregroundStyle(JaaymaStyle.ink)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(JaaymaStyle.chip, in: Capsule())
                                }
                                .padding(10)
                                .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 12))

                                if page.id != pages.last?.id {
                                    Divider().background(JaaymaStyle.line)
                                }
                            }
                        }
                    } else {
                        Text("Aucune page enregistrée.")
                            .font(.system(size: 13))
                            .foregroundStyle(JaaymaStyle.muted)
                    }
                }
            } else {
                InfoCard(
                    title: value.status == "setup_required" ? "Google Analytics à configurer" : "Analytics indisponible",
                    detail: value.message ?? "Vérifie les variables d'environnement GA4 (propertyId, credentials) dans Cloudflare.",
                    symbol: "chart.bar.xaxis"
                )
            }
        }
    }
}
