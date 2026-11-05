import SwiftUI

struct SettingsContent: View {
    let value: AdminSettings
    let onChange: ([String: Any]) async throws -> Void
    @State private var explorerEnabled: Bool
    @State private var maintenanceEnabled: Bool
    @State private var proPriceText: String
    @State private var proPlusPriceText: String
    @State private var message: String?

    init(value: AdminSettings, onChange: @escaping ([String: Any]) async throws -> Void) {
        self.value = value
        self.onChange = onChange
        _explorerEnabled = State(initialValue: value.explorerEnabled)
        _maintenanceEnabled = State(initialValue: value.maintenanceEnabled)
        _proPriceText = State(initialValue: String(value.proPriceXof))
        _proPlusPriceText = State(initialValue: String(value.proPlusPriceXof))
    }

    var body: some View {
        SectionCard(title: "État de la plateforme", subtitle: "Les modifications sont appliquées au site") {
            Toggle("Explorer visible", isOn: $explorerEnabled)
                .tint(JaaymaStyle.green)
                .onChange(of: explorerEnabled) { _, enabled in
                    save(["explorerEnabled": enabled])
                }

            Toggle("Mode maintenance", isOn: $maintenanceEnabled)
                .tint(JaaymaStyle.hibiscus)
                .onChange(of: maintenanceEnabled) { _, enabled in
                    save(["maintenanceEnabled": enabled])
                }

            Divider()

            Label("Base de données : \(value.databaseConnected ? "connectée" : "indisponible")", systemImage: "externaldrive.fill")
                .font(.subheadline)
            Label("\(value.adminCount) administrateur(s) autorisé(s)", systemImage: "person.badge.key.fill")
                .font(.subheadline)
            Label("Push : \(value.pushSubscriptions) appareil(s)", systemImage: "bell.badge.fill")
                .font(.subheadline)

            if let message {
                Text(message)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(JaaymaStyle.hibiscus)
            }
        }

        SectionCard(title: "Tarifs d’abonnement", subtitle: "Montants en FCFA") {
            TextField("Tarif Pro", text: $proPriceText)
                .keyboardType(.numberPad)
                .textFieldStyle(.roundedBorder)
            TextField("Tarif Pro+", text: $proPlusPriceText)
                .keyboardType(.numberPad)
                .textFieldStyle(.roundedBorder)

            Button("Enregistrer les tarifs") {
                guard let pro = Int(proPriceText), let proPlus = Int(proPlusPriceText) else {
                    message = "Saisis des montants entiers en FCFA."
                    return
                }
                save(["proPriceXof": pro, "proPlusPriceXof": proPlus])
            }
            .buttonStyle(.borderedProminent)
            .tint(JaaymaStyle.ink)

            Label("Pro · \(formatFcfa(value.proPriceXof))", systemImage: "creditcard")
            Label("Pro+ · \(formatFcfa(value.proPlusPriceXof))", systemImage: "sparkles")
        }
    }

    private func save(_ values: [String: Any]) {
        Task {
            do {
                try await onChange(values)
                message = "Réglage enregistré."
            } catch {
                message = error.localizedDescription
            }
        }
    }
}

