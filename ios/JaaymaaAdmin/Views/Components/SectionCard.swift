import SwiftUI

struct SectionCard<Content: View>: View {
    let title: String
    var subtitle: String?
    let content: Content

    init(title: String, subtitle: String? = nil, @ViewBuilder content: () -> Content) {
        self.title = title
        self.subtitle = subtitle
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 17, weight: .black, design: .rounded))
                    .foregroundStyle(JaaymaStyle.ink)
                if let subtitle {
                    Text(subtitle)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(JaaymaStyle.muted)
                }
            }
            content
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 22))
        .overlay(RoundedRectangle(cornerRadius: 22).stroke(JaaymaStyle.ink, lineWidth: 2.5))
        .shadow(color: JaaymaStyle.ink, radius: 0, x: 4, y: 4)
    }
}
