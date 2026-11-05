export const SHOP_THEMES = [
  { name: "Hibiscus", value: "#C8265A" },
  { name: "Vert", value: "#0E7C66" },
  { name: "Soleil", value: "#FFC83D" },
  { name: "Indigo", value: "#3B4A7A" },
  { name: "Terracotta", value: "#B4531E" },
] as const;

export const DEFAULT_SHOP_THEME = SHOP_THEMES[0].value;
export const SHOP_THEME_COLORS = SHOP_THEMES.map(({ value }) => value);

export function getShopThemeForeground(color: string) {
  return color.toUpperCase() === "#FFC83D" ? "#0F1E3D" : "#FFFFFF";
}
