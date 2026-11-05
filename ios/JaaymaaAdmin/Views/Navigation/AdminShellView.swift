import SwiftUI

struct AdminShellView: View {
    @EnvironmentObject private var session: AdminSessionStore
    @Environment(\.horizontalSizeClass) private var sizeClass
    @State private var sidebarSelection: AdminSection? = .overview
    @State private var tabSelection: AdminSection = .overview

    var body: some View {
        Group {
            if sizeClass == .regular {
                NavigationSplitView {
                    List(selection: $sidebarSelection) {
                        Section("Plateforme") {
                            ForEach(AdminSection.allCases) { section in
                                Label(section.title, systemImage: section.symbol).tag(section)
                            }
                        }
                    }
                    .scrollContentBackground(.hidden)
                    .background(JaaymaStyle.paper)
                    .navigationTitle("Jaaymaa Admin")
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            signOutButton
                        }
                    }
                } detail: {
                    NavigationStack {
                        AdminSectionView(section: sidebarSelection ?? .overview)
                    }
                }
                .tint(JaaymaStyle.ink)
            } else {
                TabView(selection: $tabSelection) {
                    Tab(shortTitle(.overview), systemImage: AdminSection.overview.symbol, value: AdminSection.overview) {
                        NavigationStack { AdminSectionView(section: .overview) }
                    }
                    Tab(shortTitle(.shops), systemImage: AdminSection.shops.symbol, value: AdminSection.shops) {
                        NavigationStack { AdminSectionView(section: .shops) }
                    }
                    Tab(shortTitle(.orders), systemImage: AdminSection.orders.symbol, value: AdminSection.orders) {
                        NavigationStack { AdminSectionView(section: .orders) }
                    }
                    Tab(shortTitle(.accounts), systemImage: AdminSection.accounts.symbol, value: AdminSection.accounts) {
                        NavigationStack { AdminSectionView(section: .accounts) }
                    }
                    Tab("Plus", systemImage: "ellipsis.circle", value: AdminSection.settings) {
                        NavigationStack { AdminMoreView() }
                    }
                }
                .tint(JaaymaStyle.ink)
            }
        }
        .toolbarBackgroundVisibility(.visible, for: .tabBar)
    }

    private var signOutButton: some View {
        Button {
            Task { await session.signOut() }
        } label: {
            Image(systemName: "rectangle.portrait.and.arrow.right")
        }
        .accessibilityLabel("Se déconnecter")
    }

    private func shortTitle(_ section: AdminSection) -> String {
        switch section {
        case .overview: return "Accueil"
        case .shops: return "Boutiques"
        case .orders: return "Commandes"
        default: return section.title
        }
    }
}

