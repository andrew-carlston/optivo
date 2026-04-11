"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import "./avatar.scss";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials = fallback
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("avatar", `avatar--${size}`, className)}>
      {src && !imgError ? (
        <img
          src={src}
          alt={alt || fallback}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="avatar__img"
        />
      ) : (
        <span className="avatar__initials">{initials}</span>
      )}
    </div>
  );
}
