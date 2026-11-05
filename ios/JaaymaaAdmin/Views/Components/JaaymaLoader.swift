import SwiftUI

// MARK: - Mini Jumping Dots Loader (Matching jaayma-loader-mini.svg & jaayma-loader-mini-encre.svg)

struct JaaymaMiniLoader: View {
    var encre: Bool = false
    var dotSize: CGFloat = 10
    var spacing: CGFloat = 7

    private let duration: Double = 1.1
    private let offsets: [Double] = [0.0, 0.15, 0.30]

    var body: some View {
        TimelineView(.animation) { timeline in
            let elapsed = timeline.date.timeIntervalSinceReferenceDate
            HStack(spacing: spacing) {
                ForEach(0..<3, id: \.self) { index in
                    let state = dotState(for: index, at: elapsed)
                    Circle()
                        .fill(dotColor(for: index))
                        .frame(width: dotSize, height: dotSize)
                        .scaleEffect(x: state.scaleX, y: state.scaleY, anchor: .bottom)
                        .offset(y: state.offsetY * (dotSize / 10.0))
                }
            }
        }
        .frame(height: dotSize + 10)
    }

    private func dotColor(for index: Int) -> Color {
        if encre { return JaaymaStyle.ink }
        switch index {
        case 0: return JaaymaStyle.sun
        case 1: return JaaymaStyle.hibiscus
        default: return JaaymaStyle.baobab
        }
    }

    private struct DotState {
        var offsetY: CGFloat
        var scaleX: CGFloat
        var scaleY: CGFloat
    }

    private func dotState(for index: Int, at elapsed: Double) -> DotState {
        let delay = offsets[index]
        let shifted = elapsed - delay
        let loopTime = shifted.truncatingRemainder(dividingBy: duration)
        let normalized = loopTime < 0 ? loopTime + duration : loopTime
        let progress = normalized / duration

        // SVG Keyframe reproduction:
        // 0% - 15%: squash on ground: translateY(0), scale(1.2, 0.8)
        // 15% - 35%: jump up: translateY(-8), scale(0.92, 1.08)
        // 35% - 50%: land squash: translateY(0), scale(1.15, 0.85)
        // 50% - 60%: settle: translateY(0), scale(1.0, 1.0)
        // 60% - 100%: rest at ground: translateY(0), scale(1.0, 1.0)

        if progress < 0.15 {
            let p = progress / 0.15
            let ease = easeInOut(p)
            return DotState(
                offsetY: 0,
                scaleX: 1.0 + 0.2 * ease,
                scaleY: 1.0 - 0.2 * ease
            )
        } else if progress < 0.35 {
            let p = (progress - 0.15) / 0.20
            let ease = easeOut(p)
            return DotState(
                offsetY: -8.0 * ease,
                scaleX: 1.2 - 0.28 * ease,
                scaleY: 0.8 + 0.28 * ease
            )
        } else if progress < 0.50 {
            let p = (progress - 0.35) / 0.15
            let ease = easeIn(p)
            return DotState(
                offsetY: -8.0 * (1.0 - ease),
                scaleX: 0.92 + 0.23 * ease,
                scaleY: 1.08 - 0.23 * ease
            )
        } else if progress < 0.60 {
            let p = (progress - 0.50) / 0.10
            let ease = easeOut(p)
            return DotState(
                offsetY: 0,
                scaleX: 1.15 - 0.15 * ease,
                scaleY: 0.85 + 0.15 * ease
            )
        } else {
            return DotState(offsetY: 0, scaleX: 1.0, scaleY: 1.0)
        }
    }

    private func easeInOut(_ t: Double) -> CGFloat {
        CGFloat(t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
    }

    private func easeOut(_ t: Double) -> CGFloat {
        CGFloat(sin(t * .pi / 2))
    }

    private func easeIn(_ t: Double) -> CGFloat {
        CGFloat(1 - cos(t * .pi / 2))
    }
}

// MARK: - Animated Brand Badge (jaayma-loader.svg)

struct JaaymaAnimatedBadge: View {
    var size: CGFloat = 130

