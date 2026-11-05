"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, X, SlidersHorizontal, AlertCircle } from "lucide-react";
import type { ProductOption } from "@/types/schema";

const STANDARD_PRESETS = [
  {
    label: "Tailles",
    name: "Taille",
    values: ["XS", "S", "M", "L", "XL", "XXL"],
  },
  {
    label: "Pointures",
    name: "Pointure",
    values: ["38", "39", "40", "41", "42", "43", "44"],
  },
  {
    label: "Couleurs",
    name: "Couleur",
    values: ["Noir", "Blanc", "Bleu", "Rouge", "Vert", "Jaune"],
  },
];

interface ProductOptionsEditorProps {
  initialOptionsJson?: string | null;
}

export default function ProductOptionsEditor({
  initialOptionsJson,
}: ProductOptionsEditorProps) {
  const [options, setOptions] = useState<ProductOption[]>(() => {
    if (!initialOptionsJson) return [];
    try {
      const parsed = JSON.parse(initialOptionsJson);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (o) => o && typeof o.name === "string" && Array.isArray(o.values)
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  const [newValueInputs, setNewValueInputs] = useState<Record<number, string>>({});
  const [customNameInput, setCustomNameInput] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);
  // Ref pour les inputs de valeur (non utilisé directement mais garde le DOM)
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Fusionne les valeurs en attente dans les inputs avec les options existantes
  const computeValidOptionsJson = () => {
    const merged = options.map((opt, idx) => {
      const pending = (newValueInputs[idx] || "").trim();
      if (!pending) return opt;
      const newItems = pending.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
      const combined = [...opt.values];
      for (const item of newItems) {
        if (!combined.includes(item)) combined.push(item);
      }
      return { ...opt, values: combined };
    });
    const valid = merged.filter((o) => o.name.trim() && o.values.length > 0);
    return valid.length > 0 ? JSON.stringify(valid) : "";
  };

  const jsonValue = computeValidOptionsJson();
  const hasPendingValues = Object.values(newValueInputs).some((v) => v.trim());

  const addPreset = (preset: { name: string; values: string[] }) => {
    setOptions((prev) => {
      const existing = prev.find(
        (o) => o.name.toLowerCase() === preset.name.toLowerCase()
      );
      if (existing) return prev;
      return [...prev, { name: preset.name, values: [...preset.values] }];
    });
  };

  const addCustomOption = () => {
    const trimmed = customNameInput.trim();
    if (!trimmed) return;
    setOptions((prev) => {
      const existing = prev.find(
        (o) => o.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) return prev;
      return [...prev, { name: trimmed, values: [] }];
    });
    setCustomNameInput("");
    setShowAddCustom(false);
  };

  const removeOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const addValueToOption = (optionIndex: number) => {
    const raw = newValueInputs[optionIndex] || "";
    if (!raw.trim()) return;

    const newItems = raw
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (newItems.length === 0) return;

    setOptions((prev) => {
      const next = [...prev];
      const opt = next[optionIndex];
      if (!opt) return prev;
      const combined = [...opt.values];
      for (const item of newItems) {
        if (!combined.includes(item)) {
          combined.push(item);
        }
      }
      next[optionIndex] = { ...opt, values: combined };
      return next;
    });

    setNewValueInputs((prev) => ({ ...prev, [optionIndex]: "" }));
  };

  const removeValueFromOption = (optionIndex: number, valueIndex: number) => {
    setOptions((prev) => {
      const next = [...prev];
      const opt = next[optionIndex];
      if (!opt) return prev;
      next[optionIndex] = {
        ...opt,
        values: opt.values.filter((_, i) => i !== valueIndex),
      };
      return next;
    });
  };

  // jsonValue and hasPendingValues computed above

  return (
    <div className="pt-6 border-t border-white/10 space-y-4">
      {/* Hidden input for server action — always includes pending (unconfirmed) input values */}
      <input type="hidden" name="optionsJson" value={jsonValue} />

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal className="w-4 h-4 text-sun" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            Variantes et options
          </h2>
        </div>
        <p className="text-xs" style={{ color: "#8D98AF" }}>
          Facultatif : ajoutez une taille, une couleur ou une autre option uniquement si ce produit existe en plusieurs variantes. Laissez vide sinon.
        </p>
      </div>

      {/* Presets and Add Option */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C3CCE6]">
          Ajouter une option :
        </span>
        <div className="flex flex-wrap gap-2">
          {STANDARD_PRESETS.map((preset) => {
            const isAdded = options.some(
              (o) => o.name.toLowerCase() === preset.name.toLowerCase()
            );
            return (
              <button
                key={preset.name}
                type="button"
                disabled={isAdded}
                onClick={() => addPreset(preset)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                  isAdded
                    ? "opacity-35 cursor-not-allowed bg-white/5 border-white/10 text-white"
                    : "bg-[#16264D] hover:bg-[#1E3466] text-white border-white/15 hover:border-sun"
                }`}
              >
                + {preset.label}
              </button>
            );
          })}

          {!showAddCustom && (
            <button
              type="button"
              onClick={() => setShowAddCustom(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold border border-dashed border-[#FFC83D]/60 text-sun hover:bg-[#FFC83D]/10 transition-all flex items-center gap-1 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Autre option
            </button>
          )}
        </div>
      </div>

      {/* Formulaire ajout option personnalisée */}
      {showAddCustom && (
        <div
          className="p-3.5 rounded-2xl border-[2px] border-ink flex items-center gap-2"
          style={{ backgroundColor: "#16264D" }}
        >
          <input
            type="text"
            value={customNameInput}
            onChange={(e) => setCustomNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomOption();
              }
            }}
            placeholder="Nom de l'option (ex: Matière, Capacité...)"
            className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none text-[#0F1E3D] bg-[#FFFBF2] border-[1.5px] border-ink"
            autoFocus
          />
          <button
            type="button"
            onClick={addCustomOption}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-sun text-[#0F1E3D] border-[1.5px] border-ink active:scale-95 transition-transform"
          >
            Ajouter
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddCustom(false);
              setCustomNameInput("");
            }}
            className="p-2 text-[#8D98AF] hover:text-white"
            aria-label="Annuler"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Liste des options créées */}
      {options.length > 0 && (
        <div className="space-y-3 pt-2">
          {options.map((opt, optIndex) => (
            <div
              key={opt.name + optIndex}
              className="p-4 rounded-2xl border-[2px] border-ink space-y-3"
              style={{ backgroundColor: "#16264D" }}
            >
              {/* Entête de l'option */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bricolage font-black text-sm text-white">
                    {opt.name}
                  </span>
                  <span className="text-[11px] font-semibold text-[#8D98AF]">
                    ({opt.values.length} valeur{opt.values.length > 1 ? "s" : ""})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeOption(optIndex)}
                  className="text-red-400 hover:text-red-300 p-1.5 transition-colors rounded-lg hover:bg-white/5"
                  title={`Supprimer l'option ${opt.name}`}
                  aria-label={`Supprimer l'option ${opt.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Badges des valeurs existantes */}
              <div className="flex flex-wrap gap-2 min-h-6">
                {opt.values.length === 0 ? (
                  <span className="text-xs italic text-[#8D98AF]">
                    Aucune valeur ajoutée pour cette option.
                  </span>
                ) : (
                  opt.values.map((val, valIndex) => (
                    <span
                      key={val + valIndex}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-ink shadow-sm"
                      style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
                    >
                      <span>{val}</span>
                      <button
                        type="button"
                        onClick={() => removeValueFromOption(optIndex, valIndex)}
                        className="text-[#C8265A] hover:text-[#9A1942] -mr-1 p-0.5"
                        aria-label={`Supprimer la valeur ${val}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Champ d'ajout de valeurs */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  ref={(el) => { inputRefs.current[optIndex] = el; }}
                  type="text"
                  value={newValueInputs[optIndex] || ""}
                  onChange={(e) =>
                    setNewValueInputs((prev) => ({
                      ...prev,
                      [optIndex]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addValueToOption(optIndex);
                    }
                  }}
                  onBlur={() => {
                    if ((newValueInputs[optIndex] || "").trim()) {
                      addValueToOption(optIndex);
                    }
                  }}
                  placeholder={`Ajouter (ex: ${
                    opt.name === "Taille" ? "S, M, L" : "Rouge, Bleu"
                  }) — Entrée pour valider`}
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none text-[#0F1E3D] bg-[#FFFBF2] border-[1.5px] border-ink placeholder:text-[#8D98AF] placeholder:font-normal"
                />
                <button
                  type="button"
                  onClick={() => addValueToOption(optIndex)}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-sun text-[#0F1E3D] border-[1.5px] border-ink shadow active:scale-95 transition-transform"
                >
                  Ajouter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerte valeurs en attente */}
      {hasPendingValues && (
        <div
          className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold"
          style={{
            backgroundColor: "rgba(255,200,61,0.1)",
            borderColor: "rgba(255,200,61,0.4)",
            color: "#FFC83D",
          }}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Des valeurs sont en cours de saisie. Appuie sur{" "}
            <strong>Entrée</strong> ou le bouton{" "}
            <strong>Ajouter</strong> pour les confirmer avant d&apos;enregistrer.
          </span>
        </div>
      )}

      {/* Résumé des options valides */}
      {options.length > 0 && (
        <div className="text-[11px] font-medium" style={{ color: "#8D98AF" }}>
          {(() => {
            const valid = options.filter(
              (o) => o.name.trim() && o.values.length > 0
            );
            if (valid.length === 0)
              return "⚠️ Aucune option avec des valeurs — les variantes ne seront pas enregistrées.";
            return `✓ ${valid.length} option${
              valid.length > 1 ? "s" : ""
            } : ${valid.map((o) => `${o.name} (${o.values.length})`).join(", ")}`;
          })()}
        </div>
      )}
    </div>
  );
}
