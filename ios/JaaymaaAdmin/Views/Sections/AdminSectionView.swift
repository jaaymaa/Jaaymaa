import SwiftUI

struct AdminSectionView: View {
    @EnvironmentObject private var session: AdminSessionStore
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let section: AdminSection
    @State private var data: AdminSectionData?
    @State private var errorMessage: String?
    @State private var loading = false
    @State private var query = ""
    @State private var page = 1

    var body: some View {
        Group {
            if section.isSearchable {
                sectionScrollView
                    .searchable(text: $query, prompt: "Nom, gérant ou identifiant")
                    .onSubmit(of: .search) {
                        page = 1
                        Task { await load() }
                    }
            } else {
                sectionScrollView
            }
        }
        .background(JaaymaStyle.night.ignoresSafeArea())
        .navigationTitle(section == .overview ? "Administration" : section.title)
        .navigationBarTitleDisplayMode(.large)
        .task(id: section) {
            page = 1
            query = ""
            await load()
        }
        .refreshable {
            await load()
        }
    }

    private var sectionScrollView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                AdminBrandHeader(
                    account: session.phone ?? "Compte administrateur",
                    isLoading: loading && data != nil
                ) {
                    Task { await session.signOut() }
                }

                if loading && data == nil {
                    VStack(spacing: 16) {
                        JaaymaLoader(variant: .main, size: 132, label: "Chargement des données")
                        Text("On prépare ton espace…")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(JaaymaStyle.paper.opacity(0.72))
                    }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 44)
                } else if let errorMessage {
                    SectionCard(
                        title: "Chargement interrompu",
                        subtitle: "Jaaymaa n’a pas pu actualiser cette page",
                        symbol: "wifi.exclamationmark",
                        accent: JaaymaStyle.hibiscus
                    ) {
                        Text(errorMessage)
                            .font(.subheadline)
                            .foregroundStyle(JaaymaStyle.muted)
                            .fixedSize(horizontal: false, vertical: true)

                        Button {
                            Task { await load() }
                        } label: {
                            Label("Réessayer", systemImage: "arrow.clockwise")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(JaaymaPrimaryButtonStyle())
                    }
                } else if let data {
                    content(data)
                    if let pageInfo = data.pageInfo, pageInfo.total > 1 {
                        HStack(spacing: 12) {
                            Button {
                                page = max(1, page - 1)
                                Task { await load() }
                            } label: {
                                Image(systemName: "chevron.left")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(pageInfo.current <= 1 ? JaaymaStyle.paper.opacity(0.35) : JaaymaStyle.sun)
                                    .frame(width: 38, height: 38)
                                    .background(JaaymaStyle.paper.opacity(0.08), in: Circle())
                            }
                            .buttonStyle(JaaymaInteractiveButtonStyle())
                            .disabled(pageInfo.current <= 1)
                            .accessibilityLabel("Page précédente")

                            Spacer()

                            VStack(spacing: 2) {
                                Text("PAGE \(pageInfo.current)")
                                    .font(.system(size: 11, weight: .bold, design: .rounded).monospacedDigit())
                                    .tracking(0.8)
                                    .foregroundStyle(JaaymaStyle.paper)
                                    .contentTransition(.numericText())
                                Text("sur \(pageInfo.total)")
                                    .font(.caption2.weight(.medium))
                                    .foregroundStyle(JaaymaStyle.paper.opacity(0.56))
                            }

                            Spacer()

                            Button {
                                page = min(pageInfo.total, page + 1)
                                Task { await load() }
                            } label: {
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(pageInfo.current >= pageInfo.total ? JaaymaStyle.paper.opacity(0.35) : JaaymaStyle.sun)
                                    .frame(width: 38, height: 38)
                                    .background(JaaymaStyle.paper.opacity(0.08), in: Circle())
                            }
                            .buttonStyle(JaaymaInteractiveButtonStyle())
                            .disabled(pageInfo.current >= pageInfo.total)
                            .accessibilityLabel("Page suivante")
                        }
                        .padding(.horizontal, 9)
                        .padding(.vertical, 7)
                        .background(JaaymaStyle.nightPanel.opacity(0.8), in: Capsule())
                        .animation(reduceMotion ? nil : .snappy(duration: 0.22), value: pageInfo.current)
                        .sensoryFeedback(.selection, trigger: page)
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 18)
            .frame(maxWidth: 1100)
            .frame(maxWidth: .infinity)
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

