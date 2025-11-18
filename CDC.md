# Cahier des charges – Simulation de feu de forêt

## 1. Contexte et objectif

Ce projet consiste à développer une application de simulation d’incendie de forêt.
La forêt est modélisée par une grille de cellules, et l’utilisateur peut configurer différents paramètres
(type de sol, densité de végétation, force du vent, taille de la grille).  
L’objectif est de visualiser l’impact de ces paramètres sur la propagation du feu.

L’application est composée :
- d’un front-end en Vue 3 + TypeScript
- d’un back-end Express (Node.js) pour la gestion de la configuration via une API.

---

## 2. Versionning

| Version | Spécifications principales                                                   |
|--------|-------------------------------------------------------------------------------|
| 1.0.0  | États des cases, choix de végétation, type de sol, taille de grille, vent   |
| 2.0.0  | Amélioration du modèle de vent (probas différenciées par voisin) |

---

## 3. Spécifications fonctionnelles – V1 (1.0.0)

### 3.1 Interface utilisateur

- Affichage de la taille de la grille : `Forêt {width} x {height}`.
- Contrôles utilisateur :
  - Largeur de la grille (min 5, max 200).
  - Hauteur de la grille (min 5, max 200).
  - Force du vent (0 = nul, 1 = modéré, 2 = fort, 3 = violent).
  - Type de sol : `humide`, `normal`, `sec`, `tres_sec`.
  - Densité de végétation : `continue`, `peu`, `espacee`, `clairsemee`.
- Boutons :
  - **Lancer** : démarre une nouvelle simulation.
  - **Pause** : met la simulation en pause.
  - **Reprendre** : relance une simulation en pause.
  - **Reset** : réinitialise l’état et relance une nouvelle simulation.

### 3.2 États des cellules

Chaque cellule de la grille peut être dans l’un des états suivants :

- `veg` : forêt intacte (végétation présente).
- `burning` : cellule en feu (compteur de durée interne).
- `hot` : cellule brûlée chaude (plus de flammes, mais encore chaude).
- `cold` : cellule brûlée froide (feu totalement éteint).
- `inert` : cellule sans végétation (case vide / roche / sol nu).

Ces états sont reflétés visuellement par des classes CSS (`.veg`, `.burning`, `.hot`, `.cold`, `.inert`).

### 3.3 Paramétrage de la simulation

- **Taille de la grille** :
  - Largeur `width` et hauteur `height` configurables.
- **Densité de végétation** (`vegetation`) :
  - `continue` : 100 % de végétation.
  - `peu` : ~95 % de végétation.
  - `espacee` : ~80 % de végétation.
  - `clairsemee` : ~50 % de végétation.
  - Les cases sans végétation sont marquées `inert`.
- **Type de sol** (`fieldType`) :
  - `humide` : faible probabilité de propagation.
  - `normal` : probabilité moyenne.
  - `sec`, `tres_sec` : probabilité élevée de propagation.
- **Vent** (`wind`) :
  - Valeur entière entre 0 et 3.
  - Influence la probabilité d’envoi de brandons (voir 3.4).

### 3.4 Déroulement d’une simulation

#### Initialisation

1. Génération de la grille `width x height`.
2. Génération du terrain en fonction de la densité de végétation :
   - Pour chaque cellule, tirage aléatoire ; si pas de végétation, la cellule est `inert`.
3. Sélection aléatoire de **3 cellules** parmi celles qui ont de la végétation.
4. Ces 3 cellules passent à l’état `burning` avec un compteur interne initial.

#### Tour de simulation

Un tour de simulation exécute les actions suivantes :

1. Récupération de la liste des cellules en feu (`burning`) et des cellules `hot`.
2. Pour chaque cellule de cette liste :
   - Calcul de ses voisins via `getNeighborhood` (gauche, droite, haut, bas, avec gestion des bords).
   - Pour chaque voisin potentiel :
     - Envoi d’un brandon avec une probabilité dépendant du vent (`canSendBrandon`).
     - Si la cellule voisine :
       - est valide (`isValidField`),
       - n’est pas déjà en feu (`burning`),
       - n’est pas inerte (`inert`),
       - n’est pas déjà brûlée (`bah`, `bac`),
       alors on teste la propagation du feu avec `tryToBurn`, dont la probabilité dépend du type de sol (`fieldType`).
     - Si le test réussit, la cellule voisine passe en `burning`.
3. Mise à jour des cellules en feu :
   - Décrémentation du compteur de chaque cellule `burning`.
   - Si le compteur atteint 0, la cellule passe à l’état `hot`.
4. Mise à jour des cellules `hot` :
   - Chaque cellule `hot` peut s’éteindre définitivement avec une certaine probabilité (`fireStop`) et passe à l’état `cold`.

#### Fin de la simulation

- La simulation se termine lorsque :
  - Il n’y a plus aucune cellule `burning`,
  - ET aucune cellule `hot`.

---

## 4. Spécifications techniques – V1

### 4.1 Front-end

- Framework : Vue 3 + `<script setup lang="ts">` + TypeScript.
- Modélisation des états :
  - `ref` pour `width`, `height`, `wind`, `fieldType`, `vegetation`.
  - `Set` et `Map` pour stocker les cellules :
    - `inert` : cellules vides.
    - `burning` : `Map<number, number>` id → timer.
    - `bah` : cellules brûlées chaudes.
    - `bac` : cellules brûlées froides.
- Boucle de simulation :
  - Fonction `loop()` déclenchée par `setTimeout`.

### 4.2 Back-end (IPC Express)

- Technologie : Node.js + Express.
- URL de base de l’API : `http://localhost:3000/api`.

#### Endpoints

- `GET /api/config`
  - Renvoie la configuration courante :
    - `width`, `height`, `wind`, `fieldType`, `vegetation`.
- `PUT /api/config`
  - Reçoit une configuration JSON depuis le front :
    - Met à jour les valeurs stockées côté serveur.
    - Ne lance pas la simulation (la simulation reste gérée côté front).

---

## 5. Spécifications fonctionnelles – V2 (2.0.0)

### 5.1 Objectif de la V2

Améliorer la prise en compte du vent dans la propagation du feu, en introduisant :
- Un modèle de probabilité plus réaliste, différencié selon la direction des voisins.

### 5.2 Nouvelles fonctionnalités

| Fonctionnalité       | Description                                                                 |
|----------------------|-----------------------------------------------------------------------------|
| Propagation orientée | Les voisins sous le vent ont une proba de propagation plus élevée.         |


---

## 6. Objectifs techniques

### V1
- Création de la grille dynamique.
- Gestion des différents états de cellules.
- Propagation du feu avec probabilités.
- IPC front/back via une API REST (`GET`/`PUT /api/config`).

### V2
- Refactor de la logique de propagation pour intégrer les probabilités du vent (hors des cases voisines) rendant un feu plus réaliste.
- Mise à jour de l’API (ajout du champ `wind_type`, par ex.).
- Ajustement des probabilités par voisin.
