import SwiftUI

struct AdminSectionView: View {
    @EnvironmentObject private var session: AdminSessionStore
    let section: AdminSection
    @State private var data: AdminSectionData?
    @State private var errorMessage: String?
    @State private var loading = false
    @State private var query = ""
    @State private var page = 1

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                // Symmetrical Neo-Brutalist Brand Page Header
                AdminPageHeader(
                    eyebrow: section.eyebrow,
                    title: section.title,
                    description: section.description,
                    badgeText: pageBadgeText,
                    badgeIcon: section.symbol
                )

                // Search Bar (if section is searchable)
                if section.isSearchable {
                    searchBar
                }

                // Main Content / State
                if loading && data == nil {
                    JaaymaScreenLoader(
                        label: "Chargement de \(section.shortTitle)…",
                        subtitle: "Synchronisation des données en direct"
                    )
                    .frame(minHeight: 280)
                } else if let errorMessage {
                    errorView(errorMessage)
                } else if let data {
                    content(data)

                    // Symmetrical Pagination Bar
                    if let pageInfo = data.pageInfo {
                        paginationBar(pageInfo)
                    }
                }

                // Symmetrical Bottom Inset so content is not obscured by floating dock
                Spacer(minLength: 80)
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 20)
            .frame(maxWidth: 1000, alignment: .leading)
            .frame(maxWidth: .infinity)
        }
        .background(JaaymaStyle.paper.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text(section.shortTitle)
                    .font(.system(size: 15, weight: .black, design: .rounded))
                    .foregroundStyle(JaaymaStyle.ink)
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    JaaymaHaptics.light()
                    Task { await load() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(JaaymaStyle.ink)
                }
                .accessibilityLabel("Actualiser")
            }
        }
        .task(id: section) {
            page = 1
            query = ""
            await load()
        }
        .refreshable {
            await load()
        }
    }

    private var pageBadgeText: String? {
        if let data, let pageInfo = data.pageInfo {
            return "Page \(pageInfo.current)/\(pageInfo.total)"
        }
        return nil
    }

    // MARK: - Search Bar

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(JaaymaStyle.muted)

            TextField("Rechercher dans \(section.shortTitle.lowercased())…", text: $query)
                .font(.system(size: 14, weight: .medium))
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .onSubmit {
                    page = 1
                    JaaymaHaptics.light()
                    Task { await load() }
                }

            if !query.isEmpty {
                Button {
                    query = ""
                    page = 1
                    Task { await load() }
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(JaaymaStyle.muted)
                }
            }

            Button {
                page = 1
                JaaymaHaptics.light()
                Task { await load() }
            } label: {
                Text("Filtrer")
                    .font(.system(size: 12, weight: .black, design: .rounded))
                    .foregroundStyle(JaaymaStyle.ink)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 7)
                    .background(JaaymaStyle.sun, in: RoundedRectangle(cornerRadius: 10))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(JaaymaStyle.ink, lineWidth: 1.5))
                    .shadow(color: JaaymaStyle.ink, radius: 0, x: 1.5, y: 1.5)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(JaaymaStyle.ink, lineWidth: 1.5))
        .shadow(color: JaaymaStyle.ink, radius: 0, x: 2.5, y: 2.5)
    }

    // MARK: - Error View

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "wifi.exclamationmark")
                .font(.system(size: 38, weight: .bold))
                .foregroundStyle(JaaymaStyle.hibiscus)

            VStack(spacing: 6) {
                Text("Impossible de charger les données")
                    .font(.system(size: 17, weight: .black, design: .rounded))
                    .foregroundStyle(JaaymaStyle.ink)

                Text(message)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(JaaymaStyle.muted)
                    .multilineTextAlignment(.center)
            }

            Button {
                JaaymaHaptics.medium()
                Task { await load() }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.clockwise")
                    Text("Réessayer")
                }
                .font(.system(size: 14, weight: .black, design: .rounded))
                .foregroundStyle(JaaymaStyle.ink)
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(JaaymaStyle.sun, in: Capsule())
                .overlay(Capsule().stroke(JaaymaStyle.ink, lineWidth: 1.5))
                .shadow(color: JaaymaStyle.ink, radius: 0, x: 2, y: 2)
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(JaaymaStyle.ink, lineWidth: 1.5))
        .shadow(color: JaaymaStyle.ink, radius: 0, x: 3, y: 3)
    }

    // MARK: - Symmetrical Pagination Bar

    private func paginationBar(_ pageInfo: PageInfo) -> some View {
        HStack {
            Button {
                JaaymaHaptics.light()
                page = max(1, page - 1)
                Task { await load() }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "chevron.left")
                    Text("Précédent")
                }
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(pageInfo.current <= 1 ? JaaymaStyle.muted : JaaymaStyle.ink)
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background(pageInfo.current <= 1 ? Color.gray.opacity(0.12) : Color.white, in: RoundedRectangle(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.ink.opacity(pageInfo.current <= 1 ? 0.3 : 1.0), lineWidth: 1.5))
                .shadow(color: pageInfo.current <= 1 ? .clear : JaaymaStyle.ink, radius: 0, x: 1.5, y: 1.5)
            }
            .disabled(pageInfo.current <= 1)

            Spacer()

            Text("Page \(pageInfo.current) sur \(pageInfo.total)")
                .font(.system(size: 12, weight: .black, design: .rounded))
                .foregroundStyle(JaaymaStyle.ink)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(JaaymaStyle.chip, in: Capsule())

            Spacer()

            Button {
                JaaymaHaptics.light()
                page = min(pageInfo.total, page + 1)
                Task { await load() }
            } label: {
                HStack(spacing: 6) {
                    Text("Suivant")
                    Image(systemName: "chevron.right")
                }
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(pageInfo.current >= pageInfo.total ? JaaymaStyle.muted : JaaymaStyle.ink)
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background(pageInfo.current >= pageInfo.total ? Color.gray.opacity(0.12) : Color.white, in: RoundedRectangle(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.ink.opacity(pageInfo.current >= pageInfo.total ? 0.3 : 1.0), lineWidth: 1.5))
                .shadow(color: pageInfo.current >= pageInfo.total ? .clear : JaaymaStyle.ink, radius: 0, x: 1.5, y: 1.5)
            }
            .disabled(pageInfo.current >= pageInfo.total)
        }
        .padding(.top, 6)
    }

    // MARK: - Section View Router

    @ViewBuilder
    private func content(_ data: AdminSectionData) -> some View {
        switch data {
        case .overview(let value):
            OverviewContent(value: value)
        case .shops(let value):
            ShopListContent(page: value, subscriptionsOnly: false, onUpdate: updateShop)
        case .subscriptions(let value):
            ShopListContent(page: value.shops, subscriptionsOnly: true, metrics: value.metrics, onUpdate: updateShop)
        case .accounts(let value):
            AccountListContent(page: value)
        case .orders(let value):
            OrderListContent(page: value)
        case .analytics(let value):
            AnalyticsContent(value: value)
        case .notifications(let value):
            NotificationContent(value: value, onSend: sendNotification)
        case .settings(let value):
            SettingsContent(value: value, onChange: updateSetting)
        }
    }

    // MARK: - API Actions

    private func load() async {
        guard let token = session.token else { return }
        loading = true
        errorMessage = nil
        do {
            data = try await AdminAPI.shared.load(section, token: token, page: page, query: query)
        } catch AdminAPIError.unauthorized {
            session.invalidate()
        } catch AdminAPIError.accessRevoked {
            session.invalidate()
        } catch {
            errorMessage = error.localizedDescription
        }
        loading = false
    }

    private func updateSetting(_ values: [String: Any]) async throws {
        guard let token = session.token else { throw AdminAPIError.unauthorized }
        try await AdminAPI.shared.updateSettings(token: token, values: values)
        await load()
    }

    private func updateShop(_ id: String, changes: [String: Any]) async throws {
        guard let token = session.token else { throw AdminAPIError.unauthorized }
        var values = changes
        values["shopId"] = id
        let endpoint = section == .subscriptions ? "subscriptions" : "shops"
        try await AdminAPI.shared.patch(endpoint, token: token, values: values)
        await load()
    }

    private func sendNotification(_ values: [String: Any]) async throws {
        guard let token = session.token else { throw AdminAPIError.unauthorized }
        try await AdminAPI.shared.sendNotification(token: token, values: values)
        await load()
    }
}