    private let ringCycle: Double = 1.8
    private let tileCycle: Double = 2.4

    var body: some View {
        TimelineView(.animation) { timeline in
            let elapsed = timeline.date.timeIntervalSinceReferenceDate

            let ringAngle = (elapsed.truncatingRemainder(dividingBy: ringCycle) / ringCycle) * 360.0

            let tileProgress = (elapsed.truncatingRemainder(dividingBy: tileCycle) / tileCycle)
            let breatheState = calculateBreathe(progress: tileProgress)
            let jProgress = calculateJDraw(progress: tileProgress)
            let dotState = calculateDotDrop(progress: tileProgress)

            ZStack {
                // Background Track
                Circle()
                    .stroke(
                        JaaymaStyle.ghost.opacity(0.35),
                        style: StrokeStyle(lineWidth: size * (6.0 / 240.0), lineCap: .round)
                    )
                    .frame(width: size * (208.0 / 240.0), height: size * (208.0 / 240.0))

                // Tricolor Rotating Segments: Sun, Hibiscus, Baobab
                ZStack {
                    // Segment 1: Sun
                    Circle()
                        .trim(from: 0.0, to: 0.14)
                        .stroke(
                            JaaymaStyle.sun,
                            style: StrokeStyle(lineWidth: size * (8.0 / 240.0), lineCap: .round)
                        )

                    // Segment 2: Hibiscus
                    Circle()
                        .trim(from: 0.333, to: 0.473)
                        .stroke(
                            JaaymaStyle.hibiscus,
                            style: StrokeStyle(lineWidth: size * (8.0 / 240.0), lineCap: .round)
                        )

                    // Segment 3: Baobab
                    Circle()
                        .trim(from: 0.666, to: 0.806)
                        .stroke(
                            JaaymaStyle.baobab,
                            style: StrokeStyle(lineWidth: size * (8.0 / 240.0), lineCap: .round)
                        )
                }
                .frame(width: size * (208.0 / 240.0), height: size * (208.0 / 240.0))
                .rotationEffect(.degrees(ringAngle))

                // Central Jaaymaa Branded Squircle Tile
                ZStack {
                    // Tile Shape
                    JaaymaaTileShape()
                        .fill(JaaymaStyle.sun)
                        .overlay(
                            JaaymaaTileShape()
                                .stroke(JaaymaStyle.ink, lineWidth: size * (3.0 / 240.0))
                        )
                        .shadow(color: JaaymaStyle.ink, radius: 0, x: 2, y: 2)

                    // J Stem (Smoothly drawn)
                    JaaymaaJShape()
                        .trim(from: 0, to: jProgress)
                        .stroke(
                            JaaymaStyle.ink,
                            style: StrokeStyle(lineWidth: size * (12.0 / 240.0), lineCap: .round, lineJoin: .round)
                        )

                    // Bouncing Hibiscus Dot
                    Circle()
                        .fill(JaaymaStyle.hibiscus)
                        .frame(width: size * (15.0 / 240.0), height: size * (15.0 / 240.0))
                        .scaleEffect(x: dotState.scaleX, y: dotState.scaleY, anchor: .bottom)
                        .opacity(dotState.opacity)
                        .position(
                            x: (size * (116.0 / 240.0)) * (64.0 / 120.0),
                            y: (size * (116.0 / 240.0)) * (28.0 / 120.0) + dotState.offsetY * (size / 240.0)
                        )
                }
                .frame(width: size * (116.0 / 240.0), height: size * (116.0 / 240.0))
                .scaleEffect(breatheState.scale)
                .rotationEffect(.degrees(breatheState.rotation))
            }
            .frame(width: size, height: size)
        }
    }

    private struct BreatheState {
        var scale: CGFloat
        var rotation: Double
    }

