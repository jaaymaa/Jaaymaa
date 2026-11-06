import SwiftUI

struct MiniStat: View {
    let title: String
    let value: Int
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("\(value)")
                .font(.title3.weight(.black))
                .foregroundStyle(color)
            Text(title)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(JaaymaStyle.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(13)
        .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 17, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 17, style: .continuous).stroke(JaaymaStyle.ink, lineWidth: 2))
        .shadow(color: JaaymaStyle.cardShadow, radius: 0, x: 2, y: 3)
        .environment(\.colorScheme, .light)
    }
}

