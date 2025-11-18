
# 🚀 Projet EAU TERRE FEU

Ce projet utilise **Vue 3**, **Electron** et **Vite

---

## 🧰 Prérequis

Assurez-vous d’avoir installé :
- **Node.js** ≥ 16  
- **npm**

Vérifiez les versions installées :
```bash
node -v
npm -v
```

---

## ⚙️ Installation et exécution

### 1 Installer les dépendances
```bash
npm install
```

### 2 Lancer le serveur back

```bash
node backend/server.cjs
```

---

### 3 Lancer le serveur de développement
```bash
npm run dev
```
Le projet sera accessible sur :  
👉 [http://localhost:5173/](http://localhost:5173/)

---

## 📁 Structure du projet

```
eauterrefeu/
├─ backend/           # Code back
│  ├─ config.json
│  └─ server.cjs
│
├─ electron/           # Code principal Electron (main & preload)
│  ├─ main.ts
│  └─ preload.ts
│
├─ src/                # Application Vue (renderer)
│  ├─ assets/
│  ├─ components/
│  ├─ App.vue
│  └─ main.ts
│
├─ index.html          # Point d’entrée HTML
├─ vite.config.ts      # Configuration Vite + Electron
├─ package.json        # Scripts et dépendances
└─ tsconfig.json
```

---

## 🧩 Scripts disponibles

| Commande | Description |
|-----------|-------------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Compile le projet pour la production |
| `npm run preview` | Sert localement la version compilée |

---

## 🧠 Notes

- Le projet utilise **Vite** pour le bundling et **Electron** pour créer une application desktop.  
- Le code Vue s’exécute côté *renderer*, et Electron gère la fenêtre, les menus et l’accès au système.  
- Assurez-vous de bien vérifier le champ `"main"` du `package.json` en fonction de la sortie (`dist` ou `dist-electron`).
- N'hésitez pas à lire le cahier des charges `CDC.md`.