    private func calculateBreathe(progress: Double) -> BreatheState {
        let sine = sin(progress * .pi * 2)
        let normalized = (sine + 1) / 2
        let scale = 1.0 + 0.05 * normalized
        let rot = -3.0 * normalized
        return BreatheState(scale: CGFloat(scale), rotation: rot)
    }

    private func calculateJDraw(progress: Double) -> CGFloat {
        if progress < 0.35 {
            return CGFloat(progress / 0.35)
        } else if progress < 0.85 {
            return 1.0
        } else {
            return CGFloat(max(0, 1.0 - (progress - 0.85) / 0.15))
        }
    }

    private struct DotAnimationState {
        var offsetY: CGFloat
        var scaleX: CGFloat
        var scaleY: CGFloat
        var opacity: Double
    }

    private func calculateDotDrop(progress: Double) -> DotAnimationState {
        if progress < 0.22 {
            let p = progress / 0.22
            return DotAnimationState(
                offsetY: CGFloat(-44.0 * (1.0 - p)),
                scaleX: 1.0,
                scaleY: 1.0,
                opacity: min(1.0, p * 3.0)
            )
        } else if progress < 0.25 {
            let p = (progress - 0.22) / 0.03
            return DotAnimationState(
                offsetY: 0,
                scaleX: CGFloat(1.0 + 0.3 * p),
                scaleY: CGFloat(1.0 - 0.3 * p),
                opacity: 1.0
            )
        } else if progress < 0.31 {
            let p = (progress - 0.25) / 0.06
            return DotAnimationState(
                offsetY: CGFloat(-12.0 * sin(p * .pi / 2)),
                scaleX: CGFloat(1.3 - 0.4 * p),
                scaleY: CGFloat(0.7 + 0.4 * p),
                opacity: 1.0
            )
        } else if progress < 0.37 {
            let p = (progress - 0.31) / 0.06
            return DotAnimationState(
                offsetY: CGFloat(-12.0 * (1.0 - p)),
                scaleX: CGFloat(0.9 + 0.25 * p),
                scaleY: CGFloat(1.1 - 0.25 * p),
                opacity: 1.0
            )
        } else if progress < 0.42 {
            let p = (progress - 0.37) / 0.05
            return DotAnimationState(
                offsetY: CGFloat(-4.0 * sin(p * .pi)),
                scaleX: 1.0,
                scaleY: 1.0,
                opacity: 1.0
            )
        } else if progress < 0.88 {
            return DotAnimationState(offsetY: 0, scaleX: 1.0, scaleY: 1.0, opacity: 1.0)
        } else {
            let p = (progress - 0.88) / 0.12
            return DotAnimationState(
                offsetY: 0,
                scaleX: CGFloat(max(0, 1.0 - p)),
                scaleY: CGFloat(max(0, 1.0 - p)),
                opacity: max(0, 1.0 - p)
            )
        }
    }
}

// MARK: - Full Screen / Section Loader (jaayma-loader.svg)

struct JaaymaScreenLoader: View {
    var label: String = "Chargement en cours…"
    var subtitle: String? = "Actualisation des données en direct"
    var size: CGFloat = 120

    var body: some View {
        VStack(spacing: 20) {
            JaaymaAnimatedBadge(size: size)

            VStack(spacing: 8) {
                HStack(spacing: 7) {
                    JaaymaMiniLoader(encre: false, dotSize: 7, spacing: 5)
                    Text("SYNCHRONISATION")
                        .font(.system(size: 10, weight: .black))
                        .tracking(1.8)
                        .foregroundStyle(JaaymaStyle.darkHibiscus)
                }

                Text(label)
                    .font(.system(size: 16, weight: .black, design: .rounded))
                    .foregroundStyle(JaaymaStyle.ink)

                if let subtitle {
                    Text(subtitle)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(JaaymaStyle.muted)
                }
            }
            .padding(.horizontal, 22)
            .padding(.vertical, 14)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 18))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(JaaymaStyle.ink, lineWidth: 1.5))
            .shadow(color: JaaymaStyle.ink, radius: 0, x: 2.5, y: 2.5)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.vertical, 40)
    }
}
