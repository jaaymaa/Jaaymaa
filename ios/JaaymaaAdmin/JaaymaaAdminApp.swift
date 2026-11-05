import SwiftUI
import Combine
import Security

private enum JaaymaStyle {
    static let ink = Color(red: 15 / 255, green: 30 / 255, blue: 61 / 255)
    static let sun = Color(red: 1, green: 200 / 255, blue: 61 / 255)
    static let hibiscus = Color(red: 200 / 255, green: 38 / 255, blue: 90 / 255)
    static let paper = Color(red: 1, green: 251 / 255, blue: 242 / 255)
    static let muted = Color(red: 92 / 255, green: 104 / 255, blue: 130 / 255)
    static let green = Color(red: 15 / 255, green: 124 / 255, blue: 102 / 255)
}

@main
struct JaaymaaAdminApp: App {
    @StateObject private var session = AdminSessionStore()

    var body: some Scene {
        WindowGroup {
            AdminRootView()
                .environmentObject(session)
                .preferredColorScheme(.light)
        }
    }
}

@MainActor
final class AdminSessionStore: ObservableObject {
    @Published private(set) var token: String? = SecureTokenStore.read()
    @Published private(set) var phone: String?

    var isSignedIn: Bool { token != nil }

    func signIn(phone: String, password: String) async throws {
        let response: LoginResponse = try await AdminAPI.shared.login(phone: phone, password: password)
        guard SecureTokenStore.save(response.accessToken) else {
            throw AdminAPIError.message("La session n’a pas pu être enregistrée sur cet appareil.")
        }
        self.token = response.accessToken
        self.phone = response.admin.phone
    }

    func signOut() async {
        if let token {
            try? await AdminAPI.shared.logout(token: token)
        }
        SecureTokenStore.clear()
        token = nil
        phone = nil
    }

    func invalidate() {
        SecureTokenStore.clear()
        token = nil
        phone = nil
    }
}

private enum SecureTokenStore {
    private static let service = "sn.jaayma.admin.session"
    private static let account = "admin-bearer-token"

    static func read() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func save(_ token: String) -> Bool {
        let key = [kSecClass as String: kSecClassGenericPassword,
                   kSecAttrService as String: service,
                   kSecAttrAccount as String: account]
        SecItemDelete(key as CFDictionary)
        var item = key
        item[kSecValueData as String] = Data(token.utf8)
        item[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        return SecItemAdd(item as CFDictionary, nil) == errSecSuccess
    }

    static func clear() {
        SecItemDelete([kSecClass as String: kSecClassGenericPassword,
                       kSecAttrService as String: service,
                       kSecAttrAccount as String: account] as CFDictionary)
    }
}

private struct LoginResponse: Decodable {
    let accessToken: String
    let admin: AdminIdentity
    struct AdminIdentity: Decodable { let phone: String; let name: String }
}

private struct APIErrorPayload: Decodable { let error: String? }

private enum AdminAPIError: LocalizedError {
    case message(String)
    case unauthorized
    case accessRevoked
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .message(let value): return value
        case .unauthorized: return "Ta session a expiré. Reconnecte-toi."
        case .accessRevoked: return "Ce compte n’a plus accès à l’administration."
        case .invalidResponse: return "Réponse inattendue du serveur. Réessaie."
        }
    }
}

private struct AdminAPI {
    static let shared = AdminAPI()
    private let baseURL = URL(string: "https://jaayma-sn.jaayma.workers.dev")!

    func login(phone: String, password: String) async throws -> LoginResponse {
        var request = URLRequest(url: baseURL.appending(path: "/api/admin/ios/auth"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["phone": phone, "password": password])
        return try await send(request)
    }

    func logout(token: String) async throws {
        var request = URLRequest(url: baseURL.appending(path: "/api/admin/ios/auth"))
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let _: EmptyResponse = try await send(request)
    }

    func get<T: Decodable>(_ section: AdminSection, token: String, page: Int = 1, query: String = "") async throws -> T {
        var components = URLComponents(url: baseURL.appending(path: "/api/admin/ios/\(section.endpoint)"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "page", value: String(page))]
        if !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            components.queryItems?.append(URLQueryItem(name: "q", value: query))
        }
        var request = URLRequest(url: components.url!)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        return try await send(request)
    }

    func updateSettings(token: String, values: [String: Any]) async throws {
        try await patch("settings", token: token, values: values)
    }

    func patch(_ section: String, token: String, values: [String: Any]) async throws {
        var request = URLRequest(url: baseURL.appending(path: "/api/admin/ios/\(section)"))
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: values)
        let _: EmptyResponse = try await send(request)
    }

    func sendNotification(token: String, values: [String: Any]) async throws {
        var request = URLRequest(url: baseURL.appending(path: "/api/admin/ios/notifications"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: values)
        let _: EmptyResponse = try await send(request)
    }

    func send<T: Decodable>(_ request: URLRequest) async throws -> T {
        var request = request
        request.timeoutInterval = 25
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw AdminAPIError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            let message = try? JSONDecoder().decode(APIErrorPayload.self, from: data).error
            if http.statusCode == 401 { throw AdminAPIError.unauthorized }
            if http.statusCode == 403 { throw AdminAPIError.accessRevoked }
            throw AdminAPIError.message(message ?? "Impossible de joindre Jaaymaa pour le moment.")
        }
        if T.self == EmptyResponse.self, data.isEmpty {
            return EmptyResponse() as! T
        }
        do { return try JSONDecoder().decode(T.self, from: data) }
        catch { throw AdminAPIError.invalidResponse }
    }
}

