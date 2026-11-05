import SwiftUI

struct SettingsContent: View {
    let value: AdminSettings
    let onChange: ([String: Any]) async throws -> Void
    @State private var explorerEnabled: Bool
    @State private var maintenanceEnabled: Bool
    @State private var proPriceText: String
    @State private var proPlusPriceText: String
    @State private var message: String?
    @State private var isSuccess = false
    @State private var isSaving = false

    init(value: AdminSettings, onChange: @escaping ([String: Any]) async throws -> Void) {
        self.value = value
        self.onChange = onChange
        _explorerEnabled = State(initialValue: value.explorerEnabled)
        _maintenanceEnabled = State(initialValue: value.maintenanceEnabled)
        _proPriceText = State(initialValue: String(value.proPriceXof))
        _proPlusPriceText = State(initialValue: String(value.proPlusPriceXof))
    }

    var body: some View {
        VStack(spacing: 18) {
            // Platform Controls Section
            SectionCard(
                title: "Contrôles de la plateforme",
                subtitle: "Modifications appliquées instantanément"
            ) {
                VStack(spacing: 12) {
                    Toggle(isOn: $explorerEnabled) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Annuaire Explorer public")
                                .font(.system(size: 14, weight: .bold))
                            Text("Rendre la page /explorer accessible aux visiteurs")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(JaaymaStyle.muted)
                        }
                    }
                    .tint(JaaymaStyle.baobab)
                    .onChange(of: explorerEnabled) { _, enabled in
                        save(["explorerEnabled": enabled])
                    }

                    Divider()

                    Toggle(isOn: $maintenanceEnabled) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Mode maintenance")
                                .font(.system(size: 14, weight: .bold))
                            Text("Bloquer l'accès public pour maintenance")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(JaaymaStyle.muted)
                        }
                    }
                    .tint(JaaymaStyle.hibiscus)
                    .onChange(of: maintenanceEnabled) { _, enabled in
                        save(["maintenanceEnabled": enabled])
                    }
                }
            }

            // Subscription Pricing Section
            SectionCard(
                title: "Tarifs d’abonnement",
                subtitle: "Montants mensuels en Francs CFA (XOF)"
            ) {
                VStack(alignment: .leading, spacing: 14) {
                    HStack(spacing: 12) {
                        VStack(alignment: .leading, spacing: 5) {
                            Text("TARIF PRO")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1.2)
                                .foregroundStyle(JaaymaStyle.muted)

                            TextField("5000", text: $proPriceText)
                                .font(.system(size: 16, weight: .bold, design: .monospaced))
                                .keyboardType(.numberPad)
                                .padding(12)
                                .background(Color.white, in: RoundedRectangle(cornerRadius: 12))
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.ink, lineWidth: 1.8))
                        }

                        VStack(alignment: .leading, spacing: 5) {
                            Text("TARIF PRO+")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1.2)
                                .foregroundStyle(JaaymaStyle.muted)

                            TextField("10000", text: $proPlusPriceText)
                                .font(.system(size: 16, weight: .bold, design: .monospaced))
                                .keyboardType(.numberPad)
                                .padding(12)
                                .background(Color.white, in: RoundedRectangle(cornerRadius: 12))
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.ink, lineWidth: 1.8))
                        }
                    }

                    if let message {
                        HStack(spacing: 8) {
                            Image(systemName: isSuccess ? "checkmark.circle.fill" : "exclamationmark.octagon.fill")
                            Text(message)
                        }
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(isSuccess ? JaaymaStyle.baobab : JaaymaStyle.darkHibiscus)
                    }

                    Button {
                        guard let pro = Int(proPriceText), let proPlus = Int(proPlusPriceText) else {
                            message = "Veuillez entrer des montants valides."
                            isSuccess = false
                            return
                        }
                        save(["proPriceXof": pro, "proPlusPriceXof": proPlus])
                    } label: {
                        HStack(spacing: 8) {
                            if isSaving {
                                JaaymaMiniLoader(encre: true, dotSize: 7, spacing: 5)
                            } else {
                                Image(systemName: "checkmark")
                            }
                            Text("Enregistrer les tarifs")
                        }
                        .font(.system(size: 14, weight: .black, design: .rounded))
                        .foregroundStyle(JaaymaStyle.ink)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                        .background(JaaymaStyle.sun, in: RoundedRectangle(cornerRadius: 12))
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.ink, lineWidth: 2))
                        .shadow(color: JaaymaStyle.ink, radius: 0, x: 2.5, y: 2.5)
                    }
                    .disabled(isSaving)
                }
            }

            // Diagnostic & Infrastructure Cards
            SectionCard(
                title: "État des services Cloudflare",
                subtitle: "Vérification de la production"
            ) {
                VStack(spacing: 10) {
                    serviceRow(
                        title: "Base de données Cloudflare D1",
                        detail: value.databaseConnected ? "Opérationnelle · Réponses nominales" : "Indisponible",
                        icon: "externaldrive.fill",
                        status: value.databaseConnected
                    )

                    serviceRow(
                        title: "Web Push / VAPID",
                        detail: "\(value.pushSubscriptions) appareils enregistrés",
                        icon: "bell.badge.fill",
                        status: true
                    )

                    serviceRow(
                        title: "Comptes administrateurs",
                        detail: "\(value.adminCount) numéro(s) autorisé(s) sur ADMIN_PHONES",
                        icon: "person.badge.key.fill",
                        status: value.adminCount > 0
                    )
                }
            }
        }
    }

    private func serviceRow(title: String, detail: String, icon: String, status: Bool) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(JaaymaStyle.ink)
                .frame(width: 36, height: 36)
                .background(status ? JaaymaStyle.mint : JaaymaStyle.pinkTone, in: RoundedRectangle(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(JaaymaStyle.ink, lineWidth: 1.5))

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 13, weight: .black, design: .rounded))
                    .foregroundStyle(JaaymaStyle.ink)
                Text(detail)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(JaaymaStyle.muted)
            }

            Spacer()

            Image(systemName: status ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                .foregroundStyle(status ? JaaymaStyle.baobab : JaaymaStyle.hibiscus)
        }
        .padding(11)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.ink, lineWidth: 1.4))
    }

    private func save(_ values: [String: Any]) {
        isSaving = true
        message = nil
        Task {
            do {
                try await onChange(values)
                isSuccess = true
                message = "Modifications enregistrées avec succès."
            } catch {
                isSuccess = false
                message = error.localizedDescription
            }
            isSaving = false
        }
    }
}
