import SwiftUI

struct InfoCard: View {
    let title: String
    let detail: String
    let symbol: String

    var body: some View {
        SectionCard(title: title) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: symbol)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(JaaymaStyle.goldText)
                    .frame(width: 40, height: 40)
                    .background(JaaymaStyle.sun.opacity(0.3), in: RoundedRectangle(cornerRadius: 11))
                    .overlay(RoundedRectangle(cornerRadius: 11).stroke(JaaymaStyle.ink, lineWidth: 1.5))

                Text(detail)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(JaaymaStyle.muted)
                    .lineSpacing(3)
            }
            .padding(.vertical, 4)
        }
    }
}
