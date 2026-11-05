import SwiftUI

struct NotificationContent: View {
    let value: AdminNotifications
    let onSend: ([String: Any]) async throws -> Void
    @State private var title = ""
    @State private var bodyText = ""
    @State private var sending = false
    @State private var resultMessage: String?
    @State private var isSuccess = false

    var body: some View {
        VStack(spacing: 18) {
            // Push Service Status Banner
            HStack(spacing: 12) {
                Image(systemName: value.pushConfigured ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(value.pushConfigured ? JaaymaStyle.baobab : JaaymaStyle.darkHibiscus)

                VStack(alignment: .leading, spacing: 2) {
                    Text(value.pushConfigured ? "Service Push actif" : "Configuration push incomplète")
                        .font(.system(size: 14, weight: .black, design: .rounded))
                        .foregroundStyle(JaaymaStyle.ink)
                    Text("\(value.subscriberCount) appareil\(value.subscriberCount != 1 ? "s" : "") abonné\(value.subscriberCount != 1 ? "s" : "") aux alertes")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(JaaymaStyle.muted)
                }

                Spacer()
            }
            .padding(14)
            .background(value.pushConfigured ? JaaymaStyle.mint.opacity(0.5) : JaaymaStyle.pinkTone.opacity(0.5), in: RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(JaaymaStyle.ink, lineWidth: 2))
            .shadow(color: JaaymaStyle.ink, radius: 0, x: 3, y: 3)

            // Compose New Broadcast Section
            SectionCard(
                title: "Diffuser une annonce",
                subtitle: "Envoi immédiat à tous les vendeurs abonnés"
            ) {
                VStack(alignment: .leading, spacing: 14) {
                    VStack(alignment: .leading, spacing: 5) {
                        Text("TITRE DE LA NOTIFICATION")
                            .font(.system(size: 10, weight: .black))
                            .tracking(1.2)
                            .foregroundStyle(JaaymaStyle.muted)

                        TextField("Ex: Nouvelle mise à jour disponible", text: $title)
                            .font(.system(size: 14, weight: .bold))
                            .padding(12)
                            .background(Color.white, in: RoundedRectangle(cornerRadius: 12))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.ink, lineWidth: 1.8))
                    }

                    VStack(alignment: .leading, spacing: 5) {
                        Text("MESSAGE")
                            .font(.system(size: 10, weight: .black))
                            .tracking(1.2)
                            .foregroundStyle(JaaymaStyle.muted)

                        TextField("Détails du message pour les vendeurs…", text: $bodyText, axis: .vertical)
                            .font(.system(size: 14, weight: .medium))
                            .lineLimit(3...5)
                            .padding(12)
                            .background(Color.white, in: RoundedRectangle(cornerRadius: 12))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.ink, lineWidth: 1.8))
                    }

                    if let resultMessage {
                        HStack(spacing: 8) {
                            Image(systemName: isSuccess ? "checkmark.circle.fill" : "exclamationmark.octagon.fill")
                            Text(resultMessage)
                        }
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(isSuccess ? JaaymaStyle.baobab : JaaymaStyle.darkHibiscus)
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(isSuccess ? JaaymaStyle.mint.opacity(0.5) : JaaymaStyle.pinkTone.opacity(0.5), in: RoundedRectangle(cornerRadius: 10))
                    }

                    Button(action: send) {
                        HStack(spacing: 8) {
                            if sending {
                                JaaymaMiniLoader(encre: true, dotSize: 8, spacing: 6)
                                Text("Envoi en cours…")
                            } else {
                                Image(systemName: "paperplane.fill")
                                Text("Envoyer l’annonce")
                            }
                        }
                        .font(.system(size: 14, weight: .black, design: .rounded))
                        .foregroundStyle(JaaymaStyle.ink)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(JaaymaStyle.sun, in: RoundedRectangle(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(JaaymaStyle.ink, lineWidth: 2))
                        .shadow(color: JaaymaStyle.ink, radius: 0, x: 2.5, y: 2.5)
                    }
                    .disabled(sending || title.count < 3 || bodyText.count < 3 || !value.pushConfigured)
                    .opacity((sending || title.count < 3 || bodyText.count < 3 || !value.pushConfigured) ? 0.6 : 1.0)
                }
            }

            // History Section
            SectionCard(
                title: "Historique des annonces",
                subtitle: "\(value.history.total) annonce\(value.history.total != 1 ? "s" : "") envoyée\(value.history.total != 1 ? "s" : "")"
            ) {
                if value.history.items.isEmpty {
                    VStack(spacing: 6) {
                        Image(systemName: "bell.slash")
                            .font(.system(size: 28))
                            .foregroundStyle(JaaymaStyle.muted)
                        Text("Pas encore d’annonce envoyée.")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(JaaymaStyle.muted)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 18)
                } else {
                    VStack(spacing: 12) {
                        ForEach(value.history.items) { item in
                            notificationHistoryRow(item)
                        }
                    }
                }
            }
        }
    }

    private func notificationHistoryRow(_ item: AdminBroadcast) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.title)
                        .font(.system(size: 14, weight: .black, design: .rounded))
                        .foregroundStyle(JaaymaStyle.ink)
                    Text(item.body)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(JaaymaStyle.muted)
                        .lineLimit(2)
                }
                Spacer()
            }

            HStack(spacing: 8) {
                deliveryStatPill(count: item.deliveredCount, label: "Envoyées", color: JaaymaStyle.baobab)
                deliveryStatPill(count: item.failedCount, label: "Échecs", color: JaaymaStyle.hibiscus)
                deliveryStatPill(count: item.targetCount, label: "Cibles", color: JaaymaStyle.ink)
            }
        }
        .padding(12)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(JaaymaStyle.ink, lineWidth: 1.5))
        .shadow(color: JaaymaStyle.ink, radius: 0, x: 2, y: 2)
    }

    private func deliveryStatPill(count: Int, label: String, color: Color) -> some View {
        HStack(spacing: 4) {
            Text("\(count)")
                .font(.system(size: 12, weight: .black, design: .rounded))
                .foregroundStyle(color)
            Text(label)
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(JaaymaStyle.muted)
        }
        .padding(.horizontal, 7)
        .padding(.vertical, 4)
        .background(JaaymaStyle.chip, in: RoundedRectangle(cornerRadius: 6))
    }

    private func send() {
        sending = true
        resultMessage = nil
        Task {
            do {
                try await onSend(["title": title, "body": bodyText])
                title = ""
                bodyText = ""
                isSuccess = true
                resultMessage = "Notification transmise avec succès aux serveurs push !"
            } catch {
                isSuccess = false
                resultMessage = error.localizedDescription
            }
            sending = false
        }
    }
}
