import Foundation

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