private struct EmptyResponse: Decodable {}

private enum AdminSection: String, CaseIterable, Identifiable, Hashable {
    case overview, shops, subscriptions, accounts, orders, analytics, notifications, settings

    var id: String { rawValue }
    var endpoint: String { rawValue }
    var title: String {
        switch self {
        case .overview: return "Vue d’ensemble"
        case .shops: return "Boutiques"
        case .subscriptions: return "Abonnements"
        case .accounts: return "Comptes vendeurs"
        case .orders: return "Commandes"
        case .analytics: return "Analytics"
        case .notifications: return "Notifications"
        case .settings: return "Réglages"
        }
    }
    var symbol: String {
        switch self {
        case .overview: return "square.grid.2x2.fill"
        case .shops: return "storefront.fill"
        case .subscriptions: return "creditcard.fill"
        case .accounts: return "person.2.fill"
        case .orders: return "bag.fill"
        case .analytics: return "chart.bar.fill"
        case .notifications: return "bell.fill"
        case .settings: return "slider.horizontal.3"
        }
    }
}

private struct AdminRootView: View {
    @EnvironmentObject private var session: AdminSessionStore
    var body: some View {
        Group {
            if session.isSignedIn { AdminShellView() }
            else { AdminLoginView() }
        }
        .animation(.snappy(duration: 0.25), value: session.isSignedIn)
    }
}

private struct AdminLoginView: View {
    @EnvironmentObject private var session: AdminSessionStore
    @State private var phone = ""
    @State private var password = ""
    @State private var message: String?
    @State private var isLoading = false

    var body: some View {
        ZStack {
            LinearGradient(colors: [JaaymaStyle.ink, Color(red: 31 / 255, green: 53 / 255, blue: 91 / 255)], startPoint: .topLeading, endPoint: .bottomTrailing).ignoresSafeArea()
            VStack(alignment: .leading, spacing: 24) {
                HStack(spacing: 12) {
                    BrandMark(size: 52)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Jaaymaa").font(.system(size: 24, weight: .black, design: .rounded))
                        Text("ADMINISTRATION").font(.caption2.weight(.bold)).tracking(1.8).foregroundStyle(JaaymaStyle.sun)
                    }.foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text("Ton espace de pilotage").font(.system(size: 32, weight: .bold, design: .rounded)).foregroundStyle(.white)
                    Text("Connecte-toi avec un numéro autorisé pour gérer Jaaymaa.").font(.subheadline).foregroundStyle(.white.opacity(0.72))
                }
                VStack(spacing: 14) {
                    TextField("Numéro de téléphone", text: $phone)
                        .keyboardType(.phonePad).textContentType(.telephoneNumber)
                        .padding(16).background(.white, in: RoundedRectangle(cornerRadius: 16))
                    SecureField("Mot de passe", text: $password)
                        .textContentType(.password)
                        .padding(16).background(.white, in: RoundedRectangle(cornerRadius: 16))
                    if let message {
                        Text(message).font(.footnote.weight(.semibold)).foregroundStyle(JaaymaStyle.hibiscus).frame(maxWidth: .infinity, alignment: .leading)
                    }
                    Button(action: signIn) {
                        HStack(spacing: 10) {
                            if isLoading { ProgressView().tint(JaaymaStyle.ink) }
                            Text(isLoading ? "Connexion…" : "Se connecter").fontWeight(.bold)
                        }
                        .frame(maxWidth: .infinity).padding(.vertical, 16)
                        .foregroundStyle(JaaymaStyle.ink).background(JaaymaStyle.sun, in: Capsule())
                    }
                    .disabled(isLoading || phone.isEmpty || password.isEmpty)
                }
                .padding(18)
                .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 26))
                .overlay(RoundedRectangle(cornerRadius: 26).stroke(JaaymaStyle.sun.opacity(0.75), lineWidth: 1))
                Spacer(minLength: 0)
                Text("Accès réservé aux comptes administrateurs Jaaymaa.").font(.caption).foregroundStyle(.white.opacity(0.6)).frame(maxWidth: .infinity, alignment: .center)
            }
            .padding(24).frame(maxWidth: 560).frame(maxWidth: .infinity)
        }
    }

    private func signIn() {
        isLoading = true; message = nil
        Task {
            do { try await session.signIn(phone: phone, password: password) }
            catch { message = error.localizedDescription }
            isLoading = false
        }
    }
}

private struct AdminShellView: View {
    @EnvironmentObject private var session: AdminSessionStore
    @Environment(\.horizontalSizeClass) private var sizeClass
    @State private var selection: AdminSection = .overview

