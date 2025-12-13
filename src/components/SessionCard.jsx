import { useState } from "react";
import formatSessionText from "../utils/formatSessionText";
import autoSummary from "../utils/autoSummary";
import clsx from "clsx";

export default function SessionCard({ session }) {
  const [expanded, setExpanded] = useState(false);

  const {
    id,
    title,
    date,
    clientResponsible,
    clientStatus,
    notes, // contenido RAW
    tag,
    sessionNumber,
  } = session;

  const formatted = formatSessionText(notes || "");
  const summary = autoSummary(notes || "");

  return (
    <div className="bg-[#0F1117] border border-[#1D212A] rounded-2xl shadow-xl shadow-black/20 p-6 md:p-8 space-y-4">
      {/* HEADER */}
      <header className="space-y-2">
        <h2 className="text-xl font-semibold text-white">{title}</h2>

        {/* META */}
        <div className="flex flex-wrap gap-3 text-sm text-gray-400">
          <span>📅 {new Date(date).toLocaleDateString("es-PY")}</span>
          <span>🏷 {tag}</span>
          {clientResponsible && <span>👤 {clientResponsible}</span>}
          {clientStatus && (
            <span
              className={clsx(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                clientStatus === "realizado"
                  ? "bg-emerald-600 text-black"
                  : clientStatus === "postergado"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400"
              )}
            >
              {clientStatus}
            </span>
          )}
        </div>

        {/* TABS (placeholder futuro) */}
        <div className="flex gap-2 pt-2">
          <button className="px-3 py-1 rounded-full text-sm border border-gray-600 text-gray-300">
            Sesión {sessionNumber || 1}
          </button>
        </div>
      </header>

      {/* SHORT SUMMARY */}
      <p className="text-gray-300 text-[15px] leading-relaxed max-w-[650px]">
        {summary}
      </p>

      <hr className="border-gray-800" />

      {/* BODY */}
      <div
        className={clsx(
          "text-[15px] text-gray-300 leading-relaxed space-y-4 max-w-[650px] transition-all duration-300"
        )}
        dangerouslySetInnerHTML={{
          __html: expanded
            ? formatted.full
            : formatted.preview + (formatted.isLong ? "..." : ""),
        }}
      />

      {/* VER MÁS / VER MENOS */}
      {formatted.isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-emerald-400 hover:underline text-sm"
          aria-expanded={expanded}
          aria-controls={`session-body-${id}`}
        >
          {expanded ? "Ver menos" : "Ver más"}
        </button>
      )}
    </div>
  );
}
