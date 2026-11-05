import SwiftUI
import Combine

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

