import SwiftUI

struct AnalyticsContent: View {
    let value: AdminAnalytics

    var body: some View {
        if value.status == "ready", let current = value.current {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                MetricTile(
                    title: "Visiteurs actifs",
                    value: "\(current.activeUsers)",
                    note: "Sur \(value.rangeDays ?? 28) jours",
                    symbol: "person.fill",
                    tint: JaaymaStyle.sun
                )
                MetricTile(
                    title: "Sessions",
                    value: "\(current.sessions)",
                    note: "\(current.newUsers) nouveaux visiteurs",
                    symbol: "waveform.path",
                    tint: Color(red: 207 / 255, green: 239 / 255, blue: 230 / 255)
                )
                MetricTile(
                    title: "Pages vues",
                    value: "\(current.pageViews)",
                    note: "Toutes pages confondues",
                    symbol: "eye.fill",
                    tint: Color(red: 220 / 255, green: 229 / 255, blue: 1)
                )
                MetricTile(
                    title: "Achats suivis",
                    value: "\(current.purchases)",
                    note: formatFcfa(Int(current.revenue)),
                    symbol: "cart.fill",
                    tint: Color(red: 246 / 255, green: 195 / 255, blue: 210 / 255)
                )
            }

            SectionCard(title: "Pages les plus consultées") {
                ForEach(value.topPages ?? []) { page in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(page.title.isEmpty ? page.path : page.title)
                                .font(.subheadline.weight(.bold))
                            Text(page.path)
                                .font(.caption)
                                .foregroundStyle(JaaymaStyle.muted)
                        }
                        Spacer()
                        Text("\(page.views)")
                            .font(.headline.weight(.heavy))
                    }
                    .padding(.vertical, 4)
                }
            }
        } else {
            InfoCard(
                title: value.status == "setup_required" ? "Analytics à configurer" : "Analytics indisponible",
                detail: value.message ?? "Vérifie la configuration de Google Analytics dans les réglages de la plateforme.",
                symbol: "chart.bar.xaxis"
            )
        }
    }
}

