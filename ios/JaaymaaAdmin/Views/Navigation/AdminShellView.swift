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

    // MARK: - iPhone Layout with 100% Symmetrical Floating Dock

    private var iphoneLayout: some View {
        ZStack(alignment: .bottom) {
            // Main Content Container
            VStack(spacing: 0) {
                topNavigationBar

                NavigationStack {
                    AdminSectionView(section: activeSection)
                }
            }
            .background(JaaymaStyle.paper.ignoresSafeArea())

            // Mathematically Symmetrical 5-Slot Floating Dock
            symmetricalFloatingBottomBar
        }
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .sheet(isPresented: $showMoreSheet) {
            AdminMoreView(currentSection: $activeSection)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
    }

    // MARK: - Top Symmetrical Brand Header

    private var topNavigationBar: some View {
        HStack(spacing: 12) {
            // Left: Brand Mark + Name + Admin Badge
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

            Spacer(minLength: 8)

            // Right: Admin Phone Pill + Quick Signout
            HStack(spacing: 8) {
                if let phone = session.userPhone {
                    HStack(spacing: 5) {
                        Circle()
                            .fill(JaaymaStyle.baobab)
                            .frame(width: 7, height: 7)
                        Text(phone)
                            .font(.system(size: 11, weight: .bold, design: .monospaced))
                            .foregroundStyle(JaaymaStyle.ghost)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 5)
                    .background(Color.white.opacity(0.08), in: Capsule())
                    .overlay(Capsule().stroke(Color.white.opacity(0.15), lineWidth: 1))
                }

                Button {
                    JaaymaHaptics.light()
                    Task { await session.signOut() }
                } label: {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(JaaymaStyle.ghost)
                        .padding(7)
                        .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
                }
                .accessibilityLabel("Se déconnecter")
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(JaaymaStyle.nuit)
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundStyle(Color.white.opacity(0.08)),
            alignment: .bottom
        )
    }

    // MARK: - Perfectly Symmetrical 5-Slot Floating Dock

    private var isMoreActive: Bool {
        AdminSection.moreSections.contains(activeSection)
    }

    private var symmetricalFloatingBottomBar: some View {
        HStack(spacing: 0) {
            // Slot 1: Aperçu
            navSlot(
                section: .overview,
                label: "Aperçu",
                symbol: "square.grid.2x2.fill",
                isSelected: activeSection == .overview
            ) {
                switchSection(to: .overview)
            }

            // Slot 2: Boutiques
            navSlot(
                section: .shops,
                label: "Boutiques",
                symbol: "storefront.fill",
                isSelected: activeSection == .shops
            ) {
                switchSection(to: .shops)
            }

            // Slot 3: Commandes (EXACT MATHEMATICAL CENTER)
            navSlot(
                section: .orders,
                label: "Commandes",
                symbol: "bag.fill",
                isSelected: activeSection == .orders
            ) {
                switchSection(to: .orders)
            }

            // Slot 4: Comptes
            navSlot(
                section: .accounts,
                label: "Comptes",
                symbol: "person.2.fill",
                isSelected: activeSection == .accounts
            ) {
                switchSection(to: .accounts)
            }

            // Slot 5: Plus (Triggers sheet for Subscriptions, Analytics, Notifications, Settings)
            moreNavSlot
        }
        .padding(.horizontal, 4)
        .padding(.vertical, 6)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 22))
        .overlay(
            RoundedRectangle(cornerRadius: 22)
                .stroke(JaaymaStyle.ink, lineWidth: 2)
        )
        .shadow(color: JaaymaStyle.ink.opacity(0.18), radius: 0, x: 0, y: 3)
        .shadow(color: JaaymaStyle.ink.opacity(0.08), radius: 10, y: 5)
        .padding(.horizontal, 16)
        .padding(.bottom, 6)
    }

    // Single fixed-width symmetrical navigation slot
    private func navSlot(
        section: AdminSection,
        label: String,
        symbol: String,
        isSelected: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            VStack(spacing: 3) {
                ZStack {
                    if isSelected {
                        RoundedRectangle(cornerRadius: 9)
                            .fill(JaaymaStyle.sun)
                            .overlay(RoundedRectangle(cornerRadius: 9).stroke(JaaymaStyle.ink, lineWidth: 1.2))
                            .shadow(color: JaaymaStyle.ink, radius: 0, x: 1, y: 1)
                            .frame(width: 38, height: 26)
                    }

                    Image(systemName: symbol)
                        .font(.system(size: 15, weight: isSelected ? .black : .bold))
                        .foregroundStyle(isSelected ? JaaymaStyle.ink : JaaymaStyle.muted)
                }
                .frame(width: 38, height: 26)

                Text(label)
                    .font(.system(size: 10, weight: isSelected ? .black : .bold, design: .rounded))
                    .foregroundStyle(isSelected ? JaaymaStyle.ink : JaaymaStyle.muted)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    // 5th Slot: Plus button
    private var moreNavSlot: some View {
        Button {
            JaaymaHaptics.light()
            showMoreSheet = true
        } label: {
            VStack(spacing: 3) {
                ZStack {
                    if isMoreActive {
                        RoundedRectangle(cornerRadius: 9)
                            .fill(JaaymaStyle.sun)
                            .overlay(RoundedRectangle(cornerRadius: 9).stroke(JaaymaStyle.ink, lineWidth: 1.2))
                            .shadow(color: JaaymaStyle.ink, radius: 0, x: 1, y: 1)
                            .frame(width: 38, height: 26)
                    }

                    Image(systemName: isMoreActive ? activeSection.symbol : "ellipsis")
                        .font(.system(size: 15, weight: isMoreActive ? .black : .bold))
                        .foregroundStyle(isMoreActive ? JaaymaStyle.ink : JaaymaStyle.muted)
                }
                .frame(width: 38, height: 26)

                Text(isMoreActive ? activeSection.shortTitle : "Plus")
                    .font(.system(size: 10, weight: isMoreActive ? .black : .bold, design: .rounded))
                    .foregroundStyle(isMoreActive ? JaaymaStyle.ink : JaaymaStyle.muted)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func switchSection(to section: AdminSection) {
        JaaymaHaptics.selection()
        withAnimation(.spring(response: 0.25, dampingFraction: 0.8)) {
            activeSection = section
        }
    }

    // MARK: - iPad Layout

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
