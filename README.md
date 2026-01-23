# Katos Construction App 🏗️

Application mobile React Native pour les clients de Katos Construction, permettant de suivre l'avancement des projets de construction en temps réel.

## 🚀 Fonctionnalités

### ✅ Authentification
- Écran de démarrage avec animation
- Connexion sécurisée (demo: `client@katos.com` / `1234`)

### 🏠 Accueil
- Message de bienvenue personnalisé
- Carte du projet avec progression
- Actions rapides (chantier, chat, finitions)
- Dernières mises à jour du chantier

### 🏗️ Suivi de Chantier
- Galerie photos du chantier
- Timeline détaillée des phases
- Barre de progression globale
- Mises à jour en temps réel

### 💬 Messagerie
- Chat en temps réel avec le chef de chantier
- Interface type WhatsApp
- Envoi de messages et pièces jointes

### 🎨 Finitions
- Catalogue de matériaux par catégorie
- Sélection de finitions (peinture, carrelage, sanitaires)
- Panier de sélections
- Prix et fournisseurs

### 👤 Profil
- Informations personnelles
- Détails du projet
- Paramètres de l'application
- Déconnexion sécurisée

## 🛠️ Stack Technique

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Animations**: React Native Reanimated
- **Icônes**: @expo/vector-icons (MaterialIcons)
- **Styles**: StyleSheet (CSS pur, pas de librairie externe)

## 🎨 Design

### Couleurs
- **Bleu foncé**: `#003366` (primaire)
- **Or**: `#E0B043` (accent)
- **Gris clair**: `#F5F5F5` (arrière-plan)

### Style
- Design moderne et professionnel
- Coins arrondis et ombres légères
- Interface fluide et intuitive
- Expérience utilisateur rassurante

## 📱 Structure de Navigation

```
App
├── SplashScreen (2s animation + redirect)
├── LoginScreen (authentification)
└── HomeTabs (navigation principale)
    ├── HomeScreen (accueil)
    ├── ChantierScreen (suivi chantier)
    ├── ChatScreen (messagerie)
    ├── FinitionsScreen (catalogue matériaux)
    └── ProfilScreen (profil utilisateur)
```

## 🏗️ Architecture des Composants

### Composants Réutilisables
- `AppHeader` - En-tête avec navigation
- `ProjectCard` - Carte de projet avec progression
- `ProgressBar` - Barre de progression personnalisée
- `MaterialCard` - Carte de matériau avec sélection
- `ChatBubble` - Bulle de message stylisée
- `CategoryButton` - Bouton de catégorie rond

### Données Mock
Toutes les données sont simulées localement dans `src/data/mockData.ts`:
- Utilisateur client
- Projet de construction
- Messages de chat
- Catalogue de matériaux
- Historique des mises à jour

## 🚀 Installation & Lancement

```bash
# Installation des dépendances
yarn install

# Démarrage du serveur de développement
yarn start

# Lancement sur simulateur iOS
yarn ios

# Lancement sur émulateur Android
yarn android
```

## 📝 Compte de Démonstration

Pour tester l'application, utilisez ces identifiants :
- **Email**: `client@katos.com`
- **Mot de passe**: `1234`

## 🎯 Objectifs Atteints

✅ Interface utilisateur complète et fonctionnelle
✅ Navigation fluide entre tous les écrans
✅ Animations douces avec Reanimated
✅ Données mockées réalistes
✅ Design professionnel et cohérent
✅ Code TypeScript bien typé
✅ Composants réutilisables
✅ Expérience utilisateur optimisée

## 🔮 Évolutions Futures

- Intégration API backend
- Notifications push
- Upload de photos depuis l'app
- Signature électronique de documents
- Mode hors-ligne avec synchronisation
- Géolocalisation du chantier

---

**Katos Construction** - Votre maison, notre passion 🏠