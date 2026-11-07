import SwiftUI

struct AccountListContent: View {
    let page: AdminPage<AdminAccount>

    var body: some View {
        SectionCard(
            title: "Comptes vendeurs",
            subtitle: "\(page.total) comptes au total",
            symbol: "person.2.fill",
            accent: Color(red: 246 / 255, green: 195 / 255, blue: 210 / 255)
        ) {
            if page.items.isEmpty {
                ContentUnavailableView(
                    "Aucun compte vendeur",
                    systemImage: "person.crop.circle.badge.questionmark",
                    description: Text("Les comptes apparaîtront ici dès leur inscription.")
                )
                .padding(.vertical, 8)
            }

            ForEach(page.items) { account in
                VStack(alignment: .leading, spacing: 11) {
                    JaaymaRowDivider(leadingInset: 0)

                    HStack(spacing: 11) {
                        Text(initials(for: account.name))
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                            .foregroundStyle(JaaymaStyle.ink)
                            .frame(width: 42, height: 42)
                            .background(
                                JaaymaStyle.hibiscus.opacity(0.15),
                                in: RoundedRectangle(cornerRadius: 15, style: .continuous)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 15, style: .continuous)
                                    .stroke(JaaymaStyle.hibiscus.opacity(0.22), lineWidth: 1)
                            )

                        VStack(alignment: .leading, spacing: 4) {
                            Text(account.name.isEmpty ? "Vendeur" : account.name)
                                .font(.system(size: 14, weight: .bold, design: .rounded))
                                .foregroundStyle(JaaymaStyle.ink)
                                .lineLimit(1)

                            Label(account.phone, systemImage: "phone")
                                .font(.system(size: 11, weight: .medium, design: .rounded).monospacedDigit())
                                .foregroundStyle(JaaymaStyle.muted)
                                .lineLimit(1)
                        }

                        Spacer(minLength: 4)

                        Image(systemName: "person.crop.circle.fill")
                            .font(.system(size: 17, weight: .medium))
                            .foregroundStyle(JaaymaStyle.muted.opacity(0.72))
                    }

                    HStack(spacing: 8) {
                        JaaymaStatusBadge(
                            title: "\(account.shopCount) boutique\(account.shopCount == 1 ? "" : "s")",
                            tint: JaaymaStyle.green,
                            symbol: "storefront"
                        )
                        JaaymaStatusBadge(
                            title: "\(account.orderCount) commande\(account.orderCount == 1 ? "" : "s")",
                            tint: JaaymaStyle.ink,
                            symbol: "bag"
                        )
                    }
                    .padding(.leading, 53)
                }
                .padding(.top, 3)
            }
        }
    }

    private func initials(for name: String) -> String {
        let letters = name.split(whereSeparator: \.isWhitespace).prefix(2).compactMap(\.first)
        return letters.isEmpty ? "J" : String(letters).uppercased()
    }
}
