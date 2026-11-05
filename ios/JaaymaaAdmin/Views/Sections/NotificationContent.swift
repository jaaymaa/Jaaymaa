import SwiftUI

struct NotificationContent: View {
    let value: AdminNotifications
    let onSend: ([String: Any]) async throws -> Void
    @State private var title = ""
    @State private var bodyText = ""
    @State private var sending = false
    @State private var resultMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            // Push Service Status Bar
            HStack(spacing: 12) {
                HStack(spacing: 6) {
                    Image(systemName: "iphone.gen3")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(JaaymaStyle.ink)
                    Text("\(value.subscriberCount) appareils inscrits")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(JaaymaStyle.ink)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(JaaymaStyle.chip, in: Capsule())

                Spacer()

                HStack(spacing: 5) {
                    Circle()
                        .fill(value.pushConfigured ? JaaymaStyle.baobab : JaaymaStyle.hibiscus)
                        .frame(width: 7, height: 7)
                    Text(value.pushConfigured ? "FCM Opérationnel" : "FCM Incomplet")
                        .font(.system(size: 11, weight: .black))
                        .foregroundStyle(value.pushConfigured ? JaaymaStyle.baobab : JaaymaStyle.hibiscus)
                }
                .padding(.horizontal, 9)
                .padding(.vertical, 5)
                .background(
                    (value.pushConfigured ? JaaymaStyle.mint : JaaymaStyle.pinkTone).opacity(0.5),
                    in: Capsule()
                )
            }

            // Compose Card
            SectionCard(title: "Diffuser une annonce", subtitle: "Notification push instantanée aux vendeurs") {
                VStack(alignment: .leading, spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("TITRE DU MESSAGE")
                            .font(.system(size: 10, weight: .black))
                            .tracking(1.0)
                            .foregroundStyle(JaaymaStyle.muted)

                        TextField("Ex: Nouvelle mise à jour Jaaymaa disponible", text: $title)
                            .font(.system(size: 14, weight: .medium))
                            .padding(12)
                            .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 12))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.ink, lineWidth: 1.2))
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("CORPS DE L'ANNONCE")
                            .font(.system(size: 10, weight: .black))
                            .tracking(1.0)
                            .foregroundStyle(JaaymaStyle.muted)

                        TextField("Détails de l'annonce aux commerçants…", text: $bodyText, axis: .vertical)
                            .lineLimit(3...5)
                            .font(.system(size: 14, weight: .medium))
                            .padding(12)
                            .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 12))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.ink, lineWidth: 1.2))
                    }

                    Button(action: send) {
                        HStack(spacing: 8) {
                            if sending {
                                JaaymaMiniLoader(encre: true, dotSize: 8, spacing: 6)
                                Text("Envoi en cours…")
                                    .font(.system(size: 14, weight: .black, design: .rounded))
                            } else {
                                Image(systemName: "paperplane.fill")
                                    .font(.system(size: 13, weight: .bold))
                                Text("Diffuser à tous les vendeurs")
                                    .font(.system(size: 14, weight: .black, design: .rounded))
                            }
                        }
                        .foregroundStyle(JaaymaStyle.ink)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(JaaymaStyle.sun, in: RoundedRectangle(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(JaaymaStyle.ink, lineWidth: 2))
                        .shadow(color: JaaymaStyle.ink, radius: 0, x: 2.5, y: 2.5)
                    }
                    .disabled(sending || title.count < 3 || bodyText.count < 3 || !value.pushConfigured)
                    .opacity((sending || title.count < 3 || bodyText.count < 3 || !value.pushConfigured) ? 0.6 : 1.0)

                    if let resultMessage {
                        HStack(spacing: 6) {
                            Image(systemName: "info.circle.fill")
                            Text(resultMessage)
                        }
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(JaaymaStyle.ink)
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(JaaymaStyle.chip, in: RoundedRectangle(cornerRadius: 10))
                    }
                }
            }

            // Notification History Card
            SectionCard(title: "Historique des diffusions", subtitle: "\(value.history.total) annonce\(value.history.total > 1 ? "s" : "") envoyée\(value.history.total > 1 ? "s" : "")") {
                if value.history.items.isEmpty {
                    Text("Aucune notification diffusée pour le moment.")
                        .font(.system(size: 13))
                        .foregroundStyle(JaaymaStyle.muted)
                        .padding(.vertical, 6)
                } else {
                    VStack(spacing: 12) {
                        ForEach(value.history.items) { item in
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text(item.title)
                                        .font(.system(size: 14, weight: .black, design: .rounded))
                                        .foregroundStyle(JaaymaStyle.ink)

                                    Spacer()

                                    Text("\(item.deliveredCount) délivrées")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(JaaymaStyle.baobab)
                                        .padding(.horizontal, 7)
                                        .padding(.vertical, 3)
                                        .background(JaaymaStyle.mint, in: Capsule())
                                }

                                Text(item.body)
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundStyle(JaaymaStyle.muted)

                                if item.failedCount > 0 {
                                    Text("\(item.failedCount) échec(s)")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(JaaymaStyle.hibiscus)
                                }
                            }
                            .padding(10)
                            .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 12))

                            if item.id != value.history.items.last?.id {
                                Divider().background(JaaymaStyle.line)
                            }
                        }
                    }
                }
            }
        }
    }

    private func send() {
        JaaymaHaptics.medium()
        sending = true
        resultMessage = nil
        Task {
            do {
                try await onSend(["title": title, "body": bodyText, "url": "/espace/commandes"])
                title = ""
                bodyText = ""
                resultMessage = "Notification diffusée avec succès !"
            } catch {
                resultMessage = error.localizedDescription
            }
            sending = false
        }
    }
}
