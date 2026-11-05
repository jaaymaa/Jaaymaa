import SwiftUI

struct AdminRootView: View {
    @EnvironmentObject private var session: AdminSessionStore

    var body: some View {
        Group {
            if session.isSignedIn {
                AdminShellView()
            } else {
                AdminLoginView()
            }
        }
        .animation(.snappy(duration: 0.25), value: session.isSignedIn)
    }
}