    var body: some View {
        Group {
            if sizeClass == .regular {
                NavigationSplitView {
                    List(selection: $selection) {
                        Section("Plateforme") {
                            ForEach(AdminSection.allCases) { section in
                                Label(section.title, systemImage: section.symbol).tag(section)
                            }
                        }
                    }
                    .scrollContentBackground(.hidden)
                    .background(JaaymaStyle.paper)
                    .navigationTitle("Jaaymaa Admin")
                    .toolbar { ToolbarItem(placement: .topBarTrailing) { signOutButton } }
                } detail: {
                    NavigationStack { AdminSectionView(section: selection) }
                }
                .tint(JaaymaStyle.ink)
            } else {
                TabView(selection: $selection) {
                    tab(.overview)
                    tab(.shops)
                    tab(.orders)
                    tab(.accounts)
                    NavigationStack { AdminMoreView() }
                        .tabItem { Label("Plus", systemImage: "ellipsis.circle") }
                        .tag(AdminSection.settings)
                }
                .tint(JaaymaStyle.ink)
            }
        }
        .toolbarBackground(.visible, for: .tabBar)
    }

    private var signOutButton: some View {
        Button { Task { await session.signOut() } } label: { Image(systemName: "rectangle.portrait.and.arrow.right") }
            .accessibilityLabel("Se déconnecter")
    }

    private func tab(_ section: AdminSection) -> some View {
        NavigationStack { AdminSectionView(section: section) }
            .tabItem { Label(shortTitle(section), systemImage: section.symbol) }
            .tag(section)
    }

    private func shortTitle(_ section: AdminSection) -> String {
        switch section { case .overview: return "Accueil"; case .shops: return "Boutiques"; case .orders: return "Commandes"; default: return section.title }
    }
}

private struct AdminMoreView: View {
    @EnvironmentObject private var session: AdminSessionStore
    private let sections: [AdminSection] = [.subscriptions, .analytics, .notifications, .settings]

    var body: some View {
        List {
            Section {
                ForEach(sections) { section in
                    NavigationLink {
                        AdminSectionView(section: section)
                    } label: {
                        Label(section.title, systemImage: section.symbol).padding(.vertical, 5)
                    }
                }
            } header: { Text("Gestion") }
            Section {
                Button(role: .destructive) { Task { await session.signOut() } } label: {
                    Label("Se déconnecter", systemImage: "rectangle.portrait.and.arrow.right")
                }
            }
        }
        .navigationTitle("Plus")
        .scrollContentBackground(.hidden)
        .background(JaaymaStyle.paper)
    }
}

