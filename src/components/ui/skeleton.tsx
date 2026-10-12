import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true" // les lecteurs d'écran l'ignorent
      className={cn(
        "relative overflow-hidden bg-skeleton",
        // Le reflet : un pseudo-élément qui glisse (keyframe "shimmer" définie dans globals.css)
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer",
        "before:bg-linear-to-r before:from-transparent before:via-white/60 before:to-transparent",
        "motion-reduce:before:animate-none",
        className
      )}
      {...props}
    />
  );
}