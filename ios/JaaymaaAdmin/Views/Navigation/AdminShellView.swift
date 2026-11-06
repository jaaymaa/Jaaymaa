import SwiftUI

struct AdminShellView: View {
    @EnvironmentObject private var session: AdminSessionStore
    @Environment(\.horizontalSizeClass) private var sizeClass
    @State private var sidebarSelection: AdminSection? = .overview
    @State private var tabSelection: AdminTab = .overview

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
                    Tab(AdminTab.overview.title, systemImage: AdminTab.overview.symbol, value: AdminTab.overview) {
                        NavigationStack { AdminSectionView(section: .overview) }
                    }
                    Tab(AdminTab.shops.title, systemImage: AdminTab.shops.symbol, value: AdminTab.shops) {
                        NavigationStack { AdminSectionView(section: .shops) }
                    }
                    Tab(AdminTab.accounts.title, systemImage: AdminTab.accounts.symbol, value: AdminTab.accounts) {
                        NavigationStack { AdminSectionView(section: .accounts) }
                    }
                    Tab(AdminTab.orders.title, systemImage: AdminTab.orders.symbol, value: AdminTab.orders) {
                        NavigationStack { AdminSectionView(section: .orders) }
                    }
                    Tab(AdminTab.more.title, systemImage: AdminTab.more.symbol, value: AdminTab.more) {
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
}

