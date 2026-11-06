import Foundation

// MARK: - Auth Models
struct LoginResponse: Decodable {
    let accessToken: String
    let admin: AdminIdentity

    struct AdminIdentity: Decodable {
        let phone: String
        let name: String
    }
}

// MARK: - Pagination
struct AdminPage<T: Decodable>: Decodable {
    let items: [T]
    let total: Int
    let page: Int
    let pageSize: Int
    let totalPages: Int
}

// MARK: - Overview
struct AdminOverview: Decodable {
    let metrics: AdminMetrics
    let recentOrders: [AdminRecentOrder]
}

struct AdminMetrics: Decodable {
    let totalShops: Int
    let activeShops: Int
    let suspendedShops: Int
    let sellers: Int
    let activeProducts: Int
    let totalOrders: Int
    let newOrders: Int
    let paidOrders: Int
    let revenue: Int
    let todayOrders: Int
    let revenueToday: Int
    let proShops: Int
    let proPlusShops: Int
    let expiredProShops: Int
    let expiredProPlusShops: Int
}

struct AdminRecentOrder: Decodable, Identifiable {
    let id: String
    let reference: String
    let customerName: String
    let total: Int
    let shop: ShopSummary
}

struct ShopSummary: Decodable {
    let name: String
    let slug: String
}

// MARK: - Shops
struct AdminShop: Decodable, Identifiable {
    let id: String
    let name: String
    let slug: String
    let logoUrl: String?
    let plan: String
    let planExpiresAt: String?
    let status: String
    let createdAt: String
    let owner: AdminOwner?
    let counts: ShopCounts

    enum CodingKeys: String, CodingKey {
        case id, name, slug, logoUrl, plan, planExpiresAt, status, createdAt, owner
        case counts = "_count"
    }
}

struct AdminOwner: Decodable {
    let name: String?
    let phone: String?
}

struct ShopCounts: Decodable {
    let products: Int
    let orders: Int
}

// MARK: - Subscriptions
struct PlanMetrics: Decodable {
    let proShops: Int
    let proPlusShops: Int
    let expiredProShops: Int
    let expiredProPlusShops: Int
}

struct AdminSubscriptions: Decodable {
    let metrics: PlanMetrics
    let shops: AdminPage<AdminShop>
}

// MARK: - Accounts
struct AdminAccount: Decodable, Identifiable {
    let id: String
    let name: String
    let phone: String
    let createdAt: String
    let shopCount: Int
    let orderCount: Int
    let shops: [AccountShop]
}

struct AccountShop: Decodable, Identifiable {
    let id: String
    let name: String
    let slug: String
    let plan: String
    let status: String
}

// MARK: - Orders
struct AdminOrder: Decodable, Identifiable {
    let id: String
    let reference: String
    let customerName: String
    let customerPhone: String
    let total: Int
    let status: String
    let paymentMethod: String
    let paymentStatus: String
    let createdAt: String
    let shop: ShopSummary
    let counts: OrderCounts

    enum CodingKeys: String, CodingKey {
        case id, reference, customerName, customerPhone, total, status, paymentMethod, paymentStatus, createdAt, shop
        case counts = "_count"
    }
}

struct OrderCounts: Decodable {
    let items: Int
}

// MARK: - Analytics
struct AdminAnalytics: Decodable {
    let status: String
    let propertyId: String?
    let rangeDays: Int?
    let message: String?
    let current: AnalyticsMetrics?
    let topPages: [AnalyticsPage]?
}

struct AnalyticsMetrics: Decodable {
    let activeUsers: Int
    let newUsers: Int
    let sessions: Int
    let pageViews: Int
    let purchases: Int
    let revenue: Double
}

struct AnalyticsPage: Decodable, Identifiable {
    let path: String
    let title: String
    let views: Int
    let users: Int
    var id: String { path }
}

// MARK: - Notifications
struct AdminBroadcast: Decodable, Identifiable {
    let id: String
    let title: String
    let body: String
    let url: String
    let targetCount: Int
    let deliveredCount: Int
    let failedCount: Int
    let createdAt: String
}

struct AdminNotifications: Decodable {
    let history: AdminPage<AdminBroadcast>
    let subscriberCount: Int
    let pushConfigured: Bool
}

// MARK: - Settings
struct AdminSettings: Decodable {
    let databaseConnected: Bool
    let adminCount: Int
    let pushSubscriptions: Int
    let pushConfigured: Bool
    let explorerEnabled: Bool
    let maintenanceEnabled: Bool
    let proPriceXof: Int
    let proPlusPriceXof: Int
}

// MARK: - Section Data Wrapper
enum AdminSectionData {
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

