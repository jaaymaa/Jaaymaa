import SwiftUI

struct AdminMoreView: View {
    @EnvironmentObject private var session: AdminSessionStore
    private let sections: [AdminSection] = [.subscriptions, .analytics, .notifications, .settings]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header

                SectionCard(title: "Gestion avancée", subtitle: "Rubriques d’administration") {
                    ForEach(sections) { section in
                        NavigationLink {
                            AdminSectionView(section: section)
                        } label: {
                            HStack(spacing: 14) {
                                Image(systemName: section.symbol)
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundStyle(JaaymaStyle.ink)
                                    .frame(width: 42, height: 42)
                                    .background(JaaymaStyle.sun.opacity(0.4), in: RoundedRectangle(cornerRadius: 12))

                                VStack(alignment: .leading, spacing: 3) {
                                    Text(section.title)
                                        .font(.subheadline.weight(.bold))
                                        .foregroundStyle(JaaymaStyle.ink)
                                    Text(sectionSubtitle(section))
                                        .font(.caption)
                                        .foregroundStyle(JaaymaStyle.muted)
                                }

                                Spacer(minLength: 0)

                                Image(systemName: "chevron.right")
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(JaaymaStyle.muted)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }

                SectionCard(title: "Session administrateur", subtitle: "Accès autorisé") {
                    HStack(spacing: 12) {
                        Image(systemName: "person.badge.shield.checkmark.fill")
                            .font(.title2)
                            .foregroundStyle(JaaymaStyle.green)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(session.phone ?? "Compte administrateur")
                                .font(.subheadline.weight(.bold).monospaced())
                                .foregroundStyle(JaaymaStyle.ink)
                            Text("Gestion et données sécurisées de Jaaymaa")
                                .font(.caption2)
                                .foregroundStyle(JaaymaStyle.muted)
                        }

                        Spacer(minLength: 0)
                    }
                    .padding(.vertical, 4)

                    Divider()
                        .padding(.vertical, 2)

                    Button(role: .destructive) {
                        Task { await session.signOut() }
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                            Text("Se déconnecter")
                                .fontWeight(.bold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .foregroundStyle(JaaymaStyle.hibiscus)
                        .background(JaaymaStyle.hibiscus.opacity(0.12), in: RoundedRectangle(cornerRadius: 14))
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 18)
            .frame(maxWidth: 1100)
            .frame(maxWidth: .infinity)
        }
        .background(JaaymaStyle.paper.ignoresSafeArea())
        .navigationTitle("Plus")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 14) {
            BrandMark(size: 44)
            VStack(alignment: .leading, spacing: 3) {
                Text("CENTRE DE PILOTAGE")
                    .font(.caption2.weight(.heavy))
                    .tracking(1.35)
                    .foregroundStyle(JaaymaStyle.hibiscus)
                Text("Autres rubriques")
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .foregroundStyle(JaaymaStyle.ink)
            }
            Spacer(minLength: 0)
            Image(systemName: "ellipsis.circle")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(JaaymaStyle.ink)
                .frame(width: 44, height: 44)
                .background(JaaymaStyle.sun, in: RoundedRectangle(cornerRadius: 13))
                .overlay(RoundedRectangle(cornerRadius: 13).stroke(JaaymaStyle.ink.opacity(0.12), lineWidth: 1))
        }
        .padding(.bottom, 4)
    }

    private func sectionSubtitle(_ section: AdminSection) -> String {
        switch section {
        case .subscriptions: return "Forfaits des boutiques, abonnements Pro et Pro+"
        case .analytics: return "Statistiques de visite et pages consultées"
        case .notifications: return "Envoi d’annonces push aux vendeurs"
        case .settings: return "Paramètres de la plateforme et tarifs"
        default: return ""
        }
    }
}
