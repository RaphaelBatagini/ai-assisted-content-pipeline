"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/utils";

interface SlugInputProps {
  value: string;
  onChange: (val: string) => void;
  watchValue?: string; // when this changes, auto-generate slug (unless manually edited)
}

export function SlugInput({ value, onChange, watchValue }: SlugInputProps) {
  const manuallyEdited = useRef(false);

  useEffect(() => {
    if (!manuallyEdited.current && watchValue !== undefined) {
      onChange(slugify(watchValue));
    }
  }, [watchValue, onChange]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground select-none">/</span>
      <Input
        value={value}
        onChange={(e) => {
          manuallyEdited.current = true;
          onChange(e.target.value);
        }}
        placeholder="my-site-slug"
        className="font-mono"
      />
    </div>
  );
}
