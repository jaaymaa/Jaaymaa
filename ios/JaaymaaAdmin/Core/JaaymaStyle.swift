import SwiftUI

enum JaaymaStyle {
    // Brand Tokens
    static let ink = Color(red: 15 / 255, green: 30 / 255, blue: 61 / 255)       // #0F1E3D - Encre
    static let sun = Color(red: 255 / 255, green: 200 / 255, blue: 61 / 255)    // #FFC83D - Soleil
    static let sunAlt = Color(red: 255 / 255, green: 155 / 255, blue: 33 / 255) // #FF9B21 - Soleil Foncé
    static let hibiscus = Color(red: 200 / 255, green: 38 / 255, blue: 90 / 255) // #C8265A - Hibiscus
    static let darkHibiscus = Color(red: 140 / 255, green: 28 / 255, blue: 65 / 255) // #8C1C41
    static let baobab = Color(red: 14 / 255, green: 124 / 255, blue: 102 / 255) // #0E7C66 - Baobab / Vert
    static let nuit = Color(red: 10 / 255, green: 21 / 255, blue: 48 / 255)     // #0A1530 - Nuit
    static let paper = Color(red: 255 / 255, green: 251 / 255, blue: 242 / 255) // #FFFBF2 - Papier
    static let chip = Color(red: 240 / 255, green: 237 / 255, blue: 232 / 255)  // #F0EDE8 - Chip
    static let muted = Color(red: 63 / 255, green: 75 / 255, blue: 105 / 255)   // #3F4B69
    static let ghost = Color(red: 195 / 255, green: 204 / 255, blue: 230 / 255) // #C3CCE6
    static let line = Color(red: 225 / 255, green: 230 / 255, blue: 240 / 255)  // #E1E6F0

    // Metric Tones
    static let mint = Color(red: 207 / 255, green: 239 / 255, blue: 230 / 255)  // #CFEFE6
    static let pinkTone = Color(red: 246 / 255, green: 195 / 255, blue: 210 / 255) // #F6C3D2
    static let blueTone = Color(red: 220 / 255, green: 229 / 255, blue: 255 / 255) // #DCE5FF
    static let goldText = Color(red: 154 / 255, green: 101 / 255, blue: 0 / 255)  // #9A6500

    // Backward-compat aliases
    static let green = baobab
}

// MARK: - Neo-Brutalist View Modifiers

struct BrutalistCardModifier: ViewModifier {
    var backgroundColor: Color = JaaymaStyle.paper
    var borderColor: Color = JaaymaStyle.ink
    var cornerRadius: CGFloat = 22
    var borderWidth: CGFloat = 2.5
    var shadowOffset: CGFloat = 4
    var shadowColor: Color = JaaymaStyle.ink

    func body(content: Content) -> some View {
        content
            .background(backgroundColor, in: RoundedRectangle(cornerRadius: cornerRadius))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(borderColor, lineWidth: borderWidth)
            )
            .shadow(color: shadowColor, radius: 0, x: shadowOffset, y: shadowOffset)
    }
}

struct BrutalistPillModifier: ViewModifier {
    var backgroundColor: Color = JaaymaStyle.sun
    var borderColor: Color = JaaymaStyle.ink
    var borderWidth: CGFloat = 2
    var shadowOffset: CGFloat = 2
    var shadowColor: Color = JaaymaStyle.ink

    func body(content: Content) -> some View {
        content
            .background(backgroundColor, in: Capsule())
            .overlay(
                Capsule()
                    .stroke(borderColor, lineWidth: borderWidth)
            )
            .shadow(color: shadowColor, radius: 0, x: shadowOffset, y: shadowOffset)
    }
}

struct BrutalistInputModifier: ViewModifier {
    var cornerRadius: CGFloat = 14
    var borderWidth: CGFloat = 2
    var borderColor: Color = JaaymaStyle.ink

    func body(content: Content) -> some View {
        content
            .padding(14)
            .background(Color.white, in: RoundedRectangle(cornerRadius: cornerRadius))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(borderColor, lineWidth: borderWidth)
            )
            .shadow(color: JaaymaStyle.ink.opacity(0.15), radius: 0, x: 2, y: 2)
    }
}

struct BrutalistButtonStyle: ButtonStyle {
    var backgroundColor: Color = JaaymaStyle.sun
    var foregroundColor: Color = JaaymaStyle.ink
    var cornerRadius: CGFloat = 16
    var isPill: Bool = true
    var shadowOffset: CGFloat = 3

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .black, design: .rounded))
            .foregroundStyle(foregroundColor)
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(
                Group {
                    if isPill {
                        Capsule().fill(backgroundColor)
                    } else {
                        RoundedRectangle(cornerRadius: cornerRadius).fill(backgroundColor)
                    }
                }
            )
            .overlay(
                Group {
                    if isPill {
                        Capsule().stroke(JaaymaStyle.ink, lineWidth: 2)
                    } else {
                        RoundedRectangle(cornerRadius: cornerRadius).stroke(JaaymaStyle.ink, lineWidth: 2)
                    }
                }
            )
            .shadow(
                color: configuration.isPressed ? .clear : JaaymaStyle.ink,
                radius: 0,
                x: configuration.isPressed ? 1 : shadowOffset,
                y: configuration.isPressed ? 1 : shadowOffset
            )
            .offset(
                x: configuration.isPressed ? shadowOffset - 1 : 0,
                y: configuration.isPressed ? shadowOffset - 1 : 0
            )
            .animation(.spring(response: 0.2, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

extension View {
    func brutalistCard(
        background: Color = JaaymaStyle.paper,
        borderColor: Color = JaaymaStyle.ink,
        cornerRadius: CGFloat = 22,
        borderWidth: CGFloat = 2.5,
        shadowOffset: CGFloat = 4
    ) -> some View {
        modifier(BrutalistCardModifier(
            backgroundColor: background,
            borderColor: borderColor,
            cornerRadius: cornerRadius,
            borderWidth: borderWidth,
            shadowOffset: shadowOffset
        ))
    }

    func brutalistPill(
        background: Color = JaaymaStyle.sun,
        borderColor: Color = JaaymaStyle.ink,
        borderWidth: CGFloat = 2,
        shadowOffset: CGFloat = 2
    ) -> some View {
        modifier(BrutalistPillModifier(
            backgroundColor: background,
            borderColor: borderColor,
            borderWidth: borderWidth,
            shadowOffset: shadowOffset
        ))
    }

    func brutalistInput(
        cornerRadius: CGFloat = 14,
        borderWidth: CGFloat = 2
    ) -> some View {
        modifier(BrutalistInputModifier(
            cornerRadius: cornerRadius,
            borderWidth: borderWidth
        ))
    }
}
