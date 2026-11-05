import SwiftUI

struct OrderListContent: View {
    let page: AdminPage<AdminOrder>

    var body: some View {
        SectionCard(title: "Commandes récentes", subtitle: "\(page.total) commandes sur la plateforme") {
            if page.items.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "bag")
                        .font(.system(size: 32))
                        .foregroundStyle(JaaymaStyle.muted)
                    Text("Aucune commande trouvée.")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(JaaymaStyle.muted)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
            } else {
                VStack(spacing: 12) {
                    ForEach(page.items) { order in
                        orderCard(order)
                    }
                }
            }
        }
    }

    private func orderCard(_ order: AdminOrder) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "bag.fill")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(JaaymaStyle.ink)
                    .frame(width: 40, height: 40)
                    .background(JaaymaStyle.mint, in: RoundedRectangle(cornerRadius: 11))
                    .overlay(RoundedRectangle(cornerRadius: 11).stroke(JaaymaStyle.ink, lineWidth: 1.5))

                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 6) {
                        Text(order.reference)
                            .font(.system(size: 12, weight: .black, design: .monospaced))
                            .foregroundStyle(JaaymaStyle.goldText)

                        Text("·")
                            .foregroundStyle(JaaymaStyle.muted)

                        Text(order.shop.name)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(JaaymaStyle.ink)
                    }

                    Text(order.customerName)
                        .font(.system(size: 14, weight: .black, design: .rounded))
                        .foregroundStyle(JaaymaStyle.ink)

                    if let url = URL(string: "tel:\(order.customerPhone)") {
                        Link(destination: url) {
                            Text(order.customerPhone)
                                .font(.system(size: 11, weight: .medium, design: .monospaced))
                                .foregroundStyle(JaaymaStyle.muted)
                        }
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 3) {
                    Text(formatFcfa(order.total))
                        .font(.system(size: 15, weight: .black, design: .rounded))
                        .foregroundStyle(JaaymaStyle.ink)

                    Text(order.paymentStatus.uppercased() == "PAID" ? "Payée" : "En attente")
                        .font(.system(size: 10, weight: .black))
                        .foregroundStyle(order.paymentStatus.uppercased() == "PAID" ? JaaymaStyle.baobab : JaaymaStyle.goldText)
                }
            }

            // Bottom Badges Row
            HStack {
                Text(statusLabel(order.status))
                    .font(.system(size: 10, weight: .black))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3.5)
                    .background(JaaymaStyle.chip, in: Capsule())
                    .overlay(Capsule().stroke(JaaymaStyle.ink, lineWidth: 1.2))
                    .foregroundStyle(JaaymaStyle.ink)

                Spacer()

                Text("\(order.counts.items) article\(order.counts.items != 1 ? "s" : "")")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(JaaymaStyle.muted)
            }
        }
        .padding(14)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(JaaymaStyle.ink, lineWidth: 1.8))
        .shadow(color: JaaymaStyle.ink, radius: 0, x: 2.5, y: 2.5)
    }
}
