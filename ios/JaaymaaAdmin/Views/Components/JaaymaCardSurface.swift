import SwiftUI

struct JaaymaCardSurface: ViewModifier {
    var radius: CGFloat = 24
    var accent: Color? = nil

    func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)

        content
            .background {
                ZStack(alignment: .topTrailing) {
                    shape.fill(
                        LinearGradient(
                            colors: [Color.white.opacity(0.72), JaaymaStyle.paper],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                    if let accent {
                        Circle()
                            .fill(accent.opacity(0.19))
                            .frame(width: 112, height: 112)
                            .blur(radius: 30)
                            .offset(x: 38, y: -48)
                    }
                }
                .clipShape(shape)
            }
            .overlay {
                shape.stroke(JaaymaStyle.ink.opacity(0.78), lineWidth: 1.5)
            }
            .overlay(alignment: .top) {
                Capsule()
                    .fill(Color.white.opacity(0.72))
                    .frame(height: 1)
                    .padding(.horizontal, radius)
                    .padding(.top, 1)
                    .allowsHitTesting(false)
            }
            .shadow(color: JaaymaStyle.ink.opacity(0.12), radius: 15, x: 0, y: 8)
            .shadow(color: JaaymaStyle.cardShadow.opacity(0.24), radius: 0, x: 2, y: 4)
            .environment(\.colorScheme, .light)
    }
}

extension View {
    func jaaymaCard(radius: CGFloat = 24, accent: Color? = nil) -> some View {
        modifier(JaaymaCardSurface(radius: radius, accent: accent))
    }
}

struct JaaymaStatusBadge: View {
    let title: String
    let tint: Color
    var symbol: String? = nil

    var body: some View {
        HStack(spacing: 5) {
            if let symbol {
                Image(systemName: symbol)
                    .font(.system(size: 9, weight: .bold))
            }

            Text(title)
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .lineLimit(1)
                .minimumScaleFactor(0.72)
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 9)
        .padding(.vertical, 6)
        .background(tint.opacity(0.11), in: Capsule())
        .overlay(Capsule().stroke(tint.opacity(0.2), lineWidth: 1))
        .accessibilityElement(children: .combine)
    }
}

struct JaaymaRowDivider: View {
    var leadingInset: CGFloat = 48

    var body: some View {
        Rectangle()
            .fill(JaaymaStyle.ink.opacity(0.09))
            .frame(height: 1)
            .padding(.leading, leadingInset)
            .accessibilityHidden(true)
    }
}