private struct AdminSectionView: View {
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
                        Image(systemName: "magnifyingglass").foregroundStyle(JaaymaStyle.muted)
                        TextField("Rechercher…", text: $query)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .onSubmit { page = 1; Task { await load() } }
                        Button("Filtrer") { page = 1; Task { await load() } }
                            .font(.caption.weight(.bold)).foregroundStyle(JaaymaStyle.ink)
                    }
                    .padding(13).background(.white.opacity(0.75), in: RoundedRectangle(cornerRadius: 15))
                }
                if loading && data == nil { ProgressView("Chargement…").frame(maxWidth: .infinity).padding(40) }
                else if let errorMessage {
                    ContentUnavailableView("Chargement impossible", systemImage: "wifi.exclamationmark", description: Text(errorMessage))
                    Button("Réessayer") { Task { await load() } }.buttonStyle(.borderedProminent).tint(JaaymaStyle.ink)
                } else if let data {
                    content(data)
                    if let pageInfo = data.pageInfo {
                        HStack {
                            Button("Précédent") { page = max(1, page - 1); Task { await load() } }
                                .disabled(pageInfo.current <= 1)
                            Spacer()
                            Text("Page \(pageInfo.current) sur \(pageInfo.total)").font(.caption.weight(.semibold)).foregroundStyle(JaaymaStyle.muted)
                            Spacer()
                            Button("Suivante") { page = min(pageInfo.total, page + 1); Task { await load() } }
                                .disabled(pageInfo.current >= pageInfo.total)
                        }
                        .buttonStyle(.bordered).tint(JaaymaStyle.ink)
                    }
                }
            }
            .padding(.horizontal, 20).padding(.vertical, 18)
            .frame(maxWidth: 1100, alignment: .leading).frame(maxWidth: .infinity)
        }
        .background(JaaymaStyle.paper.ignoresSafeArea())
        .navigationTitle(section.title)
        .navigationBarTitleDisplayMode(.inline)
        .task(id: section) { page = 1; query = ""; await load() }
        .refreshable { await load() }
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 14) {
            BrandMark(size: 48)
            VStack(alignment: .leading, spacing: 3) {
                Text("CENTRE DE PILOTAGE").font(.caption2.weight(.heavy)).tracking(1.35).foregroundStyle(JaaymaStyle.hibiscus)
                Text(section.title).font(.system(size: 26, weight: .bold, design: .rounded)).foregroundStyle(JaaymaStyle.ink)
            }
            Spacer(minLength: 0)
            Image(systemName: section.symbol).font(.system(size: 16, weight: .bold)).foregroundStyle(JaaymaStyle.ink)
                .padding(12).glassEffect(.regular.tint(JaaymaStyle.sun.opacity(0.42)), in: Circle())
        }
        .padding(.bottom, 4)
    }

    @ViewBuilder private func content(_ data: AdminSectionData) -> some View {
        switch data {
        case .overview(let value): OverviewContent(value: value)
        case .shops(let value): ShopListContent(page: value, subscriptionsOnly: false, onUpdate: updateShop)
        case .subscriptions(let value): ShopListContent(page: value.shops, subscriptionsOnly: true, metrics: value.metrics, onUpdate: updateShop)
        case .accounts(let value): AccountListContent(page: value)
        case .orders(let value): OrderListContent(page: value)
        case .analytics(let value): AnalyticsContent(value: value)
        case .notifications(let value): NotificationContent(value: value, onSend: sendNotification)
        case .settings(let value): SettingsContent(value: value, onChange: updateSetting)
        }
    }

    private func load() async {
        guard let token = session.token else { return }
        loading = true; errorMessage = nil
        do { data = try await AdminAPI.shared.load(section, token: token, page: page, query: query) }
        catch AdminAPIError.unauthorized { session.invalidate() }
        catch AdminAPIError.accessRevoked { session.invalidate() }
        catch { errorMessage = error.localizedDescription }
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

private struct BrandMark: View {
    var size: CGFloat
    var body: some View {
        ZStack {
            JaaymaaTileShape().fill(JaaymaStyle.sun)
            JaaymaaJShape().stroke(JaaymaStyle.ink, style: StrokeStyle(lineWidth: size * 0.1, lineCap: .round, lineJoin: .round))
            Circle()
                .fill(JaaymaStyle.hibiscus)
                .frame(width: size * 0.125, height: size * 0.125)
                .position(x: size * 64 / 120, y: size * 28 / 120)
        }
        .frame(width: size, height: size)
        .overlay(JaaymaaTileShape().stroke(JaaymaStyle.ink, lineWidth: max(1, size * 0.03)))
        .shadow(color: JaaymaStyle.ink.opacity(0.16), radius: 6, y: 3)
        .accessibilityHidden(true)
    }
}

private struct JaaymaaTileShape: Shape {
    func path(in rect: CGRect) -> Path {
        func point(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
            CGPoint(x: rect.minX + rect.width * x / 120, y: rect.minY + rect.height * y / 120)
        }

        var path = Path()
        path.move(to: point(38, 4))
        path.addLine(to: point(82, 4))
        path.addCurve(to: point(116, 38), control1: point(100.8, 4), control2: point(116, 19.2))
        path.addLine(to: point(116, 82))
        path.addCurve(to: point(82, 116), control1: point(116, 100.8), control2: point(100.8, 116))
        path.addLine(to: point(10, 116))
        path.addCurve(to: point(4, 110), control1: point(6.7, 116), control2: point(4, 113.3))
        path.addLine(to: point(4, 38))
        path.addCurve(to: point(38, 4), control1: point(4, 19.2), control2: point(19.2, 4))
        path.closeSubpath()
        return path
    }
}

private struct JaaymaaJShape: Shape {
    func path(in rect: CGRect) -> Path {
        func point(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
            CGPoint(x: rect.minX + rect.width * x / 120, y: rect.minY + rect.height * y / 120)
        }

        var path = Path()
        path.move(to: point(64, 46))
        path.addLine(to: point(64, 76))
        path.addCurve(to: point(44, 97), control1: point(64, 90), control2: point(57, 97))
        return path
    }
}

private enum AdminSectionData {
    case overview(AdminOverview)
    case shops(AdminPage<AdminShop>)
    case subscriptions(AdminSubscriptions)
    case accounts(AdminPage<AdminAccount>)
    case orders(AdminPage<AdminOrder>)
    case analytics(AdminAnalytics)
    case notifications(AdminNotifications)
    case settings(AdminSettings)

    var pageInfo: (current: Int, total: Int)? {
        switch self {
        case .shops(let value): return (value.page, value.totalPages)
        case .subscriptions(let value): return (value.shops.page, value.shops.totalPages)
        case .accounts(let value): return (value.page, value.totalPages)
        case .orders(let value): return (value.page, value.totalPages)
        default: return nil
        }
    }
}

private extension AdminAPI {
    func load(_ section: AdminSection, token: String, page: Int, query: String) async throws -> AdminSectionData {
        switch section {
        case .overview: return .overview(try await get(section, token: token, page: page, query: query))
        case .shops: return .shops(try await get(section, token: token, page: page, query: query))
        case .subscriptions: return .subscriptions(try await get(section, token: token, page: page, query: query))
        case .accounts: return .accounts(try await get(section, token: token, page: page, query: query))
        case .orders: return .orders(try await get(section, token: token, page: page, query: query))
        case .analytics:
            return .analytics(try await get(section, token: token, page: page, query: query))
        case .notifications: return .notifications(try await get(section, token: token, page: page, query: query))
        case .settings: return .settings(try await get(section, token: token, page: page, query: query))
        }
    }

}

private struct AdminOverview: Decodable {
    let metrics: AdminMetrics
    let recentOrders: [AdminRecentOrder]
}
private struct AdminMetrics: Decodable {
    let totalShops: Int; let activeShops: Int; let suspendedShops: Int; let sellers: Int
    let activeProducts: Int; let totalOrders: Int; let newOrders: Int; let paidOrders: Int
    let revenue: Int; let todayOrders: Int; let revenueToday: Int
    let proShops: Int; let proPlusShops: Int; let expiredProShops: Int; let expiredProPlusShops: Int
}
private struct AdminRecentOrder: Decodable, Identifiable {
    let id: String; let reference: String; let customerName: String; let total: Int
    let shop: ShopSummary
}
private struct ShopSummary: Decodable { let name: String; let slug: String }
private struct AdminPage<T: Decodable>: Decodable {
    let items: [T]; let total: Int; let page: Int; let pageSize: Int; let totalPages: Int
}
private struct AdminShop: Decodable, Identifiable {
    let id: String; let name: String; let slug: String; let plan: String; let planExpiresAt: String?
    let status: String; let createdAt: String; let owner: AdminOwner?; let counts: ShopCounts
    enum CodingKeys: String, CodingKey { case id, name, slug, plan, planExpiresAt, status, createdAt, owner; case counts = "_count" }
}
private struct AdminOwner: Decodable { let name: String?; let phone: String? }
private struct ShopCounts: Decodable { let products: Int; let orders: Int }
private struct AdminAccount: Decodable, Identifiable {
    let id: String; let name: String; let phone: String; let createdAt: String
    let shopCount: Int; let orderCount: Int; let shops: [AccountShop]
}
private struct AccountShop: Decodable, Identifiable { let id: String; let name: String; let slug: String; let plan: String; let status: String }
private struct AdminOrder: Decodable, Identifiable {
    let id: String; let reference: String; let customerName: String; let customerPhone: String
    let total: Int; let status: String; let paymentMethod: String; let paymentStatus: String
    let createdAt: String; let shop: ShopSummary; let counts: OrderCounts
    enum CodingKeys: String, CodingKey { case id, reference, customerName, customerPhone, total, status, paymentMethod, paymentStatus, createdAt, shop; case counts = "_count" }
}
private struct OrderCounts: Decodable { let items: Int }
private struct PlanMetrics: Decodable { let proShops: Int; let proPlusShops: Int; let expiredProShops: Int; let expiredProPlusShops: Int }
private struct AdminSubscriptions: Decodable { let metrics: PlanMetrics; let shops: AdminPage<AdminShop> }
private struct AdminAnalytics: Decodable {
    let status: String
    let propertyId: String?
    let rangeDays: Int?
    let message: String?
    let current: AnalyticsMetrics?
    let topPages: [AnalyticsPage]?
}
private struct AnalyticsMetrics: Decodable {
    let activeUsers: Int; let newUsers: Int; let sessions: Int; let pageViews: Int
    let purchases: Int; let revenue: Double
}
private struct AnalyticsPage: Decodable, Identifiable { let path: String; let title: String; let views: Int; let users: Int; var id: String { path } }
private struct AdminBroadcast: Decodable, Identifiable {
    let id: String; let title: String; let body: String; let url: String
    let targetCount: Int; let deliveredCount: Int; let failedCount: Int; let createdAt: String
}
private struct AdminNotifications: Decodable {
    let history: AdminPage<AdminBroadcast>; let subscriberCount: Int; let pushConfigured: Bool
}
private struct AdminSettings: Decodable {
    let databaseConnected: Bool; let adminCount: Int; let pushSubscriptions: Int; let pushConfigured: Bool
    let explorerEnabled: Bool; let maintenanceEnabled: Bool; let proPriceXof: Int; let proPlusPriceXof: Int
}

private extension AdminSection {
    var isSearchable: Bool { [.shops, .subscriptions, .accounts, .orders].contains(self) }
}

private struct OverviewContent: View {
    let value: AdminOverview
    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            MetricTile(title: "Boutiques", value: "\(value.metrics.totalShops)", note: "\(value.metrics.activeShops) en ligne", symbol: "storefront.fill", tint: JaaymaStyle.sun)
            MetricTile(title: "Vendeurs", value: "\(value.metrics.sellers)", note: "\(value.metrics.activeProducts) produits actifs", symbol: "person.2.fill", tint: Color(red: 246 / 255, green: 195 / 255, blue: 210 / 255))
            MetricTile(title: "Commandes", value: "\(value.metrics.totalOrders)", note: "\(value.metrics.newOrders) nouvelles", symbol: "bag.fill", tint: Color(red: 207 / 255, green: 239 / 255, blue: 230 / 255))
            MetricTile(title: "Ventes encaissées", value: formatFcfa(value.metrics.revenue), note: "\(formatFcfa(value.metrics.revenueToday)) aujourd’hui", symbol: "banknote.fill", tint: Color(red: 220 / 255, green: 229 / 255, blue: 1))
        }
        HStack(spacing: 12) {
            MiniStat(title: "Pro", value: value.metrics.proShops, color: JaaymaStyle.hibiscus)
            MiniStat(title: "Pro+", value: value.metrics.proPlusShops, color: JaaymaStyle.green)
            MiniStat(title: "À traiter", value: value.metrics.newOrders, color: JaaymaStyle.ink)
        }
        SectionCard(title: "Commandes récentes", subtitle: "Activité de la plateforme") {
            if value.recentOrders.isEmpty { Text("Aucune commande pour le moment.").font(.subheadline).foregroundStyle(JaaymaStyle.muted) }
            else {
                ForEach(value.recentOrders) { order in
                    HStack(spacing: 12) {
                        Image(systemName: "bag").foregroundStyle(JaaymaStyle.ink).padding(11).background(JaaymaStyle.sun.opacity(0.35), in: RoundedRectangle(cornerRadius: 12))
                        VStack(alignment: .leading, spacing: 3) { Text(order.customerName).font(.subheadline.weight(.bold)); Text("\(order.shop.name) · \(order.reference)").font(.caption).foregroundStyle(JaaymaStyle.muted) }
                        Spacer(); Text(formatFcfa(order.total)).font(.subheadline.weight(.heavy)).foregroundStyle(JaaymaStyle.ink)
                    }.padding(.vertical, 4)
                }
            }
        }
    }
}

