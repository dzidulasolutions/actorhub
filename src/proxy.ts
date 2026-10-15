import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Toute page et toute route est protégée, sauf la page de connexion et ses routes
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login" || pathname.startsWith("/api/auth/")) return NextResponse.next();

  const cfg = getAuthConfig();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (cfg && (await verifySessionToken(token, cfg.sessionSecret))) return NextResponse.next();

  // Routes API : réponse JSON, pas de redirection
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: cfg ? "Non autorisé : connecte-toi" : "Accès non configuré sur le serveur" },
      { status: cfg ? 401 : 503 }
    );
  }

  // Pages : retour à la connexion
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

// Ignore les fichiers internes de Next et les fichiers statiques (polices, images)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|ttf|woff2?)$).*)"],
};