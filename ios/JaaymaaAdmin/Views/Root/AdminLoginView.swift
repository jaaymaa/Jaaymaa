import SwiftUI

struct AdminLoginView: View {
    @EnvironmentObject private var session: AdminSessionStore
    @State private var phone = ""
    @State private var password = ""
    @State private var message: String?
    @State private var isLoading = false

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [JaaymaStyle.night, JaaymaStyle.nightPanel],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 24) {
                HStack(spacing: 12) {
                    BrandMark(size: 52)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Jaaymaa")
                            .font(.system(size: 24, weight: .black, design: .rounded))
                        Text("ADMINISTRATION")
                            .font(.caption2.weight(.bold))
                            .tracking(1.8)
                            .foregroundStyle(JaaymaStyle.sun)
                    }
                    .foregroundStyle(.white)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Ton espace de pilotage")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                    Text("Connecte-toi avec un numéro autorisé pour gérer Jaaymaa.")
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.72))
                }

                VStack(spacing: 14) {
                    TextField("Numéro de téléphone", text: $phone)
                        .keyboardType(.phonePad)
                        .textContentType(.telephoneNumber)
                        .foregroundStyle(JaaymaStyle.ink)
                        .tint(JaaymaStyle.ink)
                        .padding(16)
                        .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 15))

                    SecureField("Mot de passe", text: $password)
                        .textContentType(.password)
                        .foregroundStyle(JaaymaStyle.ink)
                        .tint(JaaymaStyle.ink)
                        .padding(16)
                        .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 15))

                    if let message {
                        Text(message)
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(JaaymaStyle.hibiscus)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Button(action: signIn) {
                        HStack(spacing: 10) {
                            if isLoading {
                                JaaymaLoader(variant: .miniInk, size: 26)
                            }
                            Text(isLoading ? "Connexion…" : "Se connecter")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(JaaymaPrimaryButtonStyle())
                    .disabled(isLoading || phone.isEmpty || password.isEmpty)
                }
                .padding(18)
                .jaaymaCard(radius: 24)

                Spacer(minLength: 0)

                Text("Accès réservé aux comptes administrateurs Jaaymaa.")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.6))
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .padding(24)
            .frame(maxWidth: 560)
            .frame(maxWidth: .infinity)
        }
    }

    private func signIn() {
        isLoading = true
        message = nil
        Task {
            do {
                try await session.signIn(phone: phone, password: password)
            } catch {
                message = error.localizedDescription
            }
            isLoading = false
        }
    }
}

