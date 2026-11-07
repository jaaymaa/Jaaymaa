import SwiftUI

struct InfoCard: View {
    let title: String
    let detail: String
    let symbol: String

    var body: some View {
        SectionCard(title: title, symbol: symbol, accent: JaaymaStyle.hibiscus) {
            Text(detail)
                .font(.subheadline)
                .foregroundStyle(JaaymaStyle.muted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

