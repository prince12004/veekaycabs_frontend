/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  alt: string;
  className?: string;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

// Blog covers carry text and come in several shapes (16:9, 3:2), so they are
// never cropped: the full image sits centred in its box, and a blurred copy of
// it fills any leftover space. The parent must be `relative` with a set size.
export default function CoverImage({ src, alt, className, onError }: Props) {
  return (
    <>
      <img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl" />
      <img src={src} alt={alt} loading="lazy" onError={onError} className={cn("absolute inset-0 h-full w-full object-contain", className)} />
    </>
  );
}
