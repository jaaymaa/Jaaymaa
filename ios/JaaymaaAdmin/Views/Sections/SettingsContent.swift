import SwiftUI

struct SettingsContent: View {
    let value: AdminSettings
    let onChange: ([String: Any]) async throws -> Void
    @State private var explorerEnabled: Bool
    @State private var maintenanceEnabled: Bool
    @State private var proPriceText: String
    @State private var proPlusPriceText: String
    @State private var message: String?
    @State private var saving = false

    init(value: AdminSettings, onChange: @escaping ([String: Any]) async throws -> Void) {
        self.value = value
        self.onChange = onChange
        _explorerEnabled = State(initialValue: value.explorerEnabled)
        _maintenanceEnabled = State(initialValue: value.maintenanceEnabled)
        _proPriceText = State(initialValue: String(value.proPriceXof))
        _proPlusPriceText = State(initialValue: String(value.proPlusPriceXof))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            // Infrastructure Health Card
            SectionCard(title: "Infrastructure Jaaymaa", subtitle: "État des services en direct") {
                VStack(spacing: 10) {
                    healthRow(
                        title: "Base de données Cloudflare D1",
                        status: value.databaseConnected ? "Connectée" : "Erreur",
                        isOk: value.databaseConnected,
                        symbol: "externaldrive.fill"
                    )

                    healthRow(
                        title: "Notifications Push FCM",
                        status: value.pushConfigured ? "Opérationnel" : "Non configuré",
                        isOk: value.pushConfigured,
                        symbol: "bell.badge.fill"
                    )

                    healthRow(
                        title: "Administrateurs autorisés",
                        status: "\(value.adminCount) actif\(value.adminCount > 1 ? "s" : "")",
                        isOk: value.adminCount > 0,
                        symbol: "person.badge.key.fill"
                    )

                    healthRow(
                        title: "Appareils abonnés",
                        status: "\(value.pushSubscriptions) appareil\(value.pushSubscriptions > 1 ? "s" : "")",
                        isOk: true,
                        symbol: "iphone.gen3"
                    )
                }
            }

            // Platform Toggles Card
            SectionCard(title: "Contrôles de la plateforme", subtitle: "Modifications en temps réel sur le site public") {
                VStack(spacing: 12) {
                    Toggle(isOn: $explorerEnabled) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Catalogue Explorer public")
                                .font(.system(size: 14, weight: .bold, design: .rounded))
                                .foregroundStyle(JaaymaStyle.ink)
                            Text("Affiche la page /explorer aux visiteurs")
                                .font(.system(size: 12))
                                .foregroundStyle(JaaymaStyle.muted)
                        }
                    }
                    .tint(JaaymaStyle.baobab)
                    .onChange(of: explorerEnabled) { _, enabled in
                        save(["explorerEnabled": enabled])
                    }

                    Divider().background(JaaymaStyle.line)

                    Toggle(isOn: $maintenanceEnabled) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Mode maintenance")
                                .font(.system(size: 14, weight: .bold, design: .rounded))
                                .foregroundStyle(JaaymaStyle.ink)
                            Text("Bloque l'accès aux clients et affiche la page travaux")
                                .font(.system(size: 12))
                                .foregroundStyle(JaaymaStyle.muted)
                        }
                    }
                    .tint(JaaymaStyle.hibiscus)
                    .onChange(of: maintenanceEnabled) { _, enabled in
                        save(["maintenanceEnabled": enabled])
                    }
                }
            }

            // Subscription Pricing Card
            SectionCard(title: "Tarifs d’abonnement", subtitle: "Prix affichés aux commerçants en FCFA") {
                VStack(alignment: .leading, spacing: 14) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("TARIF FORMULE PRO / MOIS")
                            .font(.system(size: 10, weight: .black))
                            .tracking(1.0)
                            .foregroundStyle(JaaymaStyle.muted)

                        HStack {
                            TextField("Ex: 5000", text: $proPriceText)
                                .font(.system(size: 16, weight: .bold, design: .monospaced))
                                .keyboardType(.numberPad)

                            Text("FCFA")
                                .font(.system(size: 12, weight: .black))
                                .foregroundStyle(JaaymaStyle.muted)
                        }
                        .padding(12)
                        .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 12))
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.ink, lineWidth: 1.2))
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("TARIF FORMULE PRO+ / MOIS")
                            .font(.system(size: 10, weight: .black))
                            .tracking(1.0)
                            .foregroundStyle(JaaymaStyle.muted)

                        HStack {
                            TextField("Ex: 10000", text: $proPlusPriceText)
                                .font(.system(size: 16, weight: .bold, design: .monospaced))
                                .keyboardType(.numberPad)

                            Text("FCFA")
                                .font(.system(size: 12, weight: .black))
                                .foregroundStyle(JaaymaStyle.muted)
                        }
                        .padding(12)
                        .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 12))
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.ink, lineWidth: 1.2))
                    }

                    Button {
                        guard let pro = Int(proPriceText), let proPlus = Int(proPlusPriceText) else {
                            message = "Saisis des montants entiers en FCFA."
                            return
                        }
                        save(["proPriceXof": pro, "proPlusPriceXof": proPlus])
                    } label: {
                        HStack(spacing: 8) {
                            if saving {
                                JaaymaMiniLoader(encre: true, dotSize: 8, spacing: 6)
                                Text("Enregistrement…")
                                    .font(.system(size: 14, weight: .black, design: .rounded))
                            } else {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 12, weight: .black))
                                Text("Mettre à jour les tarifs")
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
                    .disabled(saving)

                    if let message {
                        Text(message)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(message.contains("enregistré") ? JaaymaStyle.baobab : JaaymaStyle.hibiscus)
                            .padding(8)
                    }
                }
            }
        }
    }

    private func healthRow(title: String, status: String, isOk: Bool, symbol: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: symbol)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(JaaymaStyle.ink)
                .frame(width: 28, height: 28)
                .background(JaaymaStyle.chip, in: RoundedRectangle(cornerRadius: 8))

            Text(title)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(JaaymaStyle.ink)

            Spacer()

            HStack(spacing: 4) {
                Circle().fill(isOk ? JaaymaStyle.baobab : JaaymaStyle.hibiscus).frame(width: 6, height: 6)
                Text(status)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(isOk ? JaaymaStyle.baobab : JaaymaStyle.hibiscus)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background((isOk ? JaaymaStyle.mint : JaaymaStyle.pinkTone).opacity(0.4), in: Capsule())
        }
        .padding(10)
        .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 12))
    }

    private func save(_ values: [String: Any]) {
        JaaymaHaptics.medium()
        saving = true
        Task {
            do {
                try await onChange(values)
                message = "Réglage enregistré."
            } catch {
                message = error.localizedDescription
            }
            saving = false
        }
    }
}
