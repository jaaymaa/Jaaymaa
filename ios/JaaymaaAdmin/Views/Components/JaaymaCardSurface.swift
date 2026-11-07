import SwiftUI

struct JaaymaCardSurface: ViewModifier {
    var radius: CGFloat = 22

    func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)

        content
            .background {
                shape
                    .fill(JaaymaStyle.paper)
                    .shadow(color: JaaymaStyle.ink.opacity(0.16), radius: 12, x: 0, y: 6)
            }
            .environment(\.colorScheme, .light)
    }
}

extension View {
    func jaaymaCard(radius: CGFloat = 22) -> some View {
        modifier(JaaymaCardSurface(radius: radius))
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
                .font(.system(size: 10, weight: .semibold, design: .rounded))
                .lineLimit(1)
                .minimumScaleFactor(0.72)
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 9)
        .padding(.vertical, 5)
        .background(tint.opacity(0.1), in: Capsule())
        .accessibilityElement(children: .combine)
    }
}

struct JaaymaRowDivider: View {
    var leadingInset: CGFloat = 48

    var body: some View {
        Rectangle()
            .fill(JaaymaStyle.ink.opacity(0.1))
            .frame(height: 1)
            .padding(.leading, leadingInset)
            .accessibilityHidden(true)
    }
}
