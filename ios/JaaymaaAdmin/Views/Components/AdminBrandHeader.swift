import SwiftUI

struct AdminBrandHeader: View {
    let account: String
    var isLoading = false
    let onSignOut: () -> Void

    var body: some View {
        HStack(spacing: 11) {
            BrandMark(size: 38)

            VStack(alignment: .leading, spacing: 2) {
                Text("Jaaymaa")
                    .font(.system(size: 17, weight: .bold, design: .rounded))
                    .foregroundStyle(JaaymaStyle.paper)

                Text("CENTRE DE PILOTAGE")
                    .font(.system(size: 9, weight: .bold))
                    .tracking(1.05)
                    .foregroundStyle(JaaymaStyle.paper.opacity(0.58))
            }

            Spacer(minLength: 12)

            if isLoading {
                JaaymaLoader(variant: .mini, size: 32, label: "Actualisation des données")
                    .padding(.trailing, 2)
            }

            Menu {
                Section("Session administrateur") {
                    Button {} label: {
                        Text(account)
                    }
                    .disabled(true)
                }

                Button(role: .destructive, action: onSignOut) {
                    Label("Se déconnecter", systemImage: "rectangle.portrait.and.arrow.right")
                }
            } label: {
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 19, weight: .medium))
                    .symbolRenderingMode(.hierarchical)
                    .foregroundStyle(JaaymaStyle.paper)
                    .frame(width: 40, height: 40)
                    .background(.ultraThinMaterial, in: Circle())
                    .overlay(Circle().stroke(JaaymaStyle.paper.opacity(0.15), lineWidth: 1))
            }
            .accessibilityLabel("Compte administrateur")
        }
        .padding(.bottom, 2)
    }
}
