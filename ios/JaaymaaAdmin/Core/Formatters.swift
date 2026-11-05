import Foundation

func formatFcfa(_ amount: Int) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .decimal
    formatter.locale = Locale(identifier: "fr_FR")
    return "\(formatter.string(from: NSNumber(value: amount)) ?? String(amount)) FCFA"
}

func statusLabel(_ value: String) -> String {
    switch value {
    case "ACTIVE": return "En ligne"
    case "DRAFT": return "Brouillon"
    case "SUSPENDED": return "Suspendue"
    case "NEW": return "Nouvelle"
    case "CONFIRMED": return "Confirmée"
    case "PREPARING": return "En préparation"
    case "OUT_FOR_DELIVERY": return "En livraison"
    case "DELIVERED": return "Livrée"
    case "CANCELLED": return "Annulée"
    default: return value
    }
}

