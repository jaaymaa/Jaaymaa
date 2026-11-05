import SwiftUI

struct AdminShellView: View {
    @EnvironmentObject private var session: AdminSessionStore
    @Environment(\.horizontalSizeClass) private var sizeClass
    @State private var activeSection: AdminSection = .overview
    @State private var showMoreSheet = false
    @State private var sidebarSelection: AdminSection? = .overview

    var body: some View {
        Group {
            if sizeClass == .regular {
                ipadLayout
            } else {
                iphoneLayout
            }
        }
    }

    // MARK: - iPhone Layout with Custom Symmetrical Floating Pill Navigation

    private var iphoneLayout: some View {
        ZStack(alignment: .bottom) {
            // Main content area
            VStack(spacing: 0) {
                topNavigationBar

                NavigationStack {
                    AdminSectionView(section: activeSection)
                }
            }
            .background(JaaymaStyle.paper.ignoresSafeArea())

            // Symmetrical Floating Bottom Navigation Bar (reproducing web mobile nav)
            floatingBottomNav
                .padding(.horizontal, 16)
                .padding(.bottom, 10)
        }
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .sheet(isPresented: $showMoreSheet) {
            AdminMoreView(currentSection: $activeSection)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
    }

    // MARK: - Top Brand Navigation Bar

    private var topNavigationBar: some View {
        HStack(spacing: 12) {
            HStack(spacing: 8) {
                BrandMark(size: 32, brutalist: true)
                Text("Jaaymaa")
                    .font(.system(size: 19, weight: .black, design: .rounded))
                    .foregroundStyle(.white)

                Text("ADMIN")
                    .font(.system(size: 9, weight: .black))
                    .tracking(1.2)
                    .foregroundStyle(JaaymaStyle.sun)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2.5)
                    .background(JaaymaStyle.sun.opacity(0.18), in: RoundedRectangle(cornerRadius: 6))
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(JaaymaStyle.sun.opacity(0.4), lineWidth: 1))
            }

            Spacer()

            if let phone = session.userPhone {
                HStack(spacing: 5) {
                    Circle()
                        .fill(JaaymaStyle.baobab)
                        .frame(width: 7, height: 7)
                    Text(phone)
                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                        .foregroundStyle(JaaymaStyle.ghost)
                }
                .padding(.horizontal, 9)
                .padding(.vertical, 5)
                .background(Color.white.opacity(0.08), in: Capsule())
                .overlay(Capsule().stroke(Color.white.opacity(0.15), lineWidth: 1))
            }

            Button {
                Task { await session.signOut() }
            } label: {
                Image(systemName: "rectangle.portrait.and.arrow.right")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(JaaymaStyle.ghost)
                    .padding(8)
                    .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
            }
            .accessibilityLabel("Se déconnecter")
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 11)
        .background(JaaymaStyle.nuit)
    }

    // MARK: - Floating Symmetrical Bottom Bar

    private var isMoreActive: Bool {
        AdminSection.moreSections.contains(activeSection)
    }

    private var floatingBottomNav: some View {
        HStack(spacing: 4) {
            // 1. Aperçu
            navItem(for: .overview, label: "Aperçu", symbol: AdminSection.overview.symbol)

            // 2. Boutiques
            navItem(for: .shops, label: "Boutiques", symbol: AdminSection.shops.symbol)

            // 3. Comptes
            navItem(for: .accounts, label: "Comptes", symbol: AdminSection.accounts.symbol)

            // 4. Commandes
            navItem(for: .orders, label: "Commandes", symbol: AdminSection.orders.symbol)

            // 5. Plus (Sheet trigger)
            Button {
                showMoreSheet = true
            } label: {
                HStack(spacing: 5) {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 16, weight: .heavy))
                    if isMoreActive {
                        Text(activeSection.shortTitle)
                            .font(.system(size: 10, weight: .black, design: .rounded))
                            .lineLimit(1)
                    }
                }
                .foregroundStyle(JaaymaStyle.ink)
                .padding(.horizontal, isMoreActive ? 10 : 8)
                .padding(.vertical, 8)
                .frame(maxWidth: .infinity)
                .frame(height: 40)
                .background(
                    Group {
                        if isMoreActive {
                            Capsule().fill(JaaymaStyle.sun)
                        } else {
                            Color.clear
                        }
                    }
                )
                .overlay(
                    Group {
                        if isMoreActive {
                            Capsule().stroke(JaaymaStyle.ink, lineWidth: 2)
                        }
                    }
                )
                .shadow(color: isMoreActive ? JaaymaStyle.ink : .clear, radius: 0, x: 1.5, y: 1.5)
            }
            .buttonStyle(.plain)
        }
        .padding(5)
        .background(JaaymaStyle.paper, in: Capsule())
        .overlay(Capsule().stroke(JaaymaStyle.ink, lineWidth: 2.5))
        .shadow(color: JaaymaStyle.ink, radius: 0, x: 3.5, y: 3.5)
        .frame(maxWidth: 480)
    }

    private func navItem(for section: AdminSection, label: String, symbol: String) -> some View {
        let isSelected = activeSection == section

        return Button {
            withAnimation(.spring(response: 0.25, dampingFraction: 0.8)) {
                activeSection = section
            }
        } label: {
            HStack(spacing: 5) {
                Image(systemName: symbol)
                    .font(.system(size: isSelected ? 14 : 16, weight: .bold))

                if isSelected {
                    Text(label)
                        .font(.system(size: 10, weight: .black, design: .rounded))
                        .lineLimit(1)
                }
            }
            .foregroundStyle(isSelected ? JaaymaStyle.ink : JaaymaStyle.muted)
            .padding(.horizontal, isSelected ? 10 : 8)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity)
            .frame(height: 40)
            .background(
                Group {
                    if isSelected {
                        Capsule().fill(JaaymaStyle.sun)
                    } else {
                        Color.clear
                    }
                }
            )
            .overlay(
                Group {
                    if isSelected {
                        Capsule().stroke(JaaymaStyle.ink, lineWidth: 2)
                    }
                }
            )
            .shadow(color: isSelected ? JaaymaStyle.ink : .clear, radius: 0, x: 1.5, y: 1.5)
        }
        .buttonStyle(.plain)
    }

    // MARK: - iPad Split View Layout

    private var ipadLayout: some View {
        NavigationSplitView {
            List(selection: $sidebarSelection) {
                Section {
                    ForEach(AdminSection.allCases) { section in
                        HStack(spacing: 12) {
                            Image(systemName: section.symbol)
                                .font(.system(size: 14, weight: .bold))
                                .frame(width: 28, height: 28)
                                .background(activeSection == section ? JaaymaStyle.sun : Color.white, in: RoundedRectangle(cornerRadius: 8))
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(JaaymaStyle.ink, lineWidth: 1.5))

                            Text(section.title)
                                .font(.system(size: 14, weight: .bold, design: .rounded))

                            Spacer()
                        }
                        .padding(.vertical, 3)
                        .tag(section)
                    }
                } header: {
                    Text("GESTION DE JAAYMAA")
                        .font(.system(size: 10, weight: .black))
                        .tracking(1.4)
                        .foregroundStyle(JaaymaStyle.darkHibiscus)
                }
            }
            .scrollContentBackground(.hidden)
            .background(JaaymaStyle.paper)
            .navigationTitle("Jaaymaa Admin")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await session.signOut() }
                    } label: {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                    }
                    .accessibilityLabel("Se déconnecter")
                }
            }
        } detail: {
            NavigationStack {
                AdminSectionView(section: sidebarSelection ?? activeSection)
            }
        }
        .onChange(of: sidebarSelection) { _, newVal in
            if let val = newVal { activeSection = val }
        }
        .tint(JaaymaStyle.ink)
    }
}
