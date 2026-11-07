import SwiftUI

enum JaaymaLoaderVariant: Equatable {
    case main
    case mini
    case miniInk
}

struct JaaymaLoader: View {
    let variant: JaaymaLoaderVariant
    var size: CGFloat = 32
    var label: String? = nil

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Group {
            if let label {
                loaderContent
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(label)
            } else {
                loaderContent
                    .accessibilityHidden(true)
            }
        }
    }

    @ViewBuilder
    private var loaderContent: some View {
        switch variant {
        case .main:
            if reduceMotion {
                MainLoaderArtwork(size: size, time: 0, animates: false)
            } else {
                TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { context in
                    MainLoaderArtwork(size: size, time: context.date.timeIntervalSinceReferenceDate, animates: true)
                }
            }
        case .mini, .miniInk:
            if reduceMotion {
                MiniLoaderArtwork(size: size, time: 0, monochrome: variant == .miniInk)
            } else {
                TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { context in
                    MiniLoaderArtwork(
                        size: size,
                        time: context.date.timeIntervalSinceReferenceDate,
                        monochrome: variant == .miniInk
                    )
                }
            }
        }
    }
}

private struct MainLoaderArtwork: View {
    let size: CGFloat
    let time: TimeInterval
    let animates: Bool

    private let colors = [JaaymaStyle.sun, JaaymaStyle.hibiscus, JaaymaStyle.green]

    private var cycle: Double { animates ? time.truncatingRemainder(dividingBy: 2.4) / 2.4 : 0 }

    var body: some View {
        ZStack {
            Circle()
                .stroke(JaaymaStyle.muted.opacity(0.2), lineWidth: size * 0.025)

            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .trim(from: 0, to: 0.14)
                    .stroke(
                        colors[index],
                        style: StrokeStyle(lineWidth: size * (8 / 240), lineCap: .round)
                    )
                    .rotationEffect(.degrees(Double(index) * 120 + ringRotation))
            }

            logoTile
        }
        .frame(width: size, height: size)
    }

    private var ringRotation: Double {
        animates ? time.truncatingRemainder(dividingBy: 1.8) / 1.8 * 360 : 0
    }

    private var logoTile: some View {
        let tileSize = size * 0.5
        let breath = animates ? CGFloat((1 - cos(cycle * 2 * .pi)) * 0.5) : 0

        return ZStack {
            JaaymaaTileShape()
                .fill(JaaymaStyle.sun)

            JaaymaaJShape()
                .trim(from: 0, to: jProgress)
                .stroke(
                    JaaymaStyle.ink,
                    style: StrokeStyle(lineWidth: tileSize * 0.1, lineCap: .round, lineJoin: .round)
                )

            Circle()
                .fill(JaaymaStyle.hibiscus)
                .frame(width: tileSize * 0.125, height: tileSize * 0.125)
                .position(x: tileSize * 64 / 120, y: tileSize * 28 / 120)
                .offset(y: dotOffset * tileSize / 120)
                .scaleEffect(x: dotScaleX, y: dotScaleY, anchor: .center)
                .opacity(Double(dotOpacity))
        }
        .frame(width: tileSize, height: tileSize)
        .scaleEffect(1 + 0.05 * breath)
        .rotationEffect(.degrees(-3 * Double(breath)))
    }

    private var jProgress: CGFloat {
        guard animates else { return 1 }
        if cycle < 0.35 { return CGFloat(cycle / 0.35) }
        if cycle < 0.8 { return 1 }
        if cycle < 0.95 { return CGFloat(1 - (cycle - 0.8) / 0.15) }
        return 0
    }

    private var dotOffset: CGFloat {
        animates ? sample(cycle, at: [(0, -44), (0.04, -44), (0.22, 0), (0.25, 0), (0.31, -12), (0.37, 0), (0.42, -4), (0.46, 0), (0.88, 0), (0.96, 0), (1, 0)]) : 0
    }

    private var dotScaleX: CGFloat {
        animates ? sample(cycle, at: [(0, 1), (0.22, 1), (0.25, 1.3), (0.31, 0.9), (0.37, 1.15), (0.42, 1), (0.88, 1), (0.96, 0), (1, 0)]) : 1
    }

    private var dotScaleY: CGFloat {
        animates ? sample(cycle, at: [(0, 1), (0.22, 1), (0.25, 0.7), (0.31, 1.1), (0.37, 0.85), (0.42, 1), (0.88, 1), (0.96, 0), (1, 0)]) : 1
    }

    private var dotOpacity: CGFloat {
        animates ? sample(cycle, at: [(0, 0), (0.04, 0), (0.22, 1), (0.88, 1), (0.96, 0), (1, 0)]) : 1
    }
}

private struct MiniLoaderArtwork: View {
    let size: CGFloat
    let time: TimeInterval
    let monochrome: Bool

    private var colors: [Color] {
        monochrome ? [JaaymaStyle.ink, JaaymaStyle.ink, JaaymaStyle.ink] : [JaaymaStyle.sun, JaaymaStyle.hibiscus, JaaymaStyle.green]
    }

    var body: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { index in
                MiniLoaderDot(color: colors[index], index: index, width: size, time: time)
            }
        }
        .frame(width: size, height: size * 24 / 64)
    }
}

private struct MiniLoaderDot: View {
    let color: Color
    let index: Int
    let width: CGFloat
    let time: TimeInterval

    private var progress: Double {
        let shifted = (time - Double(index) * 0.15).truncatingRemainder(dividingBy: 1.1)
        return (shifted + 1.1).truncatingRemainder(dividingBy: 1.1) / 1.1
    }

    var body: some View {
        let scale = width / 64
        Circle()
            .fill(color)
            .frame(width: 11 * scale, height: 11 * scale)
            .position(x: CGFloat(12 + index * 20) * scale, y: 17 * scale)
            .offset(y: sample(progress, at: [(0, 0), (0.15, 0), (0.35, -8), (0.5, 0), (0.6, 0), (1, 0)]) * scale)
            .scaleEffect(
                x: sample(progress, at: [(0, 1), (0.15, 1.2), (0.35, 0.92), (0.5, 1.15), (0.6, 1), (1, 1)]),
                y: sample(progress, at: [(0, 1), (0.15, 0.8), (0.35, 1.08), (0.5, 0.85), (0.6, 1), (1, 1)]),
                anchor: .bottom
            )
    }
}

private func sample(_ progress: Double, at points: [(Double, Double)]) -> CGFloat {
    guard let first = points.first, let last = points.last else { return 0 }
    if progress <= first.0 { return CGFloat(first.1) }
    if progress >= last.0 { return CGFloat(last.1) }

    for (start, end) in zip(points, points.dropFirst()) where progress <= end.0 {
        let fraction = (progress - start.0) / (end.0 - start.0)
        return CGFloat(start.1 + (end.1 - start.1) * fraction)
    }

    return CGFloat(last.1)
}
