import SwiftUI

@main
struct JaaymaaAdminApp: App {
    @StateObject private var session = AdminSessionStore()

    var body: some Scene {
        WindowGroup {
            AdminRootView()
                .environmentObject(session)
                .preferredColorScheme(.dark)
        }
    }
}
