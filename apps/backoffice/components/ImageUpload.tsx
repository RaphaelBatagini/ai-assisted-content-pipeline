"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      setUploading(true);
      try {
        const resp = await api.post("/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        onChange(resp.data.url);
      } catch {
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className={cn("space-y-2", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[120px]",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50",
          uploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <Upload className="w-6 h-6 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              {isDragActive ? "Drop image here" : "Drag & drop or click to upload"}
            </p>
          </>
        )}
      </div>
      {value && (
        <div className="relative inline-block">
          <Image
            src={value}
            alt="Preview"
            width={200}
            height={120}
            className="rounded-md object-cover border"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:opacity-90"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
