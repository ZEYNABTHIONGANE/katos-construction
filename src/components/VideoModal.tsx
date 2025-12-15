import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import VideoPlayer from './VideoPlayer';

import { ResizeMode } from 'expo-av';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VideoModalProps {
  visible: boolean;
  videoUri: string;
  onClose: () => void;
}

export default function VideoModal({
  visible,
  videoUri,
  onClose
}: VideoModalProps) {

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
      <View style={styles.modalContainer}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Video Player */}
          <View style={styles.videoContainer}>
           {visible && videoUri ? (
              <VideoPlayer
                source={{ uri: videoUri }}
                style={styles.video}
                shouldPlay={true}
                useNativeControls
                allowsFullscreen
                resizeMode={ResizeMode.CONTAIN}
              />
           ) : null}
          </View>

          {/* Description removed */}
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
    justifyContent: 'flex-end', // Close button on right
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
    marginTop: 40,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
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
