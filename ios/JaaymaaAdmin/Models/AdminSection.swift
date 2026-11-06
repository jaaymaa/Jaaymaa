import Foundation

enum AdminTab: String, CaseIterable, Identifiable, Hashable {
    case overview = "overview"
    case shops = "shops"
    case accounts = "accounts"
    case orders = "orders"
    case more = "more"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .overview: return "Aperçu"
        case .shops: return "Boutiques"
        case .accounts: return "Comptes"
        case .orders: return "Commandes"
        case .more: return "Plus"
        }
    }

    var symbol: String {
        switch self {
        case .overview: return "square.grid.2x2.fill"
        case .shops: return "storefront.fill"
        case .accounts: return "person.2.fill"
        case .orders: return "bag.fill"
        case .more: return "ellipsis.circle"
        }
    }
}

enum AdminSection: String, CaseIterable, Identifiable, Hashable {
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

    var isSearchable: Bool {
        [.shops, .subscriptions, .accounts, .orders].contains(self)
    }
}

