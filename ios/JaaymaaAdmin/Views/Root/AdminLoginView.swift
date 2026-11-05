import SwiftUI

struct AdminLoginView: View {
    @EnvironmentObject private var session: AdminSessionStore
    @State private var phone = ""
    @State private var password = ""
    @State private var message: String?
    @State private var isLoading = false

    var body: some View {
        ZStack {
            JaaymaStyle.nuit.ignoresSafeArea()

            // Subtle top decorative glow
            VStack {
                Circle()
                    .fill(JaaymaStyle.sun.opacity(0.08))
                    .frame(width: 380, height: 380)
                    .blur(radius: 80)
                    .offset(y: -140)
                Spacer()
            }
            .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 26) {
                    Spacer(minLength: 20)

                    // Brand Header
                    HStack(spacing: 14) {
                        BrandMark(size: 56, brutalist: true)
                        VStack(alignment: .leading, spacing: 3) {
                            HStack(spacing: 8) {
                                Text("Jaaymaa")
                                    .font(.system(size: 26, weight: .black, design: .rounded))
                                    .foregroundStyle(.white)

                                Text("ADMIN")
                                    .font(.system(size: 10, weight: .black))
                                    .tracking(1.4)
                                    .foregroundStyle(JaaymaStyle.sun)
                                    .padding(.horizontal, 7)
                                    .padding(.vertical, 3)
                                    .background(JaaymaStyle.sun.opacity(0.15), in: RoundedRectangle(cornerRadius: 6))
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(JaaymaStyle.sun.opacity(0.35), lineWidth: 1))
                            }

                            Text("CENTRE DE PILOTAGE")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1.8)
                                .foregroundStyle(JaaymaStyle.ghost)
                        }
                    }

                    // Welcome Text
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Ton espace de pilotage")
                            .font(.system(size: 32, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                            .lineSpacing(2)

                        Text("Connecte-toi avec un numéro autorisé pour gérer la plateforme Jaaymaa.")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(JaaymaStyle.ghost)
                            .lineSpacing(3)
                    }

                    // Brutalist Login Card
                    VStack(alignment: .leading, spacing: 18) {
                        VStack(alignment: .leading, spacing: 7) {
                            Text("NUMÉRO DE TÉLÉPHONE")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1.2)
                                .foregroundStyle(JaaymaStyle.muted)

                            HStack(spacing: 10) {
                                Image(systemName: "phone.fill")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(JaaymaStyle.muted)

                                TextField("Ex: 774451982", text: $phone)
                                    .font(.system(size: 16, weight: .bold, design: .monospaced))
                                    .keyboardType(.phonePad)
                                    .textContentType(.telephoneNumber)
                                    .textInputAutocapitalization(.never)
                                    .autocorrectionDisabled()
                            }
                            .padding(14)
                            .background(Color.white, in: RoundedRectangle(cornerRadius: 14))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(JaaymaStyle.ink, lineWidth: 2))
                            .shadow(color: JaaymaStyle.ink.opacity(0.15), radius: 0, x: 2, y: 2)
                        }

                        VStack(alignment: .leading, spacing: 7) {
                            Text("MOT DE PASSE")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1.2)
                                .foregroundStyle(JaaymaStyle.muted)

                            HStack(spacing: 10) {
                                Image(systemName: "lock.fill")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(JaaymaStyle.muted)

                                SecureField("••••••••", text: $password)
                                    .font(.system(size: 16, weight: .bold))
                                    .textContentType(.password)
                            }
                            .padding(14)
                            .background(Color.white, in: RoundedRectangle(cornerRadius: 14))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(JaaymaStyle.ink, lineWidth: 2))
                            .shadow(color: JaaymaStyle.ink.opacity(0.15), radius: 0, x: 2, y: 2)
                        }

                        if let message {
                            HStack(alignment: .top, spacing: 9) {
                                Image(systemName: "exclamationmark.octagon.fill")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(JaaymaStyle.hibiscus)
                                    .padding(.top, 1)

                                Text(message)
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(JaaymaStyle.darkHibiscus)
                                    .lineSpacing(2)
                            }
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(JaaymaStyle.hibiscus.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.hibiscus.opacity(0.3), lineWidth: 1.5))
                        }

                        // Submit Button with Brutalist styling & Animated Mini Loader
                        Button(action: signIn) {
                            HStack(spacing: 12) {
                                if isLoading {
                                    JaaymaMiniLoader(encre: true, dotSize: 9, spacing: 7)
                                    Text("Connexion en cours…")
                                        .font(.system(size: 15, weight: .black, design: .rounded))
                                        .foregroundStyle(JaaymaStyle.ink)
                                } else {
                                    Text("Se connecter")
                                        .font(.system(size: 15, weight: .black, design: .rounded))
                                        .foregroundStyle(JaaymaStyle.ink)
                                    Image(systemName: "arrow.right")
                                        .font(.system(size: 13, weight: .black))
                                        .foregroundStyle(JaaymaStyle.ink)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(JaaymaStyle.sun, in: RoundedRectangle(cornerRadius: 16))
                            .overlay(RoundedRectangle(cornerRadius: 16).stroke(JaaymaStyle.ink, lineWidth: 2.2))
                            .shadow(color: JaaymaStyle.ink, radius: 0, x: 3, y: 3)
                        }
                        .disabled(isLoading || phone.trimmingCharacters(in: .whitespaces).isEmpty || password.isEmpty)
                        .opacity((isLoading || phone.isEmpty || password.isEmpty) ? 0.65 : 1.0)
                        .padding(.top, 4)
                    }
                    .padding(20)
                    .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 24))
                    .overlay(RoundedRectangle(cornerRadius: 24).stroke(JaaymaStyle.ink, lineWidth: 2.5))
                    .shadow(color: JaaymaStyle.ink, radius: 0, x: 5, y: 5)

                    // Footer
                    HStack(spacing: 6) {
                        Image(systemName: "lock.shield.fill")
                            .font(.system(size: 12))
                        Text("Accès sécurisé · Réservé aux comptes autorisés Jaaymaa")
                            .font(.system(size: 11, weight: .medium))
                    }
                    .foregroundStyle(JaaymaStyle.ghost.opacity(0.8))
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, 8)

                    Spacer(minLength: 20)
                }
                .padding(.horizontal, 22)
                .frame(maxWidth: 520)
                .frame(maxWidth: .infinity)
            }
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
