import SwiftUI

struct AccountListContent: View {
    let page: AdminPage<AdminAccount>

    var body: some View {
        SectionCard(title: "Comptes commerçants", subtitle: "\(page.total) compte\(page.total > 1 ? "s" : "") au total") {
            if page.items.isEmpty {
                HStack(spacing: 12) {
                    Image(systemName: "person.2")
                        .font(.system(size: 20))
                        .foregroundStyle(JaaymaStyle.muted)
                    Text("Aucun commerçant trouvé.")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(JaaymaStyle.muted)
                }
                .padding(.vertical, 12)
            } else {
                VStack(spacing: 12) {
                    ForEach(page.items) { account in
                        accountRow(account)

                        if account.id != page.items.last?.id {
                            Divider().background(JaaymaStyle.line)
                        }
                    }
                }
            }
        }
    }

    private func accountRow(_ account: AdminAccount) -> some View {
        HStack(alignment: .top, spacing: 12) {
            // Avatar Squircle
            Image(systemName: "person.2.fill")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(JaaymaStyle.ink)
                .frame(width: 38, height: 38)
                .background(JaaymaStyle.pinkTone, in: RoundedRectangle(cornerRadius: 11))
                .overlay(RoundedRectangle(cornerRadius: 11).stroke(JaaymaStyle.ink, lineWidth: 1.2))

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(account.name.isEmpty ? "Commerçant Jaaymaa" : account.name)
                        .font(.system(size: 14, weight: .black, design: .rounded))
                        .foregroundStyle(JaaymaStyle.ink)

                    if account.shopCount > 0 {
                        Text("\(account.shopCount) btk")
                            .font(.system(size: 9, weight: .black))
                            .foregroundStyle(JaaymaStyle.baobab)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(JaaymaStyle.mint, in: RoundedRectangle(cornerRadius: 5))
                    }
                }

                HStack(spacing: 6) {
                    Image(systemName: "phone.fill")
                        .font(.system(size: 10))
                        .foregroundStyle(JaaymaStyle.muted)

                    Text(account.phone)
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                        .foregroundStyle(JaaymaStyle.ink)
                }

                HStack(spacing: 6) {
                    Text("\(account.orderCount) vente\(account.orderCount > 1 ? "s" : "")")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(JaaymaStyle.muted)

                    if !account.shops.isEmpty {
                        Text("·")
                            .foregroundStyle(JaaymaStyle.muted)
                        Text(account.shops.map { $0.name }.joined(separator: ", "))
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(JaaymaStyle.hibiscus)
                            .lineLimit(1)
                    }
                }
                .padding(.top, 2)
            }

            Spacer(minLength: 4)

            // Quick Call Button
            if let url = URL(string: "tel://\(account.phone)") {
                Link(destination: url) {
                    Image(systemName: "phone.circle.fill")
                        .font(.system(size: 24))
                        .foregroundStyle(JaaymaStyle.baobab)
                }
            }
        }
        .padding(10)
        .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 14))
    }
}
