# SideralFrontend
Sideral is an enterprise social network with project management and document management system

## Démarrage

### Prérequis
- Node.js 22+ (LTS conseillée) et npm
- Backend `SideralBackend` démarré sur `http://localhost:5000`

### Installation et lancement
```bash
npm install
npm start          # http://localhost:4200
npm run build      # build de production dans dist/sideral
```

### Configuration
L'URL de l'API est définie par `apiUrl` :
- `src/environments/environment.development.ts` (utilisé par `npm start`) : `http://localhost:5000/api`
- `src/environments/environment.ts` (production) : `/api` (API servie derrière le même domaine / reverse proxy)

### Structure
```
src/app/
├── core/          # transverse : modèles, services HTTP, intercepteur JWT, guards, utilitaires
├── layout/shell/  # barre de navigation + conteneur des pages authentifiées
└── pages/         # pages chargées en lazy loading
    ├── login/
    ├── home/
    ├── profile/
    └── admin/users/   # liste + formulaire (rôle ADMIN)
```

Authentification : access token + refresh token stockés dans le `localStorage`. L'intercepteur ajoute le header `Authorization: Bearer …` et, sur une réponse 401, tente un unique rafraîchissement du token avant de rejouer la requête (sinon déconnexion).
