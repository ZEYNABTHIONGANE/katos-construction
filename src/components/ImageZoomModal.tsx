import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImageZoomModalProps {
  visible: boolean;
  imageUri: string;
  description?: string;
  onClose: () => void;
}

export default function ImageZoomModal({
  visible,
  imageUri,
  description,
  onClose
}: ImageZoomModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  const handleImagePress = () => {
    setIsZoomed(!isZoomed);
  };

  const handleModalClose = () => {
    setIsZoomed(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleModalClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
      <View style={styles.modalContainer}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header avec boutons */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleModalClose}>
              <MaterialIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={handleImagePress}>
              <MaterialIcons name={isZoomed ? "zoom-out" : "zoom-in"} size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Zone d'image zoomable */}
          <View style={styles.imageContainer}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              centerContent
            >
              <TouchableOpacity onPress={handleImagePress} activeOpacity={0.9}>
                <Image
                  source={{ uri: imageUri }}
                  style={[
                    styles.image,
                    isZoomed && styles.imageZoomed
                  ]}
                  resizeMode={isZoomed ? "cover" : "contain"}
                />
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Description en bas */}
          {description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>{description}</Text>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  zoomButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight * 0.7,
    maxWidth: screenWidth,
    maxHeight: screenHeight * 0.7,
  },
  imageZoomed: {
    width: screenWidth * 2,
    height: screenHeight * 1.5,
    maxWidth: screenWidth * 2,
    maxHeight: screenHeight * 1.5,
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  descriptionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'FiraSans_400Regular',
  },
});