private struct MetricTile: View {
    let title: String; let value: String; let note: String; let symbol: String; let tint: Color
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack { Text(title.uppercased()).font(.caption2.weight(.heavy)).tracking(0.65).foregroundStyle(JaaymaStyle.muted); Spacer(); Image(systemName: symbol).font(.footnote.weight(.bold)).padding(9).background(tint, in: RoundedRectangle(cornerRadius: 11)) }
            Text(value).font(.system(size: 26, weight: .black, design: .rounded)).foregroundStyle(JaaymaStyle.ink).lineLimit(1).minimumScaleFactor(0.7)
            Text(note).font(.caption2.weight(.medium)).foregroundStyle(JaaymaStyle.muted).lineLimit(1)
        }
        .padding(15).frame(maxWidth: .infinity, alignment: .leading)
        .background(.white.opacity(0.78), in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(JaaymaStyle.ink.opacity(0.08), lineWidth: 1))
    }
}

private struct MiniStat: View {
    let title: String; let value: Int; let color: Color
    var body: some View { VStack(alignment: .leading, spacing: 4) { Text("\(value)").font(.title3.weight(.black)).foregroundStyle(color); Text(title).font(.caption2.weight(.semibold)).foregroundStyle(JaaymaStyle.muted) }.frame(maxWidth: .infinity, alignment: .leading).padding(13).background(.white.opacity(0.68), in: RoundedRectangle(cornerRadius: 15)) }
}

