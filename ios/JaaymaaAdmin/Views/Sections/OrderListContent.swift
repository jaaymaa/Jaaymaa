import SwiftUI

struct OrderListContent: View {
    let page: AdminPage<AdminOrder>

    var body: some View {
        SectionCard(title: "Commandes récentes", subtitle: "\(page.total) commande\(page.total > 1 ? "s" : "") au total") {
            if page.items.isEmpty {
                HStack(spacing: 12) {
                    Image(systemName: "bag")
                        .font(.system(size: 20))
                        .foregroundStyle(JaaymaStyle.muted)
                    Text("Aucune commande trouvée.")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(JaaymaStyle.muted)
                }
                .padding(.vertical, 12)
            } else {
                VStack(spacing: 12) {
                    ForEach(page.items) { order in
                        orderRow(order)

                        if order.id != page.items.last?.id {
                            Divider().background(JaaymaStyle.line)
                        }
                    }
                }
            }
        }
    }

    private func orderRow(_ order: AdminOrder) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "bag.fill")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(JaaymaStyle.ink)
                .frame(width: 38, height: 38)
                .background(JaaymaStyle.sun, in: RoundedRectangle(cornerRadius: 11))
                .overlay(RoundedRectangle(cornerRadius: 11).stroke(JaaymaStyle.ink, lineWidth: 1.2))

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(order.customerName)
                        .font(.system(size: 14, weight: .black, design: .rounded))
                        .foregroundStyle(JaaymaStyle.ink)

                    if !order.reference.isEmpty {
                        Text(order.reference)
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .foregroundStyle(JaaymaStyle.muted)
                    }
                }

                HStack(spacing: 5) {
                    Text(order.shop.name)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(JaaymaStyle.hibiscus)

                    if !order.customerPhone.isEmpty {
                        Text("·")
                            .foregroundStyle(JaaymaStyle.muted)
                        Text(order.customerPhone)
                            .font(.system(size: 11, weight: .medium, design: .monospaced))
                            .foregroundStyle(JaaymaStyle.muted)
                    }
                }

                HStack(spacing: 6) {
                    paymentPill(order.paymentStatus)

                    if !order.paymentMethod.isEmpty {
                        Text("·")
                            .foregroundStyle(JaaymaStyle.muted)
                        Text(order.paymentMethod.uppercased())
                            .font(.system(size: 9, weight: .black))
                            .foregroundStyle(JaaymaStyle.muted)
                    }

                    Text("·")
                        .foregroundStyle(JaaymaStyle.muted)

                    Text("\(order.counts.items) art.")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(JaaymaStyle.muted)
                }
                .padding(.top, 2)
            }

            Spacer(minLength: 4)

            Text(formatFcfa(order.total))
                .font(.system(size: 13, weight: .black, design: .rounded))
                .foregroundStyle(JaaymaStyle.ink)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(JaaymaStyle.chip, in: Capsule())
                .overlay(Capsule().stroke(JaaymaStyle.ink.opacity(0.2), lineWidth: 1))
        }
        .padding(10)
        .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 14))
    }

    private func paymentPill(_ status: String) -> some View {
        let isPaid = status.lowercased().contains("paid") || status.lowercased().contains("pay")
        let color = isPaid ? JaaymaStyle.baobab : JaaymaStyle.sunAlt

        return HStack(spacing: 4) {
            Circle().fill(color).frame(width: 5, height: 5)
            Text(isPaid ? "Payée" : status)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(color)
        }
    }
}
