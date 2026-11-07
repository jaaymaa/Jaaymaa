import SwiftUI

struct AdminMoreView: View {
    @EnvironmentObject private var session: AdminSessionStore
    private let sections: [AdminSection] = [.subscriptions, .analytics, .notifications, .settings]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                AdminBrandHeader(account: session.phone ?? "Compte administrateur") {
                    Task { await session.signOut() }
                }

                SectionCard(
                    title: "Gestion avancée",
                    subtitle: "Rubriques d’administration",
                    symbol: "square.grid.2x2.fill",
                    accent: JaaymaStyle.sun
                ) {
                    ForEach(sections) { section in
                        JaaymaRowDivider(leadingInset: 0)

                        NavigationLink {
                            AdminSectionView(section: section)
                        } label: {
                            HStack(spacing: 14) {
                                Image(systemName: section.symbol)
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundStyle(JaaymaStyle.ink)
                                    .frame(width: 42, height: 42)
                                    .background(sectionAccent(section).opacity(0.3), in: RoundedRectangle(cornerRadius: 12))

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
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(JaaymaStyle.muted)
                                    .frame(width: 28, height: 28)
                                    .background(JaaymaStyle.ink.opacity(0.06), in: Circle())
                            }
                            .padding(.vertical, 8)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(JaaymaInteractiveButtonStyle())
                        .hoverEffect(.highlight)
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 18)
            .frame(maxWidth: 1100)
            .frame(maxWidth: .infinity)
        }
        .background(JaaymaStyle.night.ignoresSafeArea())
        .navigationTitle("Plus")
        .navigationBarTitleDisplayMode(.large)
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

    private func sectionAccent(_ section: AdminSection) -> Color {
        switch section {
        case .subscriptions: return JaaymaStyle.sun
        case .analytics: return JaaymaStyle.mist
        case .notifications: return JaaymaStyle.hibiscus
        case .settings: return JaaymaStyle.green
        default: return JaaymaStyle.sun
        }
    }
}
