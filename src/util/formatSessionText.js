export default function formatSessionText(raw = "") {
  if (!raw) return { full: "", preview: "", isLong: false };

  let text = raw.trim();

  // Reemplazar "Temas:", "Acciones:", etc.
  text = text.replace(
    /(temas:|hallazgos:|acciones:|conclusiones:)/gi,
    (match) =>
      `<h3 class="text-emerald-400 font-medium mt-4 mb-2">${match
        .replace(":", "")
        .toUpperCase()}</h3>`
  );

  // Bullets automáticos
  text = text.replace(/\n-\s+/g, "<li class='ml-4 list-disc'>");

  // Saltos de línea → párrafos
  text = text.replace(/\n+/g, "<br/>");

  // Dividir preview / full
  const LIMIT = 550;
  const isLong = text.length > LIMIT;

  return {
    full: text,
    preview: text.substring(0, LIMIT),
    isLong,
  };
}
