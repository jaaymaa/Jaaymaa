import SwiftUI

struct InfoCard: View {
    let title: String
    let detail: String
    let symbol: String

    var body: some View {
        SectionCard(title: title) {
            HStack(spacing: 10) {
                Image(systemName: symbol)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(JaaymaStyle.sun)
                    .frame(width: 32, height: 32)
                    .background(JaaymaStyle.ink, in: RoundedRectangle(cornerRadius: 10))

                Text(detail)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(JaaymaStyle.ink)
            }
        }
    }
}
