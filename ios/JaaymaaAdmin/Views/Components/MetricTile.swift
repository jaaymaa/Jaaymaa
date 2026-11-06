import SwiftUI

struct MetricTile: View {
    let title: String
    let value: String
    let note: String
    let symbol: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text(title.uppercased())
                    .font(.caption2.weight(.heavy))
                    .tracking(0.65)
                    .foregroundStyle(JaaymaStyle.muted)
                Spacer()
                Image(systemName: symbol)
                    .font(.footnote.weight(.bold))
                    .padding(9)
                    .background(tint, in: RoundedRectangle(cornerRadius: 11))
            }
            Text(value)
                .font(.system(size: 26, weight: .black, design: .rounded))
                .foregroundStyle(JaaymaStyle.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(note)
                .font(.caption2.weight(.medium))
                .foregroundStyle(JaaymaStyle.muted)
                .lineLimit(1)
        }
        .padding(15)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.white.opacity(0.78), in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(JaaymaStyle.ink.opacity(0.08), lineWidth: 1))
    }
}

