import SwiftUI

struct MiniStat: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let title: String
    let value: Int
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text("\(value)")
                .font(.system(size: 23, weight: .bold, design: .rounded).monospacedDigit())
                .foregroundStyle(JaaymaStyle.ink)
                .contentTransition(.numericText())

            Text(title)
                .font(.system(size: 10, weight: .semibold, design: .rounded))
                .foregroundStyle(JaaymaStyle.muted)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .overlay(alignment: .topLeading) {
            Capsule()
                .fill(color)
                .frame(width: 26, height: 3)
                .padding(.leading, 12)
                .padding(.top, 7)
        }
        .jaaymaCard(radius: 19, accent: color)
        .animation(reduceMotion ? nil : .snappy(duration: 0.25), value: value)
    }
}
