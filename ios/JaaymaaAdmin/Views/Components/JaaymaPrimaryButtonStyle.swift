import SwiftUI

struct JaaymaPrimaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .bold, design: .rounded))
            .foregroundStyle(JaaymaStyle.ink)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background {
                Capsule()
                    .fill(JaaymaStyle.sun.opacity(isEnabled ? 1 : 0.55))
                    .shadow(color: JaaymaStyle.cardShadow, radius: 0, x: 2, y: configuration.isPressed ? 1 : 3)
            }
            .overlay(Capsule().stroke(JaaymaStyle.ink, lineWidth: 2.5))
            .offset(y: configuration.isPressed ? 2 : 0)
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .contentShape(Capsule())
            .animation(reduceMotion ? nil : .spring(response: 0.28, dampingFraction: 0.68), value: configuration.isPressed)
    }
}

struct JaaymaInteractiveButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.975 : 1)
            .offset(y: configuration.isPressed ? 1 : 0)
            .opacity(isEnabled ? 1 : 0.58)
            .animation(reduceMotion ? nil : .spring(response: 0.28, dampingFraction: 0.68), value: configuration.isPressed)
    }
}
