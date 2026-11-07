import SwiftUI

struct NotificationContent: View {
    let value: AdminNotifications
    let onSend: ([String: Any]) async throws -> Void
    @State private var title = ""
    @State private var bodyText = ""
    @State private var sending = false
    @State private var resultMessage: String?
    @State private var sendSuccessCount = 0

    var body: some View {
        SectionCard(
            title: "Nouvelle annonce",
            subtitle: "Envoi aux vendeurs ayant activé les notifications",
            symbol: "paperplane.fill",
            accent: JaaymaStyle.sun
        ) {
            TextField("Titre", text: $title)
                .padding(13)
                .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 15, style: .continuous))
                .tint(JaaymaStyle.hibiscus)
            TextField("Message", text: $bodyText, axis: .vertical)
                .lineLimit(3...5)
                .padding(13)
                .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 15, style: .continuous))
                .tint(JaaymaStyle.hibiscus)

            Button {
                send()
            } label: {
                HStack(spacing: 9) {
                    if sending { JaaymaLoader(variant: .miniInk, size: 26) }
                    Label(sending ? "Envoi…" : "Envoyer la notification", systemImage: "paperplane.fill")
                }
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(JaaymaPrimaryButtonStyle())
            .disabled(sending || title.count < 3 || bodyText.count < 3 || !value.pushConfigured)
            .sensoryFeedback(.success, trigger: sendSuccessCount)

            if let resultMessage {
                JaaymaStatusBadge(
                    title: resultMessage,
                    tint: resultMessage == "Notification envoyée." ? JaaymaStyle.green : JaaymaStyle.hibiscus,
                    symbol: resultMessage == "Notification envoyée." ? "checkmark.circle.fill" : "exclamationmark.circle.fill"
                )
            }
        }

        SectionCard(
            title: "Notifications vendeurs",
            subtitle: "Historique et état du service push",
            symbol: "bell.badge.fill",
            accent: JaaymaStyle.mist
        ) {
            HStack(spacing: 8) {
                JaaymaStatusBadge(title: "\(value.subscriberCount) appareils", tint: JaaymaStyle.ink, symbol: "iphone.gen3")
                JaaymaStatusBadge(
                    title: value.pushConfigured ? "Service prêt" : "Configuration incomplète",
                    tint: value.pushConfigured ? JaaymaStyle.green : JaaymaStyle.hibiscus,
                    symbol: value.pushConfigured ? "checkmark.circle.fill" : "exclamationmark.circle.fill"
                )
            }

            if value.history.items.isEmpty {
                Text("Aucune annonce envoyée pour le moment.")
                    .font(.subheadline)
                    .foregroundStyle(JaaymaStyle.muted)
            }

            ForEach(value.history.items) { item in
                VStack(alignment: .leading, spacing: 10) {
                    JaaymaRowDivider(leadingInset: 0)

                    HStack(alignment: .top, spacing: 11) {
                        Image(systemName: "megaphone.fill")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(JaaymaStyle.ink)
                            .frame(width: 36, height: 36)
                            .background(JaaymaStyle.sun.opacity(0.42), in: RoundedRectangle(cornerRadius: 13, style: .continuous))

                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.title)
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(JaaymaStyle.ink)
                            Text(item.body)
                                .font(.caption)
                                .foregroundStyle(JaaymaStyle.muted)
                                .lineLimit(3)
                            HStack(spacing: 6) {
                                JaaymaStatusBadge(title: "\(item.deliveredCount) envoyées", tint: JaaymaStyle.green, symbol: "checkmark")
                                if item.failedCount > 0 {
                                    JaaymaStatusBadge(title: "\(item.failedCount) échecs", tint: JaaymaStyle.hibiscus, symbol: "xmark")
                                }
                            }
                        }
                    }
                }
                .padding(.top, 3)
            }
        }
    }

    private func send() {
        sending = true
        resultMessage = nil
        Task {
            do {
                try await onSend(["title": title, "body": bodyText, "url": "/espace/commandes"])
                title = ""
                bodyText = ""
                resultMessage = "Notification envoyée."
                sendSuccessCount += 1
            } catch {
                resultMessage = error.localizedDescription
            }
            sending = false
        }
    }
}