private struct SectionCard<Content: View>: View {
    let title: String
    var subtitle: String?
    let content: Content

    init(title: String, subtitle: String? = nil, @ViewBuilder content: () -> Content) {
        self.title = title
        self.subtitle = subtitle
        self.content = content()
    }

    var body: some View { VStack(alignment: .leading, spacing: 13) { VStack(alignment: .leading, spacing: 3) { Text(title).font(.headline.weight(.bold)).foregroundStyle(JaaymaStyle.ink); if let subtitle { Text(subtitle).font(.caption).foregroundStyle(JaaymaStyle.muted) } }; content }.padding(17).frame(maxWidth: .infinity, alignment: .leading).background(.white.opacity(0.8), in: RoundedRectangle(cornerRadius: 22)).overlay(RoundedRectangle(cornerRadius: 22).stroke(JaaymaStyle.ink.opacity(0.07), lineWidth: 1)) }
}

private struct ShopListContent: View {
    let page: AdminPage<AdminShop>; var subscriptionsOnly = false; var metrics: PlanMetrics? = nil
    let onUpdate: (String, [String: Any]) async throws -> Void
    @State private var actionError: String?
    var body: some View {
        if let metrics {
            HStack(spacing: 10) { MiniStat(title: "Pro actif", value: metrics.proShops, color: JaaymaStyle.hibiscus); MiniStat(title: "Pro+ actif", value: metrics.proPlusShops, color: JaaymaStyle.green); MiniStat(title: "Expirés", value: metrics.expiredProShops + metrics.expiredProPlusShops, color: JaaymaStyle.muted) }
        }
        SectionCard(title: subscriptionsOnly ? "Forfaits des boutiques" : "Toutes les boutiques", subtitle: "\(page.total) résultats") {
            if page.items.isEmpty { Text("Aucune boutique à afficher.").foregroundStyle(JaaymaStyle.muted) }
            ForEach(page.items) { shop in
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: "storefront").foregroundStyle(JaaymaStyle.ink).padding(11).background(JaaymaStyle.sun.opacity(0.4), in: RoundedRectangle(cornerRadius: 12))
                    VStack(alignment: .leading, spacing: 4) {
                        Text(shop.name).font(.subheadline.weight(.bold)).foregroundStyle(JaaymaStyle.ink)
                        Text(shop.owner?.name ?? shop.owner?.phone ?? shop.slug).font(.caption).foregroundStyle(JaaymaStyle.muted)
                        Text("\(shop.plan.uppercased()) · \(statusLabel(shop.status)) · \(shop.counts.orders) commandes").font(.caption2.weight(.semibold)).foregroundStyle(JaaymaStyle.green)
                    }
                    Spacer(minLength: 0)
                    Menu {
                        Section("Statut de la boutique") {
                            Button("Mettre en ligne") { update(shop, ["status": "ACTIVE"]) }
                            Button("Suspendre") { update(shop, ["status": "SUSPENDED"]) }
                            Button("Remettre en brouillon") { update(shop, ["status": "DRAFT"]) }
                        }
                        Section("Formule") {
                            Button("Gratuit") { update(shop, ["plan": "free"]) }
                            Button("Pro · 30 jours") { update(shop, ["plan": "pro"]) }
                            Button("Pro+ · 30 jours") { update(shop, ["plan": "pro_plus"]) }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle").font(.title3).foregroundStyle(JaaymaStyle.ink).padding(.leading, 5)
                    }
                }.padding(.vertical, 4)
            }
            if let actionError { Text(actionError).font(.caption).foregroundStyle(JaaymaStyle.hibiscus) }
        }
    }

    private func update(_ shop: AdminShop, _ values: [String: Any]) {
        Task { do { try await onUpdate(shop.id, values); actionError = nil } catch { actionError = error.localizedDescription } }
    }
}

