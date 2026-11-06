import SwiftUI

struct JaaymaPrimaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

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
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}
