import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, "../public/icons");
const svgPath = resolve(iconsDir, "icon.svg");

const svgBuffer = readFileSync(svgPath);

const icons = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

console.log("Génération des icônes PWA...");
for (const icon of icons) {
  const outputPath = resolve(iconsDir, icon.name);
  await sharp(svgBuffer).resize(icon.size, icon.size).png({ quality: 100 }).toFile(outputPath);
  console.log(`OK ${icon.name} (${icon.size}x${icon.size})`);
}
console.log("Terminé !");
