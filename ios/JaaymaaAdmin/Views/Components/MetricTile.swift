import SwiftUI

struct MetricTile: View {
    let title: String
    let value: String
    let note: String
    let symbol: String
    var tone: MetricTone = .sun

    enum MetricTone {
        case sun, pink, mint, blue

        var background: Color {
            switch self {
            case .sun: return JaaymaStyle.sun
            case .pink: return JaaymaStyle.pinkTone
            case .mint: return JaaymaStyle.mint
            case .blue: return JaaymaStyle.blueTone
            }
        }
    }

    // Convenience init taking Color
    init(title: String, value: String, note: String, symbol: String, tint: Color = JaaymaStyle.sun) {
        self.title = title
        self.value = value
        self.note = note
        self.symbol = symbol
        if tint == JaaymaStyle.sun {
            self.tone = .sun
        } else if tint == JaaymaStyle.mint {
            self.tone = .mint
        } else if tint == JaaymaStyle.pinkTone || tint == JaaymaStyle.hibiscus {
            self.tone = .pink
        } else {
            self.tone = .blue
        }
    }

    init(title: String, value: String, note: String, symbol: String, tone: MetricTone) {
        self.title = title
        self.value = value
        self.note = note
        self.symbol = symbol
        self.tone = tone
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(title.uppercased())
                    .font(.system(size: 10, weight: .black))
                    .tracking(1.2)
                    .foregroundStyle(JaaymaStyle.muted)
                Spacer()
                Image(systemName: symbol)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(JaaymaStyle.ink)
                    .frame(width: 36, height: 36)
                    .background(tone.background, in: RoundedRectangle(cornerRadius: 11))
                    .overlay(RoundedRectangle(cornerRadius: 11).stroke(JaaymaStyle.ink, lineWidth: 2))
            }
            Text(value)
                .font(.system(size: 26, weight: .black, design: .rounded))
                .foregroundStyle(JaaymaStyle.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.65)
            Text(note)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(JaaymaStyle.muted)
                .lineLimit(1)
        }
        .padding(15)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(JaaymaStyle.ink, lineWidth: 2.2))
        .shadow(color: JaaymaStyle.ink, radius: 0, x: 3.5, y: 3.5)
    }
}
