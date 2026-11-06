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
                header

                if section.isSearchable {
                    HStack(spacing: 9) {
                        Image(systemName: "magnifyingglass")
                            .foregroundStyle(JaaymaStyle.muted)
                        TextField("Rechercher…", text: $query)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .onSubmit {
                                page = 1
                                Task { await load() }
                            }
                        Button("Filtrer") {
                            page = 1
                            Task { await load() }
                        }
                        .font(.caption.weight(.bold))
                        .foregroundStyle(JaaymaStyle.ink)
                    }
                    .padding(13)
                    .background(.white.opacity(0.75), in: RoundedRectangle(cornerRadius: 15))
                }

                if loading && data == nil {
                    ProgressView("Chargement…")
                        .frame(maxWidth: .infinity)
                        .padding(40)
                } else if let errorMessage {
                    ContentUnavailableView(
                        "Chargement impossible",
                        systemImage: "wifi.exclamationmark",
                        description: Text(errorMessage)
                    )
                    Button("Réessayer") {
                        Task { await load() }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(JaaymaStyle.ink)
                } else if let data {
                    content(data)
                    if let pageInfo = data.pageInfo {
                        HStack {
                            Button("Précédent") {
                                page = max(1, page - 1)
                                Task { await load() }
                            }
                            .disabled(pageInfo.current <= 1)

                            Spacer()

                            Text("Page \(pageInfo.current) sur \(pageInfo.total)")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(JaaymaStyle.muted)

                            Spacer()

                            Button("Suivante") {
                                page = min(pageInfo.total, page + 1)
                                Task { await load() }
                            }
                            .disabled(pageInfo.current >= pageInfo.total)
                        }
                        .buttonStyle(.bordered)
                        .tint(JaaymaStyle.ink)
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 18)
            .frame(maxWidth: 1100)
            .frame(maxWidth: .infinity)
        }
        .background(JaaymaStyle.paper.ignoresSafeArea())
        .navigationTitle(section.title)
        .navigationBarTitleDisplayMode(.inline)
        .task(id: section) {
            page = 1
            query = ""
            await load()
        }
        .refreshable {
            await load()
        }
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 14) {
            BrandMark(size: 44)
            VStack(alignment: .leading, spacing: 3) {
                Text("CENTRE DE PILOTAGE")
                    .font(.caption2.weight(.heavy))
                    .tracking(1.35)
                    .foregroundStyle(JaaymaStyle.hibiscus)
                Text(section.title)
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .foregroundStyle(JaaymaStyle.ink)
            }
            Spacer(minLength: 0)
            Image(systemName: section.symbol)
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(JaaymaStyle.ink)
                .frame(width: 44, height: 44)
                .background(JaaymaStyle.sun, in: RoundedRectangle(cornerRadius: 13))
                .overlay(RoundedRectangle(cornerRadius: 13).stroke(JaaymaStyle.ink.opacity(0.12), lineWidth: 1))
        }
        .padding(.bottom, 4)
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

