import type { ResultKind } from "@/types/results";

// Cadrage de l'image selon le type : logo entier, visage/vidéo recadrés par le haut
export const imageFit = (kind: ResultKind) =>
  kind === "job"
    ? "object-contain p-6"
    : kind === "profile" || kind === "video"
      ? "object-cover object-top"
      : "object-cover";

export const imageBg = (kind: ResultKind) => (kind === "job" ? "bg-white" : "bg-muted");