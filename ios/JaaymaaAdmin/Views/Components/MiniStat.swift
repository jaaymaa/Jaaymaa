import SwiftUI

struct MiniStat: View {
    let title: String
    let value: Int
    var symbol: String? = nil
    var color: Color = JaaymaStyle.ink

    var body: some View {
        HStack(spacing: 9) {
            if let symbol {
                Image(systemName: symbol)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(color)
                    .frame(width: 32, height: 32)
                    .background(color.opacity(0.12), in: RoundedRectangle(cornerRadius: 9))
                    .overlay(RoundedRectangle(cornerRadius: 9).stroke(JaaymaStyle.ink.opacity(0.18), lineWidth: 1))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text("\(value)")
                    .font(.system(size: 17, weight: .black, design: .rounded))
                    .foregroundStyle(color)
                Text(title)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(JaaymaStyle.muted)
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
        }
        .padding(11)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 15))
        .overlay(RoundedRectangle(cornerRadius: 15).stroke(JaaymaStyle.ink, lineWidth: 1.8))
        .shadow(color: JaaymaStyle.ink, radius: 0, x: 2.5, y: 2.5)
    }
}
