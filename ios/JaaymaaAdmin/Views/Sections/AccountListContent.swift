import SwiftUI

struct AccountListContent: View {
    let page: AdminPage<AdminAccount>

    var body: some View {
        SectionCard(title: "Comptes vendeurs", subtitle: "\(page.total) commerçants enregistrés") {
            if page.items.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "person.2")
                        .font(.system(size: 32))
                        .foregroundStyle(JaaymaStyle.muted)
                    Text("Aucun compte trouvé.")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(JaaymaStyle.muted)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
            } else {
                VStack(spacing: 12) {
                    ForEach(page.items) { account in
                        accountCard(account)
                    }
                }
            }
        }
    }

    private func accountCard(_ account: AdminAccount) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 24))
                    .foregroundStyle(JaaymaStyle.ink)
                    .frame(width: 40, height: 40)
                    .background(JaaymaStyle.pinkTone, in: RoundedRectangle(cornerRadius: 11))
                    .overlay(RoundedRectangle(cornerRadius: 11).stroke(JaaymaStyle.ink, lineWidth: 1.5))

                VStack(alignment: .leading, spacing: 2) {
                    Text(account.name.isEmpty ? "Vendeur Jaaymaa" : account.name)
                        .font(.system(size: 15, weight: .black, design: .rounded))
                        .foregroundStyle(JaaymaStyle.ink)

                    if let url = URL(string: "tel:\(account.phone)") {
                        Link(destination: url) {
                            HStack(spacing: 4) {
                                Image(systemName: "phone.fill")
                                    .font(.system(size: 10))
                                Text(account.phone)
                                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                            }
                            .foregroundStyle(JaaymaStyle.goldText)
                        }
                    } else {
                        Text(account.phone)
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                            .foregroundStyle(JaaymaStyle.muted)
                    }
                }

                Spacer()

                HStack(spacing: 12) {
                    statPill(label: "Boutiques", count: account.shopCount)
                    statPill(label: "Commandes", count: account.orderCount)
                }
            }

            if !account.shops.isEmpty {
                HStack(spacing: 6) {
                    Text("Boutiques :")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(JaaymaStyle.muted)

                    ForEach(account.shops.prefix(3)) { shop in
                        Text(shop.name)
                            .font(.system(size: 10, weight: .bold))
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(JaaymaStyle.chip, in: RoundedRectangle(cornerRadius: 6))
                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(JaaymaStyle.ink.opacity(0.2), lineWidth: 1))
                            .foregroundStyle(JaaymaStyle.ink)
                    }
                }
                .padding(.top, 2)
            }
        }
        .padding(14)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(JaaymaStyle.ink, lineWidth: 1.8))
        .shadow(color: JaaymaStyle.ink, radius: 0, x: 2.5, y: 2.5)
    }

    private func statPill(label: String, count: Int) -> some View {
        VStack(spacing: 1) {
            Text("\(count)")
                .font(.system(size: 14, weight: .black, design: .rounded))
                .foregroundStyle(JaaymaStyle.ink)
            Text(label)
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(JaaymaStyle.muted)
        }
    }
}
