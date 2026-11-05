import Foundation

enum AdminAPIError: LocalizedError {
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

struct APIErrorPayload: Decodable {
    let error: String?
}

struct EmptyResponse: Decodable {}