private struct AccountListContent: View {
    let page: AdminPage<AdminAccount>
    var body: some View {
        SectionCard(title: "Comptes vendeurs", subtitle: "\(page.total) comptes") {
            if page.items.isEmpty { Text("Aucun compte à afficher.").foregroundStyle(JaaymaStyle.muted) }
            ForEach(page.items) { account in
                HStack(spacing: 12) {
                    Image(systemName: "person.crop.circle.fill").font(.title2).foregroundStyle(JaaymaStyle.hibiscus)
                    VStack(alignment: .leading, spacing: 3) { Text(account.name.isEmpty ? "Vendeur" : account.name).font(.subheadline.weight(.bold)); Text(account.phone).font(.caption.monospaced()).foregroundStyle(JaaymaStyle.muted); Text("\(account.shopCount) boutique(s) · \(account.orderCount) commande(s)").font(.caption2).foregroundStyle(JaaymaStyle.muted) }
                    Spacer()
                }.padding(.vertical, 4)
            }
        }
    }
}

private struct OrderListContent: View {
    let page: AdminPage<AdminOrder>
    var body: some View {
        SectionCard(title: "Commandes récentes", subtitle: "\(page.total) commandes") {
            if page.items.isEmpty { Text("Aucune commande à afficher.").foregroundStyle(JaaymaStyle.muted) }
            ForEach(page.items) { order in
                HStack(spacing: 11) {
                    Image(systemName: "bag").foregroundStyle(JaaymaStyle.ink).padding(10).background(JaaymaStyle.sun.opacity(0.35), in: RoundedRectangle(cornerRadius: 11))
                    VStack(alignment: .leading, spacing: 3) { Text(order.reference).font(.caption.weight(.heavy)); Text("\(order.customerName) · \(order.shop.name)").font(.caption).foregroundStyle(JaaymaStyle.muted); Text("\(statusLabel(order.status)) · \(order.paymentStatus)").font(.caption2.weight(.semibold)).foregroundStyle(JaaymaStyle.green) }
                    Spacer(); Text(formatFcfa(order.total)).font(.caption.weight(.heavy))
                }.padding(.vertical, 4)
            }
        }
    }
}

private struct NotificationContent: View {
    let value: AdminNotifications
    let onSend: ([String: Any]) async throws -> Void
    @State private var title = ""
    @State private var bodyText = ""
    @State private var sending = false
    @State private var resultMessage: String?
    var body: some View {
        SectionCard(title: "Nouvelle annonce", subtitle: "Envoi aux vendeurs ayant activé les notifications") {
            TextField("Titre", text: $title).textFieldStyle(.roundedBorder)
            TextField("Message", text: $bodyText, axis: .vertical).lineLimit(3...5).textFieldStyle(.roundedBorder)
            Button { send() } label: { Label(sending ? "Envoi…" : "Envoyer la notification", systemImage: "paperplane.fill").frame(maxWidth: .infinity) }
                .buttonStyle(.borderedProminent).tint(JaaymaStyle.ink).disabled(sending || title.count < 3 || bodyText.count < 3 || !value.pushConfigured)
            if let resultMessage { Text(resultMessage).font(.caption.weight(.semibold)).foregroundStyle(JaaymaStyle.muted) }
        }
        SectionCard(title: "Notifications vendeurs", subtitle: "Historique et état du service push") {
            Label("\(value.subscriberCount) appareils abonnés", systemImage: "iphone.gen3")
            Label(value.pushConfigured ? "Notifications prêtes" : "Configuration push incomplète", systemImage: value.pushConfigured ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                .foregroundStyle(value.pushConfigured ? JaaymaStyle.green : JaaymaStyle.hibiscus)
            ForEach(value.history.items) { item in
                VStack(alignment: .leading, spacing: 4) { Text(item.title).font(.subheadline.weight(.bold)); Text(item.body).font(.caption).foregroundStyle(JaaymaStyle.muted); Text("\(item.deliveredCount) envoyées · \(item.failedCount) échecs").font(.caption2.weight(.semibold)).foregroundStyle(JaaymaStyle.green) }.padding(.vertical, 5)
            }
        }
    }

    private func send() {
        sending = true; resultMessage = nil
        Task {
            do {
                try await onSend(["title": title, "body": bodyText, "url": "/espace/commandes"])
                title = ""; bodyText = ""; resultMessage = "Notification envoyée."
            } catch { resultMessage = error.localizedDescription }
            sending = false
        }
    }
}

private struct SettingsContent: View {
    let value: AdminSettings
    let onChange: ([String: Any]) async throws -> Void
    @State private var explorerEnabled: Bool
    @State private var maintenanceEnabled: Bool
    @State private var proPriceText: String
    @State private var proPlusPriceText: String
    @State private var message: String?

