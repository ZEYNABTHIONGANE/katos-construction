import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MaterialIcons } from '@expo/vector-icons';
import { ResizeMode } from 'expo-av'; // Keep for prop compatibility if needed, though expo-video uses string
import { optimizeCloudinaryVideoUrl } from '../utils/cloudinaryUtils';

// Map legacy props to new ones
interface VideoPlayerProps {
  source: { uri: string };
  style?: any;
  resizeMode?: ResizeMode; // Kept for compatibility, mostly mapped to contentFit
  shouldPlay?: boolean;
  isLooping?: boolean;
  useNativeControls?: boolean;
  showCustomControls?: boolean;
  allowsFullscreen?: boolean;
  onError?: (error: string) => void;
  onLoad?: () => void;
}

export default function VideoPlayer({
  source,
  style,
  resizeMode = ResizeMode.CONTAIN,
  shouldPlay = false,
  isLooping = false,
  useNativeControls = true,
  showCustomControls = false, // expo-video has good native controls, custom ones are complex to reimplement fully
  allowsFullscreen = true,
  onError,
  onLoad,
}: VideoPlayerProps) {
  // Optimiser l'URL si c'est du Cloudinary
  const optimizedUri = useMemo(() => {
    return optimizeCloudinaryVideoUrl(source.uri);
  }, [source.uri]);

  // Configurer le player expo-video
  const player = useVideoPlayer(optimizedUri, (player) => {
    player.loop = isLooping;
    player.staysActiveInBackground = false;
    // Autoplay based on shouldPlay if provided initially
    if (shouldPlay) {
      player.play();
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync props with player state
  useEffect(() => {
    if (!player) return;

    // Looping
    player.loop = isLooping;

    // Playback state
    if (shouldPlay && !player.playing) {
      player.play();
    } else if (!shouldPlay && player.playing) {
      player.pause();
    }
  }, [player, shouldPlay, isLooping]);

  // Event listeners
  useEffect(() => {
    if (!player) return;

    // Loading handling using status changes
    // expo-video doesn't have a simple "onLoad" callback, we watch status
    const subscription = player.addListener('statusChange', (status) => {
      if (status.status === 'readyToPlay') {
        setLoading(false);
        onLoad?.();
      }
      if (status.status === 'error') {
        const errorMsg = 'Erreur lors du chargement de la vidéo';
        console.error('Video Player Error:', status);
        setError(errorMsg);
        onError?.(errorMsg);
        setLoading(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  const retryLoad = () => {
    setError(null);
    setLoading(true);
    player.replace(source.uri);
    if (shouldPlay) player.play();
  };

  if (error) {
    return (
      <View style={[style, styles.errorContainer]}>
        <MaterialIcons name="error" size={48} color="#F44336" />
        <Text style={styles.errorText}>Erreur de lecture</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryLoad}>
          <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[style, styles.container]}>
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen={allowsFullscreen}
        allowsPictureInPicture
        nativeControls={useNativeControls}
        contentFit={resizeMode === ResizeMode.COVER ? 'cover' : 'contain'}
      />

      {loading && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#E96C2E" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    overflow: 'hidden', // VideoView might overflow depending on styling
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    pointerEvents: 'none', // Allow clicks to pass through if needed
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E96C2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 4,
  },
});