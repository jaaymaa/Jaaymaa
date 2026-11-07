import SwiftUI

struct MetricTile: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let title: String
    let value: String
    let note: String
    let symbol: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 11) {
            HStack(alignment: .center, spacing: 10) {
                Text(title.uppercased())
                    .font(.caption2.weight(.heavy))
                    .tracking(0.75)
                    .foregroundStyle(JaaymaStyle.muted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.82)

                Spacer(minLength: 4)

                Image(systemName: symbol)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(JaaymaStyle.ink)
                    .frame(width: 36, height: 36)
                    .background(tint.opacity(0.56), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(JaaymaStyle.ink.opacity(0.13), lineWidth: 1))
            }

            Text(value)
                .font(.system(size: 29, weight: .bold, design: .rounded).monospacedDigit())
                .foregroundStyle(JaaymaStyle.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.58)
                .contentTransition(.numericText())

            Text(note)
                .font(.caption2.weight(.medium))
                .foregroundStyle(JaaymaStyle.muted)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(15)
        .frame(maxWidth: .infinity, alignment: .leading)
        .jaaymaCard(radius: 22, accent: tint)
        .animation(reduceMotion ? nil : .snappy(duration: 0.25), value: value)
    }
}
