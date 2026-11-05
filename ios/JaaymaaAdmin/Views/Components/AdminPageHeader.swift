import SwiftUI

struct AdminPageHeader: View {
    let eyebrow: String
    let title: String
    let description: String
    var badgeText: String? = nil
    var badgeIcon: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(eyebrow.uppercased())
                        .font(.system(size: 10, weight: .black))
                        .tracking(1.6)
                        .foregroundStyle(JaaymaStyle.darkHibiscus)

                    Text(title)
                        .font(.system(size: 24, weight: .black, design: .rounded))
                        .foregroundStyle(JaaymaStyle.ink)
                }

                Spacer(minLength: 8)

                if let badgeText {
                    HStack(spacing: 5) {
                        if let badgeIcon {
                            Image(systemName: badgeIcon)
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(JaaymaStyle.baobab)
                        }
                        Text(badgeText)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(JaaymaStyle.ink)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 12))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.ink, lineWidth: 1.5))
                    .shadow(color: JaaymaStyle.ink, radius: 0, x: 2, y: 2)
                }
            }

            Text(description)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(JaaymaStyle.ink.opacity(0.85))
                .lineSpacing(2)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(JaaymaStyle.sun, in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(JaaymaStyle.ink, lineWidth: 2))
        .shadow(color: JaaymaStyle.ink, radius: 0, x: 3, y: 3)
    }
}
