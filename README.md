# Katos App

Application mobile React Native avec TypeScript développée avec Expo.

## Setup rapide

### Prérequis
- Node.js 18+
- yarn
- Expo CLI

### Installation et lancement

```bash
# Installer les dépendances
yarn install

# Lancer l'application
yarn start

# Lancer sur iOS
yarn ios

# Lancer sur Android
yarn android

# Lancer sur Web
yarn web
```

### Scripts disponibles

- `yarn start` - Démarre le serveur de développement Expo
- `yarn ios` - Lance l'app sur simulateur iOS
- `yarn android` - Lance l'app sur émulateur Android
- `yarn web` - Lance l'app dans le navigateur
- `yarn lint` - Lance ESLint pour vérifier le code
- `yarn typecheck` - Vérifie les types TypeScript

## Technologies utilisées

- **Expo** - Plateforme de développement React Native
- **TypeScript** - Langage de programmation typé
- **React Navigation** - Navigation dans l'app (Native Stack + Bottom Tabs)
- **React Native Reanimated** - Animations performantes
- **Zustand** - Gestion d'état légère
- **Firebase** - Backend et authentification
- **Expo Notifications** - Notifications push
- **Expo Image Picker** - Sélection d'images
- **Expo File System** - Gestion des fichiers

## Configurer Firebase

### 1. Créer un projet Firebase

