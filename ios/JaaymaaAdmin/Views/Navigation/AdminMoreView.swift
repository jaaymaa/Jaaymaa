import SwiftUI

struct AdminMoreView: View {
    @EnvironmentObject private var session: AdminSessionStore
    @Environment(\.dismiss) private var dismiss
    @Binding var currentSection: AdminSection

    init(currentSection: Binding<AdminSection> = .constant(.settings)) {
        self._currentSection = currentSection
    }

    private let moreSections: [AdminSection] = AdminSection.moreSections

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Header Card
                    VStack(alignment: .leading, spacing: 6) {
                        Text("GESTION AVANCÉE")
                            .font(.system(size: 10, weight: .black))
                            .tracking(1.4)
                            .foregroundStyle(JaaymaStyle.darkHibiscus)

                        Text("Modules complémentaires")
                            .font(.system(size: 22, weight: .black, design: .rounded))
                            .foregroundStyle(JaaymaStyle.ink)

                        Text("Accède aux abonnements, statistiques d’audience, alertes push et réglages système.")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(JaaymaStyle.muted)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                    .background(JaaymaStyle.sun.opacity(0.3), in: RoundedRectangle(cornerRadius: 18))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(JaaymaStyle.ink, lineWidth: 1.5))

                    // 2x2 Symmetrical Grid for the 4 "More" sections
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                        ForEach(moreSections) { section in
                            Button {
                                JaaymaHaptics.selection()
                                currentSection = section
                                dismiss()
                            } label: {
                                VStack(alignment: .leading, spacing: 12) {
                                    HStack {
                                        Image(systemName: section.symbol)
                                            .font(.system(size: 16, weight: .bold))
                                            .foregroundStyle(currentSection == section ? JaaymaStyle.ink : JaaymaStyle.sun)
                                            .frame(width: 36, height: 36)
                                            .background(
                                                currentSection == section ? JaaymaStyle.sun : JaaymaStyle.ink,
                                                in: RoundedRectangle(cornerRadius: 10)
                                            )

                                        Spacer()

                                        if currentSection == section {
                                            Circle()
                                                .fill(JaaymaStyle.baobab)
                                                .frame(width: 8, height: 8)
                                        }
                                    }

                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(section.shortTitle)
                                            .font(.system(size: 15, weight: .black, design: .rounded))
                                            .foregroundStyle(JaaymaStyle.ink)

                                        Text(section.title)
                                            .font(.system(size: 11, weight: .medium))
                                            .foregroundStyle(JaaymaStyle.muted)
                                            .lineLimit(1)
                                    }
                                }
                                .padding(14)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .frame(minHeight: 110)
                                .background(Color.white, in: RoundedRectangle(cornerRadius: 18))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 18)
                                        .stroke(currentSection == section ? JaaymaStyle.ink : JaaymaStyle.ink.opacity(0.2), lineWidth: currentSection == section ? 2 : 1)
                                )
                                .shadow(
                                    color: currentSection == section ? JaaymaStyle.ink : JaaymaStyle.ink.opacity(0.08),
                                    radius: 0,
                                    x: currentSection == section ? 2.5 : 1.5,
                                    y: currentSection == section ? 2.5 : 1.5
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    // Account & Disconnect Section
                    VStack(spacing: 12) {
                        if let phone = session.userPhone {
                            HStack {
                                HStack(spacing: 8) {
                                    Circle().fill(JaaymaStyle.baobab).frame(width: 8, height: 8)
                                    Text("Connecté en tant que")
                                        .font(.system(size: 12, weight: .medium))
                                        .foregroundStyle(JaaymaStyle.muted)
                                }
                                Spacer()
                                Text(phone)
                                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                                    .foregroundStyle(JaaymaStyle.ink)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(JaaymaStyle.chip, in: RoundedRectangle(cornerRadius: 12))
                        }

                        Button {
                            JaaymaHaptics.medium()
                            dismiss()
                            Task { await session.signOut() }
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                    .font(.system(size: 14, weight: .bold))
                                Text("Se déconnecter de Jaaymaa")
                                    .font(.system(size: 14, weight: .bold, design: .rounded))
                            }
                            .foregroundStyle(JaaymaStyle.hibiscus)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(JaaymaStyle.hibiscus.opacity(0.1), in: RoundedRectangle(cornerRadius: 14))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(JaaymaStyle.hibiscus.opacity(0.3), lineWidth: 1.5))
                        }
                    }
                    .padding(.top, 10)
                }
                .padding(20)
            }
            .background(JaaymaStyle.paper.ignoresSafeArea())
            .navigationTitle("Autres modules")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Fermer") {
                        dismiss()
                    }
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(JaaymaStyle.ink)
                }
            }
        }
    }
}
