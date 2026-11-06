import SwiftUI

struct AdminBrandHeader: View {
    let account: String
    let onSignOut: () -> Void

    var body: some View {
        HStack(spacing: 11) {
            BrandMark(size: 38)

            VStack(alignment: .leading, spacing: 2) {
                Text("Jaaymaa")
                    .font(.system(size: 17, weight: .bold, design: .rounded))
                    .foregroundStyle(JaaymaStyle.ink)

                Text("CENTRE DE PILOTAGE")
                    .font(.system(size: 9, weight: .bold))
                    .tracking(1.05)
                    .foregroundStyle(JaaymaStyle.muted)
            }

            Spacer(minLength: 12)

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
                    .foregroundStyle(JaaymaStyle.ink)
                    .frame(width: 40, height: 40)
                    .background(.white.opacity(0.9), in: Circle())
                    .overlay(Circle().stroke(JaaymaStyle.ink.opacity(0.08), lineWidth: 1))
            }
            .accessibilityLabel("Compte administrateur")
        }
        .padding(.bottom, 2)
    }
}
