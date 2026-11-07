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
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 10) {
                if let symbol {
                    Image(systemName: symbol)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(JaaymaStyle.ink)
                        .frame(width: 32, height: 32)
                        .background(accent.opacity(0.22), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.system(size: 17, weight: .semibold, design: .rounded))
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
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .jaaymaCard(radius: 21)
    }
}

