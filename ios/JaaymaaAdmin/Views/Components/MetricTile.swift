import SwiftUI

struct MetricTile: View {
    let title: String
    let value: String
    let note: String
    let symbol: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text(title.uppercased())
                    .font(.caption2.weight(.heavy))
                    .tracking(0.65)
                    .foregroundStyle(JaaymaStyle.muted)
                Spacer()
                Image(systemName: symbol)
                    .font(.footnote.weight(.bold))
                    .padding(9)
                    .background(tint, in: RoundedRectangle(cornerRadius: 11))
            }
            Text(value)
                .font(.system(size: 26, weight: .black, design: .rounded))
                .foregroundStyle(JaaymaStyle.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .contentTransition(.numericText())
            Text(note)
                .font(.caption2.weight(.medium))
                .foregroundStyle(JaaymaStyle.muted)
                .lineLimit(1)
        }
        .padding(15)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(JaaymaStyle.paper)
                .shadow(color: JaaymaStyle.cardShadow, radius: 0, x: 2, y: 4)
        }
        .overlay {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(JaaymaStyle.ink, lineWidth: 2.5)
        }
        .environment(\.colorScheme, .light)
        .animation(.snappy(duration: 0.25), value: value)
    }
}

