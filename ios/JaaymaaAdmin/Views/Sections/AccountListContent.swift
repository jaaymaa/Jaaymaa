import SwiftUI

struct AccountListContent: View {
    let page: AdminPage<AdminAccount>

    var body: some View {
        SectionCard(title: "Comptes vendeurs", subtitle: "\(page.total) comptes") {
            if page.items.isEmpty {
                Text("Aucun compte à afficher.")
                    .foregroundStyle(JaaymaStyle.muted)
            }

            ForEach(page.items) { account in
                HStack(spacing: 12) {
                    Image(systemName: "person.crop.circle.fill")
                        .font(.title2)
                        .foregroundStyle(JaaymaStyle.hibiscus)

                    VStack(alignment: .leading, spacing: 3) {
                        Text(account.name.isEmpty ? "Vendeur" : account.name)
                            .font(.subheadline.weight(.bold))
                        Text(account.phone)
                            .font(.caption.monospaced())
                            .foregroundStyle(JaaymaStyle.muted)
                        Text("\(account.shopCount) boutique(s) · \(account.orderCount) commande(s)")
                            .font(.caption2)
                            .foregroundStyle(JaaymaStyle.muted)
                    }

                    Spacer()
                }
                .padding(.vertical, 4)
            }
        }
    }
}

