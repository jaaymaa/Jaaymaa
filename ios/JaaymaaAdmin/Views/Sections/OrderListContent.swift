import SwiftUI

struct OrderListContent: View {
    let page: AdminPage<AdminOrder>

    var body: some View {
        SectionCard(
            title: "Commandes récentes",
            subtitle: "\(page.total) commandes au total",
            symbol: "bag.fill",
            accent: JaaymaStyle.sun
        ) {
            if page.items.isEmpty {
                ContentUnavailableView(
                    "Aucune commande",
                    systemImage: "bag",
                    description: Text("Les nouvelles commandes apparaîtront ici.")
                )
                .padding(.vertical, 8)
            }

            ForEach(page.items) { order in
                VStack(spacing: 11) {
                    JaaymaRowDivider(leadingInset: 0)

                    HStack(alignment: .top, spacing: 11) {
                        Image(systemName: "bag.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(JaaymaStyle.ink)
                            .frame(width: 40, height: 40)
                            .background(JaaymaStyle.sun.opacity(0.48), in: RoundedRectangle(cornerRadius: 14, style: .continuous))

                        VStack(alignment: .leading, spacing: 5) {
                            Text(order.reference)
                                .font(.system(size: 13, weight: .bold, design: .monospaced))
                                .foregroundStyle(JaaymaStyle.ink)
                                .lineLimit(1)

                            Text(order.customerName)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(JaaymaStyle.ink)
                                .lineLimit(1)

                            Text(order.shop.name)
                                .font(.caption)
                                .foregroundStyle(JaaymaStyle.muted)
                                .lineLimit(1)

                            HStack(spacing: 6) {
                                JaaymaStatusBadge(title: statusLabel(order.status), tint: statusColor(order.status))
                                JaaymaStatusBadge(title: paymentLabel(order.paymentStatus), tint: paymentColor(order.paymentStatus))
                            }
                            .padding(.top, 2)
                        }

                        Spacer(minLength: 2)

                        VStack(alignment: .trailing, spacing: 5) {
                            Text(formatFcfa(order.total))
                                .font(.system(size: 12, weight: .bold, design: .rounded).monospacedDigit())
                                .foregroundStyle(JaaymaStyle.ink)
                                .multilineTextAlignment(.trailing)
                                .lineLimit(2)

                            Text("\(order.counts.items) article\(order.counts.items == 1 ? "" : "s")")
                                .font(.system(size: 10, weight: .medium, design: .rounded))
                                .foregroundStyle(JaaymaStyle.muted)
                        }
                    }
                    .padding(.vertical, 1)
                }
                .padding(.top, 3)
            }
        }
    }

    private func statusColor(_ status: String) -> Color {
        switch status {
        case "DELIVERED": return JaaymaStyle.green
        case "CANCELLED": return JaaymaStyle.hibiscus
        case "NEW", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY": return JaaymaStyle.ink
        default: return JaaymaStyle.muted
        }
    }

    private func paymentLabel(_ status: String) -> String {
        switch status.uppercased() {
        case "PAID", "COMPLETED": return "Payée"
        case "PENDING": return "À payer"
        case "FAILED": return "Échec paiement"
        default: return status
        }
    }

    private func paymentColor(_ status: String) -> Color {
        switch status.uppercased() {
        case "PAID", "COMPLETED": return JaaymaStyle.green
        case "FAILED": return JaaymaStyle.hibiscus
        default: return JaaymaStyle.muted
        }
    }
}
