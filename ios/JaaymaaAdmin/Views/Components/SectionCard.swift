import SwiftUI

struct SectionCard<Content: View>: View {
    let title: String
    var subtitle: String?
    var symbol: String?
    var accent: Color
    let content: Content

    init(
        title: String,
        subtitle: String? = nil,
        symbol: String? = nil,
        accent: Color = JaaymaStyle.sun,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.subtitle = subtitle
        self.symbol = symbol
        self.accent = accent
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 17) {
            HStack(spacing: 11) {
                if let symbol {
                    Image(systemName: symbol)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(JaaymaStyle.ink)
                        .frame(width: 38, height: 38)
                        .background(accent.opacity(0.42), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 13, style: .continuous).stroke(JaaymaStyle.ink.opacity(0.13), lineWidth: 1))
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(JaaymaStyle.ink)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityAddTraits(.isHeader)
                    if let subtitle {
                        Text(subtitle)
                            .font(.caption.weight(.medium))
                            .foregroundStyle(JaaymaStyle.muted)
                    }
                }

                Spacer(minLength: 0)
            }

            content
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .jaaymaCard(radius: 24, accent: accent)
    }
}

