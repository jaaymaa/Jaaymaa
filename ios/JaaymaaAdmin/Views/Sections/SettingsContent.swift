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
    @State private var saveSuccessCount = 0

    init(value: AdminSettings, onChange: @escaping ([String: Any]) async throws -> Void) {
        self.value = value
        self.onChange = onChange
        _explorerEnabled = State(initialValue: value.explorerEnabled)
        _maintenanceEnabled = State(initialValue: value.maintenanceEnabled)
        _proPriceText = State(initialValue: String(value.proPriceXof))
        _proPlusPriceText = State(initialValue: String(value.proPlusPriceXof))
    }

    var body: some View {
        SectionCard(
            title: "État de la plateforme",
            subtitle: "Les modifications sont appliquées au site",
            symbol: "slider.horizontal.3",
            accent: JaaymaStyle.green
        ) {
            Toggle("Explorer visible", isOn: $explorerEnabled)
                .tint(JaaymaStyle.green)
                .disabled(saving)
                .onChange(of: explorerEnabled) { _, enabled in
                    save(["explorerEnabled": enabled])
                }

            Toggle("Mode maintenance", isOn: $maintenanceEnabled)
                .tint(JaaymaStyle.hibiscus)
                .disabled(saving)
                .onChange(of: maintenanceEnabled) { _, enabled in
                    save(["maintenanceEnabled": enabled])
                }

            Divider()

            HStack(spacing: 8) {
                JaaymaStatusBadge(
                    title: value.databaseConnected ? "Base connectée" : "Base indisponible",
                    tint: value.databaseConnected ? JaaymaStyle.green : JaaymaStyle.hibiscus,
                    symbol: value.databaseConnected ? "checkmark.circle.fill" : "exclamationmark.circle.fill"
                )
                JaaymaStatusBadge(title: "\(value.adminCount) admins", tint: JaaymaStyle.ink, symbol: "person.badge.key.fill")
            }

            JaaymaStatusBadge(title: "Push · \(value.pushSubscriptions) appareils", tint: JaaymaStyle.ink, symbol: "bell.badge.fill")

            if let message {
                JaaymaStatusBadge(
                    title: message,
                    tint: message == "Réglage enregistré." ? JaaymaStyle.green : JaaymaStyle.hibiscus,
                    symbol: message == "Réglage enregistré." ? "checkmark.circle.fill" : "exclamationmark.circle.fill"
                )
            }
        }
        .sensoryFeedback(.success, trigger: saveSuccessCount)

        SectionCard(
            title: "Tarifs d’abonnement",
            subtitle: "Montants en FCFA",
            symbol: "creditcard.fill",
            accent: JaaymaStyle.sun
        ) {
            TextField("Tarif Pro", text: $proPriceText)
                .keyboardType(.numberPad)
                .padding(13)
                .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 15, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 15, style: .continuous).stroke(JaaymaStyle.ink.opacity(0.15), lineWidth: 1))
                .tint(JaaymaStyle.hibiscus)
            TextField("Tarif Pro+", text: $proPlusPriceText)
                .keyboardType(.numberPad)
                .padding(13)
                .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 15, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 15, style: .continuous).stroke(JaaymaStyle.ink.opacity(0.15), lineWidth: 1))
                .tint(JaaymaStyle.hibiscus)

            Button {
                guard let pro = Int(proPriceText), let proPlus = Int(proPlusPriceText) else {
                    message = "Saisis des montants entiers en FCFA."
                    return
                }
                save(["proPriceXof": pro, "proPlusPriceXof": proPlus])
            } label: {
                HStack(spacing: 9) {
                    if saving { JaaymaLoader(variant: .miniInk, size: 26) }
                    Text(saving ? "Enregistrement…" : "Enregistrer les tarifs")
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(JaaymaPrimaryButtonStyle())
            .disabled(saving)

            HStack {
                Text("Pro")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(JaaymaStyle.muted)
                Spacer()
                Text(formatFcfa(value.proPriceXof))
                    .font(.subheadline.weight(.bold).monospacedDigit())
                    .foregroundStyle(JaaymaStyle.ink)
            }
            HStack {
                Text("Pro+")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(JaaymaStyle.muted)
                Spacer()
                Text(formatFcfa(value.proPlusPriceXof))
                    .font(.subheadline.weight(.bold).monospacedDigit())
                    .foregroundStyle(JaaymaStyle.ink)
            }
        }
    }

    private func save(_ values: [String: Any]) {
        saving = true
        message = nil
        Task {
            defer { saving = false }
            do {
                try await onChange(values)
                message = "Réglage enregistré."
                saveSuccessCount += 1
            } catch {
                message = error.localizedDescription
            }
        }
    }
}

