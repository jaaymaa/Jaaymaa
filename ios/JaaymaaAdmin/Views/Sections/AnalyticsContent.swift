import SwiftUI

struct AnalyticsContent: View {
    let value: AdminAnalytics

    var body: some View {
        if value.status == "ready", let current = value.current {
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 150, maximum: 250), spacing: 12)], spacing: 12) {
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

            let pages = value.topPages ?? []
            let maximumViews = max(pages.map(\.views).max() ?? 1, 1)

            SectionCard(
                title: "Pages les plus consultées",
                subtitle: "Popularité sur la période",
                symbol: "chart.bar.xaxis",
                accent: JaaymaStyle.mist
            ) {
                if pages.isEmpty {
                    Text("Les pages consultées apparaîtront ici.")
                        .font(.subheadline)
                        .foregroundStyle(JaaymaStyle.muted)
                }

                ForEach(0..<min(pages.count, 6), id: \.self) { index in
                    let page = pages[index]

                    HStack(spacing: 11) {
                        Text("\(index + 1)")
                            .font(.system(size: 11, weight: .bold, design: .rounded).monospacedDigit())
                            .foregroundStyle(JaaymaStyle.muted)
                            .frame(width: 18, alignment: .leading)

                        VStack(alignment: .leading, spacing: 6) {
                            Text(page.title.isEmpty ? page.path : page.title)
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(JaaymaStyle.ink)
                                .lineLimit(1)
                            Text(page.path)
                                .font(.caption2)
                                .foregroundStyle(JaaymaStyle.muted)
                                .lineLimit(1)
                            ProgressView(value: Double(page.views), total: Double(maximumViews))
                                .tint(JaaymaStyle.sun)
                                .scaleEffect(y: 0.8, anchor: .center)
                        }

                        Text("\(page.views)")
                            .font(.system(size: 14, weight: .bold, design: .rounded).monospacedDigit())
                            .foregroundStyle(JaaymaStyle.ink)
                            .frame(minWidth: 34, alignment: .trailing)
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

