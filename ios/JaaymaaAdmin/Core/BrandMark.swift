import SwiftUI

struct BrandMark: View {
    var size: CGFloat
    var brutalist: Bool = true

    var body: some View {
        ZStack {
            JaaymaaTileShape().fill(JaaymaStyle.sun)
            JaaymaaJShape().stroke(
                JaaymaStyle.ink,
                style: StrokeStyle(lineWidth: size * 0.1, lineCap: .round, lineJoin: .round)
            )
            Circle()
                .fill(JaaymaStyle.hibiscus)
                .frame(width: size * 0.125, height: size * 0.125)
                .position(x: size * 64 / 120, y: size * 28 / 120)
        }
        .frame(width: size, height: size)
        .overlay(JaaymaaTileShape().stroke(JaaymaStyle.ink, lineWidth: max(1.5, size * 0.035)))
        .shadow(
            color: brutalist ? JaaymaStyle.ink : JaaymaStyle.ink.opacity(0.16),
            radius: brutalist ? 0 : 6,
            x: brutalist ? max(2, size * 0.04) : 0,
            y: brutalist ? max(2, size * 0.04) : 3
        )
        .accessibilityHidden(true)
    }
}

struct JaaymaaTileShape: Shape {
    func path(in rect: CGRect) -> Path {
        func point(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
            CGPoint(x: rect.minX + rect.width * x / 120, y: rect.minY + rect.height * y / 120)
        }

        var path = Path()
        path.move(to: point(38, 4))
        path.addLine(to: point(82, 4))
        path.addCurve(to: point(116, 38), control1: point(100.8, 4), control2: point(116, 19.2))
        path.addLine(to: point(116, 82))
        path.addCurve(to: point(82, 116), control1: point(116, 100.8), control2: point(100.8, 116))
        path.addLine(to: point(10, 116))
        path.addCurve(to: point(4, 110), control1: point(6.7, 116), control2: point(4, 113.3))
        path.addLine(to: point(4, 38))
        path.addCurve(to: point(38, 4), control1: point(4, 19.2), control2: point(19.2, 4))
        path.closeSubpath()
        return path
    }
}

struct JaaymaaJShape: Shape {
    func path(in rect: CGRect) -> Path {
        func point(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
            CGPoint(x: rect.minX + rect.width * x / 120, y: rect.minY + rect.height * y / 120)
        }

        var path = Path()
        path.move(to: point(64, 46))
        path.addLine(to: point(64, 76))
        path.addCurve(to: point(44, 97), control1: point(64, 90), control2: point(57, 97))
        return path
    }
}
