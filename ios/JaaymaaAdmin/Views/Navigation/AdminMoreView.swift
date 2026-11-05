import SwiftUI

struct AdminMoreView: View {
    @EnvironmentObject private var session: AdminSessionStore
    @Binding var currentSection: AdminSection
    @Environment(\.dismiss) private var dismiss

    private let moreSections: [AdminSection] = AdminSection.moreSections

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    HStack(spacing: 12) {
                        BrandMark(size: 44, brutalist: true)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Administration")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1.4)
                                .foregroundStyle(JaaymaStyle.darkHibiscus)
                            Text("Autres rubriques")
                                .font(.system(size: 22, weight: .black, design: .rounded))
                                .foregroundStyle(JaaymaStyle.ink)
                        }
                        Spacer()
                    }
                    .padding(.top, 10)

                    // Secondary sections grid / cards
                    VStack(spacing: 12) {
                        ForEach(moreSections) { section in
                            Button {
                                currentSection = section
                                dismiss()
                            } label: {
                                HStack(spacing: 14) {
                                    Image(systemName: section.symbol)
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundStyle(JaaymaStyle.ink)
                                        .frame(width: 42, height: 42)
                                        .background(currentSection == section ? JaaymaStyle.sun : Color.white, in: RoundedRectangle(cornerRadius: 12))
                                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(JaaymaStyle.ink, lineWidth: 2))

                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(section.title)
                                            .font(.system(size: 15, weight: .bold, design: .rounded))
                                            .foregroundStyle(JaaymaStyle.ink)
                                        Text(section.eyebrow)
                                            .font(.system(size: 11, weight: .medium))
                                            .foregroundStyle(JaaymaStyle.muted)
                                            .lineLimit(1)
                                    }

                                    Spacer()

                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundStyle(JaaymaStyle.muted)
                                }
                                .padding(14)
                                .background(currentSection == section ? JaaymaStyle.sun.opacity(0.25) : JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 18))
                                .overlay(RoundedRectangle(cornerRadius: 18).stroke(JaaymaStyle.ink, lineWidth: 2))
                                .shadow(color: JaaymaStyle.ink, radius: 0, x: 3, y: 3)
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    // Sign Out Card
                    VStack(alignment: .leading, spacing: 12) {
                        Text("COMPTE CONNECTÉ")
                            .font(.system(size: 10, weight: .black))
                            .tracking(1.2)
                            .foregroundStyle(JaaymaStyle.muted)

                        if let phone = session.userPhone {
                            HStack {
                                Image(systemName: "person.badge.shield.checkmark.fill")
                                    .foregroundStyle(JaaymaStyle.baobab)
                                Text(phone)
                                    .font(.system(size: 14, weight: .bold, design: .monospaced))
                                    .foregroundStyle(JaaymaStyle.ink)
                                Spacer()
                                Text("Admin")
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundStyle(JaaymaStyle.darkHibiscus)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(JaaymaStyle.sun, in: Capsule())
                                    .overlay(Capsule().stroke(JaaymaStyle.ink, lineWidth: 1.5))
                            }
                            .padding(12)
                            .background(Color.white, in: RoundedRectangle(cornerRadius: 14))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(JaaymaStyle.ink, lineWidth: 1.5))
                        }

                        Button {
                            dismiss()
                            Task { await session.signOut() }
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                    .font(.system(size: 14, weight: .bold))
                                Text("Se déconnecter")
                                    .font(.system(size: 14, weight: .black, design: .rounded))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .foregroundStyle(JaaymaStyle.darkHibiscus)
                            .background(JaaymaStyle.hibiscus.opacity(0.12), in: RoundedRectangle(cornerRadius: 14))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(JaaymaStyle.hibiscus, lineWidth: 2))
                            .shadow(color: JaaymaStyle.hibiscus.opacity(0.5), radius: 0, x: 2, y: 2)
                        }
                    }
                    .padding(16)
                    .background(JaaymaStyle.paper, in: RoundedRectangle(cornerRadius: 20))
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(JaaymaStyle.ink, lineWidth: 2))
                    .shadow(color: JaaymaStyle.ink, radius: 0, x: 3.5, y: 3.5)
                }
                .padding(20)
            }
            .background(JaaymaStyle.paper.ignoresSafeArea())
            .navigationTitle("Navigation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Fermer") { dismiss() }
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(JaaymaStyle.ink)
                }
            }
        }
    }
}