    init(value: AdminSettings, onChange: @escaping ([String: Any]) async throws -> Void) {
        self.value = value; self.onChange = onChange
        _explorerEnabled = State(initialValue: value.explorerEnabled)
        _maintenanceEnabled = State(initialValue: value.maintenanceEnabled)
        _proPriceText = State(initialValue: String(value.proPriceXof))
        _proPlusPriceText = State(initialValue: String(value.proPlusPriceXof))
    }

    var body: some View {
        SectionCard(title: "État de la plateforme", subtitle: "Les modifications sont appliquées au site") {
            Toggle("Explorer visible", isOn: $explorerEnabled).tint(JaaymaStyle.green).onChange(of: explorerEnabled) { _, enabled in save(["explorerEnabled": enabled]) }
            Toggle("Mode maintenance", isOn: $maintenanceEnabled).tint(JaaymaStyle.hibiscus).onChange(of: maintenanceEnabled) { _, enabled in save(["maintenanceEnabled": enabled]) }
            Divider()
            Label("Base de données : \(value.databaseConnected ? "connectée" : "indisponible")", systemImage: "externaldrive.fill").font(.subheadline)
            Label("\(value.adminCount) administrateur(s) autorisé(s)", systemImage: "person.badge.key.fill").font(.subheadline)
            Label("Push : \(value.pushSubscriptions) appareil(s)", systemImage: "bell.badge.fill").font(.subheadline)
            if let message { Text(message).font(.caption.weight(.semibold)).foregroundStyle(JaaymaStyle.hibiscus) }
        }
        SectionCard(title: "Tarifs d’abonnement", subtitle: "Montants en FCFA") {
            TextField("Tarif Pro", text: $proPriceText).keyboardType(.numberPad).textFieldStyle(.roundedBorder)
            TextField("Tarif Pro+", text: $proPlusPriceText).keyboardType(.numberPad).textFieldStyle(.roundedBorder)
            Button("Enregistrer les tarifs") {
                guard let pro = Int(proPriceText), let proPlus = Int(proPlusPriceText) else { message = "Saisis des montants entiers en FCFA."; return }
                save(["proPriceXof": pro, "proPlusPriceXof": proPlus])
            }.buttonStyle(.borderedProminent).tint(JaaymaStyle.ink)
            Label("Pro · \(formatFcfa(value.proPriceXof))", systemImage: "creditcard")
            Label("Pro+ · \(formatFcfa(value.proPlusPriceXof))", systemImage: "sparkles")
        }
    }

    private func save(_ values: [String: Any]) {
        Task { do { try await onChange(values); message = "Réglage enregistré." } catch { message = error.localizedDescription } }
    }
}

private struct AnalyticsContent: View {
    let value: AdminAnalytics
    var body: some View {
        if value.status == "ready", let current = value.current {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                MetricTile(title: "Visiteurs actifs", value: "\(current.activeUsers)", note: "Sur \(value.rangeDays ?? 28) jours", symbol: "person.fill", tint: JaaymaStyle.sun)
                MetricTile(title: "Sessions", value: "\(current.sessions)", note: "\(current.newUsers) nouveaux visiteurs", symbol: "waveform.path", tint: Color(red: 207 / 255, green: 239 / 255, blue: 230 / 255))
                MetricTile(title: "Pages vues", value: "\(current.pageViews)", note: "Toutes pages confondues", symbol: "eye.fill", tint: Color(red: 220 / 255, green: 229 / 255, blue: 1))
                MetricTile(title: "Achats suivis", value: "\(current.purchases)", note: formatFcfa(Int(current.revenue)), symbol: "cart.fill", tint: Color(red: 246 / 255, green: 195 / 255, blue: 210 / 255))
            }
            SectionCard(title: "Pages les plus consultées") {
                ForEach(value.topPages ?? []) { page in
                    HStack { VStack(alignment: .leading) { Text(page.title.isEmpty ? page.path : page.title).font(.subheadline.weight(.bold)); Text(page.path).font(.caption).foregroundStyle(JaaymaStyle.muted) }; Spacer(); Text("\(page.views)").font(.headline.weight(.heavy)) }.padding(.vertical, 4)
                }
            }
        } else {
            InfoCard(title: value.status == "setup_required" ? "Analytics à configurer" : "Analytics indisponible", detail: value.message ?? "Vérifie la configuration de Google Analytics dans les réglages de la plateforme.", symbol: "chart.bar.xaxis")
        }
    }
}

private struct InfoCard: View {
    let title: String; let detail: String; let symbol: String
    var body: some View { SectionCard(title: title) { Label(detail, systemImage: symbol).font(.subheadline).foregroundStyle(JaaymaStyle.muted) } }
}

private func formatFcfa(_ amount: Int) -> String {
    let formatter = NumberFormatter(); formatter.numberStyle = .decimal; formatter.locale = Locale(identifier: "fr_FR")
    return "\(formatter.string(from: NSNumber(value: amount)) ?? String(amount)) FCFA"
}

private func statusLabel(_ value: String) -> String {
    switch value { case "ACTIVE": return "En ligne"; case "DRAFT": return "Brouillon"; case "SUSPENDED": return "Suspendue"; case "NEW": return "Nouvelle"; case "CONFIRMED": return "Confirmée"; case "PREPARING": return "En préparation"; case "OUT_FOR_DELIVERY": return "En livraison"; case "DELIVERED": return "Livrée"; case "CANCELLED": return "Annulée"; default: return value }
}
