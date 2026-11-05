import Foundation

enum AdminSection: String, CaseIterable, Identifiable, Hashable {
    case overview, shops, accounts, orders, subscriptions, analytics, notifications, settings

    var id: String { rawValue }
    var endpoint: String { rawValue }

    var title: String {
        switch self {
        case .overview: return "Vue d’ensemble"
        case .shops: return "Boutiques"
        case .accounts: return "Comptes vendeurs"
        case .orders: return "Commandes"
        case .subscriptions: return "Abonnements Pro"
        case .analytics: return "Google Analytics"
        case .notifications: return "Notifications push"
        case .settings: return "Réglages"
        }
    }

    var shortTitle: String {
        switch self {
        case .overview: return "Aperçu"
        case .shops: return "Boutiques"
        case .accounts: return "Comptes"
        case .orders: return "Commandes"
        case .subscriptions: return "Abonnements"
        case .analytics: return "Analytics"
        case .notifications: return "Alertes"
        case .settings: return "Réglages"
        }
    }

    var eyebrow: String {
        switch self {
        case .overview: return "Centre de pilotage"
        case .shops: return "Gestion du catalogue de vendeurs"
        case .accounts: return "Commerçants Jaaymaa"
        case .orders: return "Suivi des ventes"
        case .subscriptions: return "Offre commerciale"
        case .analytics: return "Performances & audience"
        case .notifications: return "Communication vendeurs"
        case .settings: return "Configuration de la plateforme"
        }
    }

    var description: String {
        switch self {
        case .overview:
            return "Les indicateurs clés et les dernières activités de la plateforme Jaaymaa."
        case .shops:
            return "Retrouvez toutes les boutiques, y compris les brouillons et les boutiques suspendues."
        case .accounts:
            return "Recherchez les comptes vendeurs, vérifiez leur activité et accédez rapidement à leur boutique."
        case .orders:
            return "Consultez les commandes de toutes les boutiques et repérez rapidement les paiements."
        case .subscriptions:
            return "Consultez les formules actives et expirées, changez le plan d’une boutique ou ajustez les tarifs."
        case .analytics:
            return "Audience, visiteurs et statistiques de consultation de la plateforme."
        case .notifications:
            return "Préparez une annonce et envoyez-la aux vendeurs qui ont activé les notifications."
        case .settings:
            return "Vérifiez l’état des services essentiels (base D1, push, prix Pro) et configurez Jaaymaa."
        }
    }

    var symbol: String {
        switch self {
        case .overview: return "square.grid.2x2.fill"
        case .shops: return "storefront.fill"
        case .accounts: return "person.2.fill"
        case .orders: return "bag.fill"
        case .subscriptions: return "creditcard.fill"
        case .analytics: return "chart.bar.fill"
        case .notifications: return "bell.fill"
        case .settings: return "slider.horizontal.3"
        }
    }

    var isSearchable: Bool {
        [.shops, .subscriptions, .accounts, .orders].contains(self)
    }

    // Top 4 mobile primary tabs matching web:
    // Aperçu, Boutiques, Comptes, Commandes + Plus
    static let primaryMobileSections: [AdminSection] = [.overview, .shops, .accounts, .orders]

    // Sections inside the "Plus" sheet:
    static let moreSections: [AdminSection] = [.analytics, .subscriptions, .notifications, .settings]
}
