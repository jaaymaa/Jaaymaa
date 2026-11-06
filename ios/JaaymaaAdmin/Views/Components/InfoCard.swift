import SwiftUI

struct InfoCard: View {
    let title: String
    let detail: String
    let symbol: String

    var body: some View {
        SectionCard(title: title) {
            Label(detail, systemImage: symbol)
                .font(.subheadline)
                .foregroundStyle(JaaymaStyle.muted)
        }
    }
}

