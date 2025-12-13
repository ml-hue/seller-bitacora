export default function autoSummary(text = "") {
  if (!text) return "";

  // Tomar primera oración real
  const clean = text.replace(/\n/g, " ").trim();

  const firstDot = clean.indexOf(".");
  if (firstDot !== -1 && firstDot < 200) {
    return clean.substring(0, firstDot + 1);
  }

  // Fallback: primeras 180 palabras
  return clean.split(" ").slice(0, 40).join(" ") + "...";
}
