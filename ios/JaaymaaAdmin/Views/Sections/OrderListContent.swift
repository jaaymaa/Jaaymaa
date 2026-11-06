import SwiftUI

struct OrderListContent: View {
    let page: AdminPage<AdminOrder>

    var body: some View {
        SectionCard(title: "Commandes récentes", subtitle: "\(page.total) commandes") {
            if page.items.isEmpty {
                Text("Aucune commande à afficher.")
                    .foregroundStyle(JaaymaStyle.muted)
            }

            ForEach(page.items) { order in
                HStack(spacing: 11) {
                    Image(systemName: "bag")
                        .foregroundStyle(JaaymaStyle.ink)
                        .padding(10)
                        .background(JaaymaStyle.sun.opacity(0.35), in: RoundedRectangle(cornerRadius: 11))

                    VStack(alignment: .leading, spacing: 3) {
                        Text(order.reference)
                            .font(.caption.weight(.heavy))
                        Text("\(order.customerName) · \(order.shop.name)")
                            .font(.caption)
                            .foregroundStyle(JaaymaStyle.muted)
                        Text("\(statusLabel(order.status)) · \(order.paymentStatus)")
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(JaaymaStyle.green)
                    }

                    Spacer()
                    Text(formatFcfa(order.total))
                        .font(.caption.weight(.heavy))
                }
                .padding(.vertical, 4)
            }
        }
    }
}

