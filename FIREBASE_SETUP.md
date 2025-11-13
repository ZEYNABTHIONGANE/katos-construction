# Firebase Configuration for Katos Mobile App

This document outlines the Firebase setup for the Katos Construction mobile application, ensuring complete consistency with the backoffice system.

## Project Configuration

### Firebase Project Details
- **Project ID**: `katos-construction`
- **Auth Domain**: `katos-construction.firebaseapp.com`
- **Storage Bucket**: `katos-construction.firebasestorage.app`
- **Region**: Default (us-central1)

### Enabled Firebase Services
1. **Authentication** - Email/Password authentication
2. **Firestore Database** - Real-time document database
3. **Cloud Storage** - File storage for images and documents

## Database Structure

The mobile app uses the same Firestore collections as the backoffice:

### Collections

#### `users`
```typescript
interface FirebaseUser {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  createdAt: Timestamp;
}
```

#### `clients`
```typescript
interface FirebaseClient {
  id?: string;
  nom: string;
  prenom: string;
  localisationSite: string;
  projetAdhere: string;
  status: 'En cours' | 'Terminé' | 'En attente';
  createdAt: Timestamp;
}
```

#### `projects`
```typescript
interface FirebaseProject {
  id?: string;
  name: string;
  description: string;
  images: string[];
  type: string;
  createdAt: Timestamp;
}
```

#### `materials`
```typescript
interface FirebaseMaterial {
  id?: string;
  name: string;
  category: string;
  price: number;
  image: string;
  supplier: string;
  description: string;
  createdAt: Timestamp;
}
```

## Security Rules

The application uses role-based security rules that allow:
- Authenticated users to read all collections
- Authenticated users to create, update, and delete documents
- Data validation to ensure document structure consistency

## Services Architecture

### Authentication Service
- `authService.signIn()` - User login
- `authService.signUp()` - User registration
- `authService.signOut()` - User logout
- `authService.onAuthStateChange()` - Auth state listener

### Data Services
- `clientService` - Client management operations
- `projectService` - Project management operations
- `materialService` - Material management operations
- `storageService` - File upload operations

### React Hooks
- `useAuth()` - Authentication state management
- `useFirebaseClients()` - Real-time client data
- `useFirebaseProjects()` - Real-time project data
- `useFirebaseMaterials()` - Real-time material data

## Environment Configuration

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBtX2iJAoJ9vwP3W5aUmiYfyrlVyspdzfE
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=katos-construction.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=katos-construction
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=katos-construction.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=390012951927
EXPO_PUBLIC_FIREBASE_APP_ID=1:390012951927:web:bcc9d12fb8495e73a0d572
```

## Real-time Data Synchronization

The mobile app maintains real-time synchronization with the backoffice through:
- Firestore real-time listeners
- Automatic data updates
- Offline support with local caching

## File Structure

```
src/
├── config/
│   ├── firebase.ts          # Firebase initialization
│   └── firestore.rules      # Security rules documentation
├── types/
│   └── firebase.ts          # TypeScript interfaces
├── services/
│   ├── authService.ts       # Authentication operations
│   ├── clientService.ts     # Client CRUD operations
│   ├── projectService.ts    # Project CRUD operations
│   ├── materialService.ts   # Material CRUD operations
│   ├── storageService.ts    # File upload operations
│   └── index.ts            # Service exports
├── hooks/
│   ├── useAuth.ts          # Authentication hook
│   ├── useFirebaseClients.ts # Client data hook
│   ├── useFirebaseProjects.ts # Project data hook
│   ├── useFirebaseMaterials.ts # Material data hook
│   └── index.ts            # Hook exports
└── components/
    └── FirebaseTest.tsx     # Integration test component
```

## Consistency with Backoffice

The mobile app configuration is 100% consistent with the backoffice system:

1. **Same Firebase Project** - Both apps connect to `katos-construction`
2. **Identical Data Models** - Same TypeScript interfaces and structures
3. **Consistent Security Rules** - Same authentication and authorization logic
4. **Synchronized Collections** - Both apps read/write to the same Firestore collections
5. **Real-time Updates** - Changes in backoffice are immediately reflected in mobile app

## Testing

Use the `FirebaseTest` component to verify:
- Firebase configuration loading
- Authentication service initialization
- Firestore collection connectivity
- Real-time data synchronization

```typescript
import { FirebaseTest } from './src/components/FirebaseTest';

// Add to your app for testing
<FirebaseTest />
```

## Deployment Considerations

1. **Environment Variables** - Use different .env files for development/production
2. **Security Rules** - Deploy the provided Firestore rules to Firebase console
3. **Authentication** - Configure email/password authentication in Firebase console
4. **Storage Rules** - Set up Cloud Storage security rules for file uploads

## Troubleshooting

- Ensure Firebase project is properly configured in Firebase console
- Verify environment variables are correctly set
- Check that Firestore security rules are deployed
- Confirm authentication is enabled in Firebase console
- Validate network connectivity for real-time features