1. Allez sur [console.firebase.google.com](https://console.firebase.google.com)
2. Créez un nouveau projet Firebase
3. Ajoutez une application Web (icône `</>`)
4. Copiez la configuration Firebase

### 2. Activer les services Firebase

Dans la console Firebase, activez :

- **Authentication** > Sign-in method > Email/Password
- **Firestore Database** (mode test pour commencer)
- **Storage** (mode test pour commencer)
- **Cloud Messaging** (pour les notifications push)

### 3. Configuration des variables d'environnement

1. Copiez `.env.local` vers `.env.local.example` (pour git)
2. Remplissez `.env.local` avec vos clés Firebase :

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 4. Utilisation des services Firebase

```typescript
// Import des services
import { auth, db, storage } from './src/services/firebase';
import { colRef, docRef, typedColRef, withConverter } from './src/services/firestore';

// Exemple d'utilisation Firestore typé
interface User {
  id?: string;
  name: string;
  email: string;
  createdAt: Date;
}

const usersRef = typedColRef<User>('users');
```

**⚠️ Important :** Ajoutez `.env.local` à votre `.gitignore` pour ne pas committer vos clés secrètes.

## Schéma des Collections Firestore

### Collections principales

```
firestore/
├── users/{uid}                                    # Utilisateurs de l'app
├── projects/{projectId}                          # Projets des clients
├── catalog/{itemId}                              # Catalogue global des finitions
└── projects/{projectId}/
    ├── messages/{messageId}                      # Messages du projet (subcollection)
    ├── media/{mediaId}                          # Médias du projet (subcollection)
    └── selections/{selectionId}                 # Sélections du client (subcollection)
```

### Structure des données

#### Users (`/users/{uid}`)
```typescript
{
  uid: string;                    // Firebase Auth UID
  role: 'client' | 'chef';        // Rôle utilisateur
  displayName: string;            // Nom d'affichage
  email: string;                  // Email
  projectId?: string;             // ID projet (pour clients)
  createdAt: Date;
  updatedAt: Date;
}
```

#### Projects (`/projects/{id}`)
```typescript
{
  id: string;                     // ID unique
  clientId: string;               // UID du client
  title: string;                  // Titre du projet
  address?: string;               // Adresse
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  startDate?: Date;
  endDate?: Date;
}
```

#### Messages (`/projects/{projectId}/messages/{id}`)
```typescript
{
  id: string;                     // ID unique
  fromUid: string;                // Expéditeur
  text?: string;                  // Contenu texte
  mediaUrl?: string;              // URL média
  mediaType?: 'image' | 'video' | 'document';
  createdAt: Date;                // ⚡ Index: DESC
  isRead?: boolean;
  replyToId?: string;             // Réponse à un message
}
```

#### Media (`/projects/{projectId}/media/{id}`)
```typescript
{
  id: string;                     // ID unique
  type: 'image' | 'video';        // Type de média
  storagePath: string;            // Chemin Firebase Storage
  url?: string;                   // URL publique
  caption?: string;               // Légende
  category?: string;              // Catégorie (before, progress, after)
  createdAt: Date;                // ⚡ Index: DESC
  uploadedBy: string;             // UID uploader
  metadata?: object;              // Métadonnées fichier
}
```

#### Selections (`/projects/{projectId}/selections/{id}`)
```typescript
{
  id: string;                     // ID unique
  category: string;               // Catégorie (flooring, paint, etc.)
  itemId: string;                 // Référence catalog
  label: string;                  // Nom pour affichage
  note?: string;                  // Note client
  status: 'pending' | 'validated' | 'rejected';
  createdAt: Date;                // ⚡ Index: DESC
  selectedBy: string;             // UID sélecteur
  reviewedBy?: string;            // UID validateur
  reviewNote?: string;            // Commentaire chef
  quantity?: number;
  unit?: string;
  estimatedPrice?: number;
}
```

#### Catalog (`/catalog/{id}`)
```typescript
{
  id: string;                     // ID unique
  category: string;               // Catégorie principale
  subcategory?: string;           // Sous-catégorie
  label: string;                  // Nom produit
  description?: string;           // Description
  specs?: object;                 // Spécifications
  images?: string[];              // URLs images
  basePrice?: number;             // Prix indicatif
  isAvailable: boolean;           // Disponibilité
  isActive: boolean;              // Actif dans catalogue
  searchTerms: string[];          // ⚡ Index: recherche textuelle
  createdAt: Date;
  updatedAt: Date;
}
```

### Index Firestore requis

```javascript
// Collections principales
db.users: uid (automatique)
db.projects: clientId, createdAt DESC
db.catalog: category ASC, label ASC, isActive DESC, searchTerms

// Sous-collections
db.projects/{projectId}/messages: createdAt DESC, fromUid + createdAt DESC
db.projects/{projectId}/media: createdAt DESC, type + createdAt DESC
db.projects/{projectId}/selections: createdAt DESC, category + status, status + createdAt DESC
```

### Règles de sécurité Firestore

Les règles devront permettre :
- **Users** : lecture/écriture de son propre document seulement
- **Projects** : clients lisent/écrivent leur projet, chefs lisent tous
- **Messages/Media/Selections** : accès limité aux participants du projet
- **Catalog** : lecture pour tous, écriture pour admins seulement

## Notifications (Expo/FCM)

### Configuration des notifications push

L'application utilise Expo Push Notifications pour envoyer des notifications en temps réel. Voici les étapes de configuration :

#### 1. Configuration EAS Credentials

**Android (FCM)**
```bash
# 1. Créer/configurer le projet Firebase avec FCM activé
# 2. Télécharger google-services.json et le placer dans le projet
# 3. Configurer EAS credentials
eas credentials
```

**iOS (APNs)**
```bash
# 1. Configurer Apple Developer certificates
# 2. Créer Push Notification certificate
# 3. Configurer EAS credentials pour iOS
eas credentials --platform ios
```

#### 2. Variables d'environnement Cloud Functions

```env
EXPO_ACCESS_TOKEN=votre_token_expo_here
```

#### 3. Types de notifications

- **💬 Nouveaux messages** : Notification au destinataire lors d'un nouveau message
- **📋 Nouvelles sélections** : Notification au chef quand un client fait une sélection
- **✅ Validation sélection** : Notification au client quand le chef valide/rejette

#### 4. Triggers Cloud Functions

- `onNewMessage` : projects/{projectId}/messages/{messageId} onCreate
- `onNewSelection` : projects/{projectId}/selections/{selectionId} onCreate
- `onSelectionStatusUpdate` : projects/{projectId}/selections/{selectionId} onUpdate

#### 5. Test des notifications

1. Build et installation sur un appareil physique
2. Se connecter avec un utilisateur
3. Envoyer un message ou faire une sélection depuis un autre compte
4. Vérifier la réception de la notification

### Structure données utilisateur

Le modèle User inclut maintenant :
```typescript
interface User {
  // ... autres champs
  pushToken?: string;           // Token Expo Push
  notificationsEnabled?: boolean; // Préférences utilisateur
}
```

## Sécurité (MVP)

### Règles Firestore

Les règles de sécurité Firestore implémentent une protection basée sur les rôles :

#### Permissions par collection

**Users** (`/users/{uid}`)
- ✅ Lecture/écriture : propriétaire du document uniquement
- ❌ Accès cross-user bloqué

**Projects** (`/projects/{id}`)
- ✅ **Chefs** : accès global lecture/écriture (MVP simplifié)
- ✅ **Clients** : accès limité à leur `projectId` assigné
- ❌ Clients ne peuvent pas accéder aux projets d'autres clients

**Sous-collections** (`messages`, `media`, `selections`)
- ✅ Accès limité aux participants du projet (client assigné + chefs)
- ✅ **Selections** : clients peuvent créer/modifier leurs sélections en statut `pending`
- ✅ **Selections** : chefs peuvent valider/rejeter toutes les sélections
- ❌ Clients ne peuvent pas modifier les sélections validées/rejetées

**Catalog** (`/catalog/{id}`)
- ✅ **Lecture** : tous les utilisateurs authentifiés
- ✅ **Écriture** : chefs uniquement
- ❌ Clients ne peuvent pas modifier le catalogue

#### Fonctions de validation

```javascript
// Vérification du rôle via document Firestore
function isChef() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'chef';
}

// Vérification de participation au projet
function isProjectParticipant(projectId) {
  return isChef() || (isClient() && getClientProjectId() == projectId);
}
```

### Règles Storage

Protection des fichiers multimédia avec contrôles de type et taille :

#### Structure des chemins

```
/projects/{projectId}/media/{mediaId}/{filename}    # Médias projet
/projects/{projectId}/documents/{filename}          # Documents projet
/users/{userId}/profile/{filename}                  # Photos profil
/catalog/{category}/{itemId}/{filename}             # Images catalogue
```

#### Restrictions par type

**Médias projet** (`/projects/*/media/*`)
- ✅ **Images** : max 10MB, types `image/*`
- ✅ **Vidéos** : max 50MB, types `video/*`
- ✅ **Lecture** : participants du projet
- ✅ **Écriture** : chefs + clients du projet
- ✅ **Suppression** : chefs uniquement

**Documents projet** (`/projects/*/documents/*`)
- ✅ Max 20MB par fichier
- ✅ Accès identique aux médias

**Photos profil** (`/users/*/profile/*`)
- ✅ Max 5MB, images uniquement
- ✅ Propriétaire du compte uniquement
- ✅ Lecture par tous les utilisateurs authentifiés

**Images catalogue** (`/catalog/*/*`)
- ✅ Max 10MB, images uniquement
- ✅ Gestion par chefs uniquement
- ✅ Lecture par tous les utilisateurs authentifiés

### Déploiement des règles

```bash
# Déployer les règles Firestore
firebase deploy --only firestore:rules

# Déployer les règles Storage
firebase deploy --only storage

# Déployer les deux
firebase deploy --only firestore:rules,storage
```

### TODO - Améliorations futures

#### Sécurité avancée
- [ ] **Custom claims** pour rôles granulaires (admin, superviseur, etc.)
- [ ] **ACL par projet** au lieu d'accès global chef
- [ ] **Validation de propriétaire** sur création de documents
- [ ] **Rate limiting** et règles d'intégrité des données
- [ ] **Permissions projet-spécifiques** (gestionnaires, observateurs)

#### Storage avancé
- [ ] **Scan antivirus** intégré
- [ ] **Redimensionnement d'images** automatique
- [ ] **Watermarking** pour contenu sensible
- [ ] **URLs signées temporaires**
- [ ] **Audit logging** des opérations fichiers
- [ ] **Stratégies de sauvegarde** et versioning

#### Monitoring
- [ ] **Alertes** sur tentatives d'accès non autorisé
- [ ] **Métriques** d'utilisation par rôle
- [ ] **Dashboard** de sécurité temps réel

## Limitations Web
- 📸 Capture caméra indisponible sur navigateur : l'upload passe par des fichiers locaux.
- 🔔 Notifications push Expo non prises en charge : la bascule affiche un message d'information et un `Alert` est utilisé pour le test local.
- 🔐 Certaines APIs natives (permissions camera/gallerie) sont ignorées ou simulées côté web.

## Optimisations
- 💬 Chat paginé avec `limit` et chargement incrémental des messages Firestore (`loadOlder`).
- 🖼️ Galerie paginée avec bouton « Charger plus » et requêtes limitées à 24 médias.
- 📊 Statistiques médias calculées via `getCountFromServer` et mises à jour à la demande.
- 🔄 Actions de rafraîchissement réunies pour relancer simultanément données et compteurs.
