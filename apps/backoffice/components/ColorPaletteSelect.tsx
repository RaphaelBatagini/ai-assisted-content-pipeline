"use client";

import { cn } from "@/lib/utils";

const PALETTES = [
  { id: "ocean_breeze", label: "Ocean Breeze", colors: ["#0EA5E9", "#67E8F9", "#BAE6FD"] },
  { id: "forest_green", label: "Forest Green", colors: ["#16A34A", "#4ADE80", "#BBF7D0"] },
  { id: "sunset_orange", label: "Sunset Orange", colors: ["#EA580C", "#FB923C", "#FED7AA"] },
  { id: "midnight_blue", label: "Midnight Blue", colors: ["#1E3A8A", "#3B82F6", "#BFDBFE"] },
  { id: "rose_gold", label: "Rose Gold", colors: ["#BE185D", "#F472B6", "#FBD0E7"] },
  { id: "slate_gray", label: "Slate Gray", colors: ["#475569", "#94A3B8", "#E2E8F0"] },
  { id: "lavender_mist", label: "Lavender Mist", colors: ["#7C3AED", "#A78BFA", "#EDE9FE"] },
  { id: "warm_sand", label: "Warm Sand", colors: ["#92400E", "#D97706", "#FEF3C7"] },
];

interface ColorPaletteSelectProps {
  value: string;
  onChange: (val: string) => void;
}

export function ColorPaletteSelect({ value, onChange }: ColorPaletteSelectProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {PALETTES.map((palette) => (
        <button
          key={palette.id}
          type="button"
          onClick={() => onChange(palette.id)}
          className={cn(
            "rounded-lg border-2 p-2 space-y-1.5 transition-colors hover:border-primary",
            value === palette.id ? "border-primary" : "border-transparent bg-muted"
          )}
          title={palette.label}
        >
          <div className="flex gap-1">
            {palette.colors.map((c, i) => (
              <div
                key={i}
                className="h-4 rounded-sm flex-1"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground truncate">{palette.label}</p>
        </button>
      ))}
    </div>
  );
}
