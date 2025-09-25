import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';

import { Media } from '../types/media';

const { width: screenWidth } = Dimensions.get('window');
const cardSize = (screenWidth - 45) / 2; // 2 colonnes avec marges

interface MediaCardProps {
  media: Media;
  onPress: (media: Media) => void;
  accessibilityHint?: string;
}

export default function MediaCard({ media, onPress, accessibilityHint }: MediaCardProps) {
  const renderMediaPreview = () => {
    switch (media.type) {
      case 'image':
        return (
          <Image
            source={{ uri: media.downloadURL }}
            style={styles.mediaPreview}
            resizeMode="cover"
          />
        );

      case 'video':
        return (
          <View style={styles.videoPreview}>
            <Image
              source={{ uri: media.thumbnailUrl || media.downloadURL }}
              style={styles.mediaPreview}
              resizeMode="cover"
            />
            <View style={styles.videoOverlay}>
              <Text style={styles.videoIcon}>▶️</Text>
            </View>
          </View>
        );

      case 'document':
        return (
          <View style={styles.documentPreview}>
            <Text style={styles.documentIcon}>📄</Text>
            <Text style={styles.documentName} numberOfLines={2}>
              {media.title || 'Document'}
            </Text>
          </View>
        );

      default:
        return (
          <View style={styles.unknownPreview}>
            <Text style={styles.unknownIcon}>📎</Text>
          </View>
        );
    }
  };

  const getFormattedDate = () => {
    return media.createdAt.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const getFormattedSize = () => {
    if (!media.size) return '';

    const sizeInMB = media.size / (1024 * 1024);
    if (sizeInMB < 1) {
      const sizeInKB = media.size / 1024;
      return `${sizeInKB.toFixed(0)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(media)}
      accessibilityRole="button"
      accessibilityLabel={media.title || 'Consulter le média'}
      accessibilityHint={accessibilityHint}
    >
      <View style={styles.mediaContainer}>
        {renderMediaPreview()}
      </View>

      <View style={styles.infoContainer}>
        {media.title && (
          <Text style={styles.title} numberOfLines={1}>
            {media.title}
          </Text>
        )}

        <Text style={styles.date}>{getFormattedDate()}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.type}>
            {media.type === 'image' ? '🖼️' : media.type === 'video' ? '🎥' : '📄'}
          </Text>
          {media.size && (
            <Text style={styles.size}>{getFormattedSize()}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardSize,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mediaContainer: {
    width: '100%',
    height: cardSize * 0.75,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
  },
  videoPreview: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoIcon: {
    fontSize: 32,
  },
  documentPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  documentIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  documentName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  unknownPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  unknownIcon: {
    fontSize: 48,
  },
  infoContainer: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  type: {
    fontSize: 16,
  },
  size: {
    fontSize: 11,
    color: '#999',
  },
});
