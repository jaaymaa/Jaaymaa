import SwiftUI

struct MetricTile: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let title: String
    let value: String
    let note: String
    let symbol: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(alignment: .center, spacing: 8) {
                Text(title)
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(JaaymaStyle.muted)
                    .lineLimit(2)

                Spacer(minLength: 2)

                Image(systemName: symbol)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(JaaymaStyle.ink)
                    .frame(width: 32, height: 32)
                    .background(tint.opacity(0.25), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            }

            Text(value)
                .font(.system(size: 25, weight: .semibold, design: .rounded).monospacedDigit())
                .foregroundStyle(JaaymaStyle.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.65)
                .contentTransition(.numericText())

            Text(note)
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundStyle(JaaymaStyle.muted)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .jaaymaCard(radius: 20)
        .animation(reduceMotion ? nil : .snappy(duration: 0.25), value: value)
    }
}
