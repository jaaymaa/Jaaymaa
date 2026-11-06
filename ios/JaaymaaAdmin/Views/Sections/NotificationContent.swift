import SwiftUI

struct NotificationContent: View {
    let value: AdminNotifications
    let onSend: ([String: Any]) async throws -> Void
    @State private var title = ""
    @State private var bodyText = ""
    @State private var sending = false
    @State private var resultMessage: String?

    var body: some View {
        SectionCard(title: "Nouvelle annonce", subtitle: "Envoi aux vendeurs ayant activé les notifications") {
            TextField("Titre", text: $title)
                .textFieldStyle(.roundedBorder)
            TextField("Message", text: $bodyText, axis: .vertical)
                .lineLimit(3...5)
                .textFieldStyle(.roundedBorder)

            Button {
                send()
            } label: {
                Label(sending ? "Envoi…" : "Envoyer la notification", systemImage: "paperplane.fill")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(JaaymaPrimaryButtonStyle())
            .disabled(sending || title.count < 3 || bodyText.count < 3 || !value.pushConfigured)

            if let resultMessage {
                Text(resultMessage)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(JaaymaStyle.muted)
            }
        }

        SectionCard(title: "Notifications vendeurs", subtitle: "Historique et état du service push") {
            Label("\(value.subscriberCount) appareils abonnés", systemImage: "iphone.gen3")
            Label(
                value.pushConfigured ? "Notifications prêtes" : "Configuration push incomplète",
                systemImage: value.pushConfigured ? "checkmark.circle.fill" : "exclamationmark.circle.fill"
            )
            .foregroundStyle(value.pushConfigured ? JaaymaStyle.green : JaaymaStyle.hibiscus)

            ForEach(value.history.items) { item in
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title)
                        .font(.subheadline.weight(.bold))
                    Text(item.body)
                        .font(.caption)
                        .foregroundStyle(JaaymaStyle.muted)
                    Text("\(item.deliveredCount) envoyées · \(item.failedCount) échecs")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(JaaymaStyle.green)
                }
                .padding(.vertical, 5)
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
            } catch {
                resultMessage = error.localizedDescription
            }
            sending = false
        }
    }
}

