"use client";

import { useEffect, useRef, useState } from "react";
import { fileToBase64, getAttachmentDataUrl } from "@/lib/api";
import { Button, Field, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

export type PictureValue = { base64: string; fileName: string; contentType: string } | null;

/** Simple "add / view / replace / delete picture" control used by fees, salaries, expenses and profiles. */
export function PictureInput({
  label = "Picture / receipt",
  existingId,
  onChange,
  removeExisting,
  hint = "Optional — a photo of the paid receipt, or a student/teacher picture.",
  compact,
}: {
  label?: string;
  existingId?: number | null;
  onChange: (value: PictureValue) => void;
  removeExisting?: () => void;
  hint?: string;
  compact?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);
  useEffect(() => {
    let alive = true;
    if (!existingId || removed || preview) return;
    void getAttachmentDataUrl(existingId).then((url) => { if (alive && url) setPreview(url); });
    return () => { alive = false; };
  }, [existingId, removed, preview]);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await fileToBase64(file);
      setPreview(dataUrl);
      onChange({ base64: dataUrl, fileName: file.name, contentType: file.type || "image/png" });
    } finally {
      setBusy(false);
    }
  };

  const shown = preview ?? null;

  return (
    <Field label={label} hint={hint}>
      <div className={cn("flex items-center gap-3", compact && "gap-2")}>
        <div className="grid h-16 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-ink-300 bg-ink-50 text-[10px] text-ink-400 dark:border-ink-700 dark:bg-ink-800/50">
          {busy ? (
            <Spinner className="h-4 w-4" />
          ) : shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="preview" className="h-full w-full object-cover" />
          ) : (
            "No image"
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void pick(e.target.files?.[0])}
          />
          <Button size="sm" variant="outline" type="button" onClick={() => inputRef.current?.click()}>
            {shown ? "Replace picture" : "Add picture"}
          </Button>
          {shown ? (
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => {
                setPreview(null);
                onChange(null);
                setRemoved(true);
                if (inputRef.current) inputRef.current.value = "";
                removeExisting?.();
              }}
            >
              Delete
            </Button>
          ) : null}
        </div>
      </div>
    </Field>
  );
}
