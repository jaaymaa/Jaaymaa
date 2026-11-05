import SwiftUI

struct AdminMoreView: View {
    @EnvironmentObject private var session: AdminSessionStore
    private let sections: [AdminSection] = [.subscriptions, .analytics, .notifications, .settings]

    var body: some View {
        List {
            Section {
                ForEach(sections) { section in
                    NavigationLink {
                        AdminSectionView(section: section)
                    } label: {
                        Label(section.title, systemImage: section.symbol)
                            .padding(.vertical, 5)
                    }
                }
            } header: {
                Text("Gestion")
            }

            Section {
                Button(role: .destructive) {
                    Task { await session.signOut() }
                } label: {
                    Label("Se déconnecter", systemImage: "rectangle.portrait.and.arrow.right")
                }
            }
        }
        .navigationTitle("Plus")
        .scrollContentBackground(.hidden)
        .background(JaaymaStyle.paper)
    }
}

