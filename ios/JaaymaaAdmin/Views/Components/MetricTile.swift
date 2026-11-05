import SwiftUI

struct MetricTile: View {
    let title: String
    let value: String
    var subtitle: String?
    var symbol: String
    var tone: Color
    var iconColor: Color

    init(
        title: String,
        value: String,
        subtitle: String? = nil,
        note: String? = nil,
        symbol: String = "chart.line.uptrend.xyaxis",
        tone: Color = JaaymaStyle.sun,
        tint: Color? = nil,
        iconColor: Color = JaaymaStyle.ink
    ) {
        self.title = title
        self.value = value
        self.subtitle = subtitle ?? note
        self.symbol = symbol
        self.tone = tint ?? tone
        self.iconColor = iconColor
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                // Colored Icon Squircle
                Image(systemName: symbol)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(iconColor)
                    .frame(width: 32, height: 32)
                    .background(tone, in: RoundedRectangle(cornerRadius: 10))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(JaaymaStyle.ink, lineWidth: 1.2))

                Spacer()

                if let subtitle {
                    Text(subtitle)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(JaaymaStyle.ink)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(tone.opacity(0.35), in: Capsule())
                        .overlay(Capsule().stroke(JaaymaStyle.ink.opacity(0.2), lineWidth: 1))
                }
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(value)
                    .font(.system(size: 21, weight: .black, design: .rounded))
                    .foregroundStyle(JaaymaStyle.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)

                Text(title.uppercased())
                    .font(.system(size: 10, weight: .black))
                    .tracking(0.8)
                    .foregroundStyle(JaaymaStyle.muted)
                    .lineLimit(1)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(minHeight: 102)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(JaaymaStyle.ink, lineWidth: 1.5))
        .shadow(color: JaaymaStyle.ink, radius: 0, x: 2.5, y: 2.5)
    }
}
