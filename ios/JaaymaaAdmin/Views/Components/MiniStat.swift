import SwiftUI

struct MiniStat: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let title: String
    let value: Int
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text("\(value)")
                .font(.system(size: 22, weight: .semibold, design: .rounded).monospacedDigit())
                .foregroundStyle(color)
                .contentTransition(.numericText())

            Text(title)
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundStyle(JaaymaStyle.muted)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(13)
        .jaaymaCard(radius: 18)
        .animation(reduceMotion ? nil : .snappy(duration: 0.25), value: value)
    }
}
