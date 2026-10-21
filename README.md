# ActorHub

**Collect. Explore. Export.**

Interface unique pour lancer des Actors Apify, explorer leurs résultats sous forme de cartes et exporter les
données utiles en JSON. Elle sert aussi à répondre à des offres d'emploi et à proposer ses services à des
entreprises. Sans base de données : tes données restent dans ton navigateur.

## Prérequis

- Node.js 20.9 ou plus récent (22 recommandé)
- Un compte Apify et un jeton API (Console Apify → Settings → API & Integrations)

## Installation

```bash
npm install
cp .env.example .env.local   # puis remplis les valeurs (voir ci-dessous)
npm run dev                  # http://localhost:3000
```

## Variables d'environnement (serveur uniquement)

| Variable | Obligatoire | Rôle |
|---|---|---|
| `APIFY_API_TOKEN` | oui | Jeton Apify. Jamais envoyé au navigateur. |
| `ACCESS_CODE` | oui | Code d'accès à l'app (8 caractères minimum, 12 ou plus recommandé). |
| `SESSION_SECRET` | oui | Secret de signature de session (32 caractères minimum). Génération : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `APIFY_MAX_CHARGE_USD` | non | Plafond de budget par collecte, en dollars (défaut 1). |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | non | Envoi direct d'emails avec Gmail (mot de passe d'application). Usage local. |
| `MAIL_FROM_NAME`, `MAIL_DAILY_LIMIT` | non | Nom d'expéditeur et plafond quotidien d'envois (défaut 30). |

Sans `ACCESS_CODE` et `SESSION_SECRET`, l'app refuse tout accès (par sécurité). Ne commite jamais `.env.local`.

## Utilisation

1. **Mon profil** : renseigne tes informations, importe ton CV (PDF, Word, texte) et décris tes services.
2. **Actors** : ajoute un Actor (identifiant `utilisateur/actor` ou lien apify.com) et son entrée JSON.
3. **Nouvelle recherche** : choisis l'Actor, vérifie, lance. Le statut se met à jour tout seul.
4. **Résultats** : cartes adaptées au type (lieu, offre, profil, vidéo), recherche, filtres, tri, sélection.
5. **Exporter** en JSON (données originales ou avec métadonnées), **Sauvegarder** (Historique) pour rouvrir
   une collecte sans payer de nouveau, ou **Ouvrir un fichier** exporté.
6. **Candidature** (offres) et **Proposition** (entreprises) : lettre ou message par modèle, PDF, copie,
   email pré-rempli ou envoi direct. **Suivi** : statuts et relances suggérées.

## Données et confidentialité

Actors, profil, sauvegardes, suivi : stockés dans ce navigateur (localStorage et IndexedDB), jamais sur un serveur.
Ils sont perdus si tu vides les données du site : télécharge régulièrement des copies (profil, exports JSON).
Aucun service d'IA n'est appelé par l'app. Le mode « copier-coller » prépare une consigne que tu colles toi-même
dans un chat de ton choix ; relis-la avant de la coller.

## Commandes

```bash
npm test            # tests unitaires (Vitest)
npx tsc --noEmit    # vérification des types
npm run lint        # analyse du code
npm run build && npm run start   # version de production en local
```

## Déploiement (Render)

`render.yaml` décrit le service (offre gratuite). Sur Render : New → Blueprint, connecte le dépôt (privé), puis
renseigne `ACCESS_CODE` et `APIFY_API_TOKEN` quand il les demande. `SESSION_SECRET` est généré automatiquement.

Limites : l'offre gratuite s'endort après 15 minutes d'inactivité (premier chargement d'environ une minute) et
**bloque l'envoi d'emails direct** (ports SMTP). Les boutons « Ouvrir dans Gmail » restent disponibles.

## Envoi d'emails avec Gmail (local)

1. Active la validation en deux étapes sur ton compte Google.
2. Crée un mot de passe d'application (`myaccount.google.com/apppasswords`).
3. Renseigne `GMAIL_USER` et `GMAIL_APP_PASSWORD` dans `.env.local`, redémarre.
4. Paramètres → Vérifier la configuration → Envoyer un email de test (à toi-même).

## Sécurité

Code d'accès et session signée (cookie httpOnly), toutes les routes `/api` protégées et limitées en débit,
validation stricte des identifiants Apify, en-têtes de sécurité (CSP, HSTS, anti-framing), contenus des résultats
affichés comme du texte (jamais du HTML), liens limités à http(s).

## Structure

```
src/app/        pages et routes (api/apify, api/mail, api/auth)
src/components/ interface (layout, actors, searches, results, letter, pitch, tracking, profile, settings)
src/lib/        logique : apify, normalisation, exploration, export, profil, score, lettres, suivi
src/hooks/      accès aux données locales
```