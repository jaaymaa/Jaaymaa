import Foundation

struct AdminAPI {
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

    func load(_ section: AdminSection, token: String, page: Int, query: String) async throws -> AdminSectionData {
        switch section {
        case .overview:
            return .overview(try await get(section, token: token, page: page, query: query))
        case .shops:
            return .shops(try await get(section, token: token, page: page, query: query))
        case .subscriptions:
            return .subscriptions(try await get(section, token: token, page: page, query: query))
        case .accounts:
            return .accounts(try await get(section, token: token, page: page, query: query))
        case .orders:
            return .orders(try await get(section, token: token, page: page, query: query))
        case .analytics:
            return .analytics(try await get(section, token: token, page: page, query: query))
        case .notifications:
            return .notifications(try await get(section, token: token, page: page, query: query))
        case .settings:
            return .settings(try await get(section, token: token, page: page, query: query))
        }
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
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw AdminAPIError.invalidResponse
        }
    }
}

