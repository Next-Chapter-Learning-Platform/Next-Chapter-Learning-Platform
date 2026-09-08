"use client";

import Image, { type ImageProps } from "next/image";
import { type ReactNode, useState } from "react";

type CoverImageProps = Omit<ImageProps, "onError"> & { fallback: ReactNode };

// Renders a Sanity image and falls back to the designed placeholder when the
// asset fails to load, instead of the browser's native broken-image box.
export function CoverImage({ fallback, alt, ...imageProps }: CoverImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <>{fallback}</>;
  }

  return <Image alt={alt} {...imageProps} onError={() => setFailed(true)} />;
}
