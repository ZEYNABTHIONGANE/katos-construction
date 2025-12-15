# Guide de Dépannage Vidéo - Application Mobile Katos

## Problèmes Courants et Solutions

### 1. Vidéos qui ne se lisent pas

#### Causes possibles :
- **Format vidéo non supporté** : Vérifiez que le format est MP4, MOV, ou WebM
- **URL invalide ou expirée** : Contrôlez l'URL de la vidéo dans Firebase Storage
- **Problème de connexion** : Vérifiez la connexion internet
- **Permissions Firebase** : Assurez-vous que les règles permettent l'accès

#### Solutions :
```typescript
// 1. Vérifier le format dans le composant VideoPlayer
const supportedFormats = ['mp4', 'mov', 'webm', 'avi'];
const fileExtension = videoUrl.split('.').pop()?.toLowerCase();
if (!supportedFormats.includes(fileExtension)) {
  console.warn('Format vidéo non supporté:', fileExtension);
}

// 2. Ajouter des fallbacks dans le composant
<VideoPlayer
  source={{ uri: videoUrl }}
  onError={(error) => {
    console.error('Erreur vidéo:', error);
    // Essayer avec une URL de secours ou afficher un message d'erreur
  }}
/>
```

### 2. Vidéos qui chargent lentement

#### Causes possibles :
- **Taille de fichier trop importante**
- **Pas de compression** lors de l'upload
- **Pas de thumbnail généré**

#### Solutions :
```typescript
// Compresser les vidéos lors de l'upload
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Videos,
  quality: 0.7, // Réduire la qualité
  videoMaxDuration: 60, // Limiter la durée
});

// Générer des thumbnails automatiquement
import { generateThumbnailAsync } from 'expo-video-thumbnails';

const generateThumbnail = async (videoUri: string) => {
  try {
    const { uri } = await generateThumbnailAsync(videoUri, {
      time: 1000, // 1 seconde dans la vidéo
    });
    return uri;
  } catch (error) {
    console.error('Erreur génération thumbnail:', error);
    return null;
  }
};
```

### 3. Problèmes de contrôles vidéo

#### Solutions implementées dans VideoPlayer.tsx :
- **Contrôles natifs** : `useNativeControls={true}`
- **Contrôles personnalisés** : Implémentation avec boutons play/pause
- **Gestion d'erreur** : Bouton de rechargement automatique

### 4. Problèmes spécifiques iOS/Android

#### iOS :
```typescript
// Dans app.json, s'assurer que les permissions sont correctes
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "L'app a besoin d'accès à la caméra pour les photos/vidéos",
        "NSMicrophoneUsageDescription": "L'app a besoin d'accès au micro pour les vidéos"
      }
    }
  }
}
```

#### Android :
```typescript
// Dans app.json
{
  "expo": {
    "android": {
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

### 5. Optimisations de Performance

> [!DATE] **État actuel (Déc 2025)**
> L'application utilise actuellement l'URL de la vidéo comme thumbnail (`ChefGalleryScreen.tsx`). Cela peut causer des ralentissements significatifs lors du chargement de la galerie.

#### Lazy Loading des vidéos :
```typescript
const [videoLoaded, setVideoLoaded] = useState(false);

// Ne charger la vidéo qu'au moment de l'affichage
const loadVideo = () => {
  setVideoLoaded(true);
};

return (
  <View>
    {!videoLoaded ? (
      <TouchableOpacity onPress={loadVideo}>
        {/* TODO: Implémenter la génération de vrais thumbnails */}
        <Image source={{ uri: thumbnailUrl || videoUrl }} />
        <MaterialIcons name="play-circle-filled" size={48} />
      </TouchableOpacity>
    ) : (
      <VideoPlayer source={{ uri: videoUrl }} />
    )}
  </View>
);
```

#### Mise en cache des vidéos :
```typescript
// Utiliser expo-file-system pour la mise en cache
import * as FileSystem from 'expo-file-system';

const cacheVideo = async (videoUrl: string, videoId: string) => {
  const fileUri = `${FileSystem.cacheDirectory}${videoId}.mp4`;

  try {
    const { uri } = await FileSystem.downloadAsync(videoUrl, fileUri);
    return uri;
  } catch (error) {
    console.error('Erreur mise en cache:', error);
    return videoUrl; // Fallback sur URL originale
  }
};
```

## Configuration Firebase Storage

### Règles de sécurité optimisées :
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Règles pour les vidéos de chantier
    match /chantiers/{chantierId}/gallery/{mediaId} {
      allow read: if request.auth != null &&
        (request.auth.uid in resource.metadata.allowedUsers ||
         resource.metadata.visibility == 'public');
      allow write: if request.auth != null &&
        request.auth.uid in resource.metadata.allowedUsers;
    }
  }
}
```

### CORS Configuration :
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "maxAgeSeconds": 3600
  }
]
```

## État de l'Implémentation Actuelle

### Application Mobile (`katos-app`)
- **Upload** : Géré dans `ChefGalleryScreen.tsx`
- **Contraintes** :
  - Durée max : **60 secondes** (Code: `videoMaxDuration: 60`)
  - Qualité : 0.7 (compression activée)
  - Format : Dépend de l'OS (MP4/MOV)
- **Service** : Utilise `storageService.uploadMediaFromUri` avec `fetch` + `blob`
- **Miniatures** : ⚠️ Pas de génération de miniature dédiée. L'URL de la vidéo est utilisée comme miniature.

### Backoffice (`katos-backoffice`)
- **Upload** : ⚠️ **Non supporté**. Le `MultiImageUploader` n'accepte que les images (`image/*`).
- **Visualisation** : Les vidéos uploadées depuis le mobile peuvent ne pas s'afficher correctement dans les galeries du backoffice si elles sont traitées comme des images (`<img>` vs `<video>`).

## Tests et Debug

### Activer les logs détaillés :
```typescript
// Dans votre composant de debug
const DEBUG_VIDEO = __DEV__; // true en développement

if (DEBUG_VIDEO) {
  console.log('Video URL:', videoUrl);
  console.log('Video metadata:', videoMetadata);
  console.log('Supported formats:', Video.SUPPORTED_FORMATS);
}
```

### Test de connectivité :
```typescript
import NetInfo from '@react-native-async-storage/async-storage';

const checkConnectivity = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    Alert.alert('Pas de connexion', 'Vérifiez votre connexion internet');
    return false;
  }
  return true;
};
```

## Monitoring et Analytics

### Suivre les erreurs vidéo :
```typescript
import analytics from '@react-native-firebase/analytics';

const logVideoError = (error: string, videoId: string) => {
  analytics().logEvent('video_error', {
    error_message: error,
    video_id: videoId,
    timestamp: new Date().toISOString(),
  });
};
```

## Checklist de Vérification

### Avant le déploiement :
- [ ] Formats vidéo supportés testés (MP4, MOV)
- [ ] Gestion d'erreur implémentée
- [ ] Thumbnails générés automatiquement (⚠️ Point critique de performance à implémenter)
- [ ] Compression vidéo configurée (Actif: qualité 0.7)
- [ ] Permissions iOS/Android configurées
- [ ] Règles Firebase Storage vérifiées
- [ ] Tests sur connexion lente
- [ ] Tests sur différents appareils

### En cas de problème persistent :
1. Vérifier si la vidéo dépasse 60 secondes (limite hardcodée)
2. Vérifier les logs dans la console
3. Tester sur un appareil physique (pas seulement simulateur)
4. Vérifier les permissions d'accès Firebase
5. Tester avec une vidéo simple (URL publique)
6. Vérifier la configuration CORS de Firebase Storage