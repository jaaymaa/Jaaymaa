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
                // Neo-Brutalist Page Title Header
                AdminPageHeader(
                    eyebrow: section.eyebrow,
                    title: section.title,
                    description: section.description,
                    badgeText: badgeTextForSection,
                    badgeIcon: section == .overview ? "waveform.path.ecg" : section.symbol
                )

                // Search Bar for Searchable Sections
                if section.isSearchable {
                    searchBar
                }

                // Main Content / Loaders / Errors
                if loading && data == nil {
                    JaaymaScreenLoader(
                        label: "Chargement de \(section.shortTitle)…",
                        subtitle: "Synchronisation en direct avec le Worker"
                    )
                    .frame(minHeight: 340)
                } else if let errorMessage {
                    errorCard(errorMessage)
                } else if let data {
                    content(data)

                    if let pageInfo = data.pageInfo {
                        paginationBar(pageInfo)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 95) // Clear room for the floating bottom pill bar
            .frame(maxWidth: 1100, alignment: .leading)
            .frame(maxWidth: .infinity)
        }
        .background(JaaymaStyle.paper.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await load() }
                } label: {
                    if loading {
                        JaaymaMiniLoader(encre: true, dotSize: 6, spacing: 4)
                    } else {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(JaaymaStyle.ink)
                    }
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

    // MARK: - Search Bar

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(JaaymaStyle.muted)

            TextField("Rechercher (nom, téléphone, référence)…", text: $query)
                .font(.system(size: 14, weight: .medium))
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .onSubmit {
                    page = 1
                    Task { await load() }
                }

            if !query.isEmpty {
                Button {
                    query = ""
                    page = 1
                    Task { await load() }
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(JaaymaStyle.muted)
                }
            }

            Button {
                page = 1
                Task { await load() }
            } label: {
                Text("Filtrer")
                    .font(.system(size: 12, weight: .black, design: .rounded))
                    .foregroundStyle(JaaymaStyle.ink)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(JaaymaStyle.sun, in: RoundedRectangle(cornerRadius: 10))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(JaaymaStyle.ink, lineWidth: 1.8))
                    .shadow(color: JaaymaStyle.ink, radius: 0, x: 2, y: 2)
            }
        }
        .padding(12)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(JaaymaStyle.ink, lineWidth: 2))
        .shadow(color: JaaymaStyle.ink, radius: 0, x: 3, y: 3)
    }

    // MARK: - Pagination Bar

    private func paginationBar(_ info: PageInfo) -> some View {
        HStack {
            Button {
                page = max(1, page - 1)
                Task { await load() }
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "chevron.left")
                    Text("Précédent")
                }
                .font(.system(size: 12, weight: .black, design: .rounded))
                .foregroundStyle(info.current <= 1 ? JaaymaStyle.muted : JaaymaStyle.ink)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(info.current <= 1 ? Color.gray.opacity(0.1) : Color.white, in: RoundedRectangle(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(JaaymaStyle.ink, lineWidth: 1.5))
                .shadow(color: info.current <= 1 ? .clear : JaaymaStyle.ink, radius: 0, x: 2, y: 2)
            }
            .disabled(info.current <= 1)

            Spacer()

            Text("Page \(info.current) / \(info.total)")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(JaaymaStyle.muted)

            Spacer()

            Button {
                page = min(info.total, page + 1)
                Task { await load() }
            } label: {
                HStack(spacing: 4) {
                    Text("Suivant")
                    Image(systemName: "chevron.right")
                }
                .font(.system(size: 12, weight: .black, design: .rounded))
                .foregroundStyle(info.current >= info.total ? JaaymaStyle.muted : JaaymaStyle.ink)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(info.current >= info.total ? Color.gray.opacity(0.1) : Color.white, in: RoundedRectangle(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(JaaymaStyle.ink, lineWidth: 1.5))
                .shadow(color: info.current >= info.total ? .clear : JaaymaStyle.ink, radius: 0, x: 2, y: 2)
            }
            .disabled(info.current >= info.total)
        }
        .padding(14)
        .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(JaaymaStyle.ink, lineWidth: 2))
        .shadow(color: JaaymaStyle.ink, radius: 0, x: 3, y: 3)
    }

    // MARK: - Error Card

    private func errorCard(_ message: String) -> some View {
        VStack(spacing: 14) {
            HStack(spacing: 10) {
                Image(systemName: "wifi.exclamationmark")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(JaaymaStyle.darkHibiscus)
                Text("Connexion interrompue")
                    .font(.system(size: 16, weight: .black, design: .rounded))
                    .foregroundStyle(JaaymaStyle.darkHibiscus)
            }

            Text(message)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(JaaymaStyle.muted)
                .multilineTextAlignment(.center)

            Button {
                Task { await load() }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.clockwise")
                    Text("Réessayer")
                }
                .font(.system(size: 13, weight: .black, design: .rounded))
                .foregroundStyle(JaaymaStyle.ink)
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(JaaymaStyle.sun, in: RoundedRectangle(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.ink, lineWidth: 2))
                .shadow(color: JaaymaStyle.ink, radius: 0, x: 2.5, y: 2.5)
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity)
        .background(JaaymaStyle.hibiscus.opacity(0.1), in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(JaaymaStyle.hibiscus.opacity(0.4), lineWidth: 2))
    }

    private var badgeTextForSection: String? {
        switch section {
        case .overview: return "Données en direct"
        case .shops:
            if case .shops(let page) = data { return "\(page.total) boutique\(page.total != 1 ? "s" : "")" }
            return nil
        case .accounts:
            if case .accounts(let page) = data { return "\(page.total) compte\(page.total != 1 ? "s" : "")" }
            return nil
        case .orders:
            if case .orders(let page) = data { return "\(page.total) commande\(page.total != 1 ? "s" : "")" }
            return nil
        case .subscriptions:
            if case .subscriptions(let page) = data { return "\(page.shops.total) boutique\(page.shops.total != 1 ? "s" : "")" }
            return nil
        default:
            return nil
        }
    }

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

    private func updateShop(_ id: String, _ values: [String: Any]) async throws {
        guard let token = session.token else { throw AdminAPIError.unauthorized }
        var body = values
        body["shopId"] = id
        let endpoint = section == .subscriptions ? "subscriptions" : "shops"
        try await AdminAPI.shared.patch(endpoint, token: token, values: body)
        await load()
    }

    private func sendNotification(_ values: [String: Any]) async throws {
        guard let token = session.token else { throw AdminAPIError.unauthorized }
        try await AdminAPI.shared.sendNotification(token: token, values: values)
        await load()
    }
}
