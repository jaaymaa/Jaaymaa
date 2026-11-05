import Foundation

enum AdminSection: String, CaseIterable, Identifiable, Hashable {
    case overview, shops, orders, accounts, subscriptions, analytics, notifications, settings

    var id: String { rawValue }
    var endpoint: String { rawValue }

    var title: String {
        switch self {
        case .overview: return "Vue d’ensemble"
        case .shops: return "Boutiques"
        case .orders: return "Commandes"
        case .accounts: return "Comptes vendeurs"
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
        case .orders: return "Commandes"
        case .accounts: return "Comptes"
        case .subscriptions: return "Abonnements"
        case .analytics: return "Analytics"
        case .notifications: return "Alertes"
        case .settings: return "Réglages"
        }
    }

    var eyebrow: String {
        switch self {
        case .overview: return "Centre de pilotage"
        case .shops: return "Catalogue des boutiques"
        case .orders: return "Suivi des ventes"
        case .accounts: return "Commerçants Jaaymaa"
        case .subscriptions: return "Offre commerciale"
        case .analytics: return "Performances & audience"
        case .notifications: return "Communication vendeurs"
        case .settings: return "Configuration de la plateforme"
        }
    }

    var description: String {
        switch self {
        case .overview:
            return "Indicateurs clés en direct et dernières activités de la plateforme."
        case .shops:
            return "Toutes les boutiques Jaaymaa, actives, en attente ou suspendues."
        case .orders:
            return "Commandes passées sur les boutiques, statuts de paiement et livraisons."
        case .accounts:
            return "Gestion des comptes commerçants et accès direct à leurs boutiques."
        case .subscriptions:
            return "Formules Pro et Pro+, statuts de validité et gestion des abonnements."
        case .analytics:
            return "Visiteurs en temps réel, pages populaires et conversion."
        case .notifications:
            return "Diffusions d'annonces instantanées aux commerçants inscrits."
        case .settings:
            return "Santé de l'infrastructure Cloudflare D1, FCM et tarification."
        }
    }

    var symbol: String {
        switch self {
        case .overview: return "square.grid.2x2.fill"
        case .shops: return "storefront.fill"
        case .orders: return "bag.fill"
        case .accounts: return "person.2.fill"
        case .subscriptions: return "creditcard.fill"
        case .analytics: return "chart.bar.fill"
        case .notifications: return "bell.fill"
        case .settings: return "slider.horizontal.3"
        }
    }

    var isSearchable: Bool {
        [.shops, .subscriptions, .accounts, .orders].contains(self)
    }

    // 4 primary tabs on mobile floating bar (+ Plus = 5 balanced slots)
    static let primaryMobileSections: [AdminSection] = [.overview, .shops, .orders, .accounts]

    // 4 sections in the "Plus" sheet
    static let moreSections: [AdminSection] = [.subscriptions, .analytics, .notifications, .settings]
}
