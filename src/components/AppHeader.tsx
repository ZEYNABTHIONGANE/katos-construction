import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showNotification?: boolean;
  onNotificationPress?: () => void;
  showProfile?: boolean;
  onProfilePress?: () => void;
}

export default function AppHeader({
  title,
  showBack = false,
  onBackPress,
  showNotification = false,
  onNotificationPress,
  showProfile = false,
  onProfilePress,
}: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBack ? (
          <TouchableOpacity style={styles.iconButton} onPress={onBackPress}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>

      <View style={styles.centerSection}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.rightSection}>
        {showNotification && (
          <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
            <MaterialIcons name="notifications" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        {showProfile && (
          <TouchableOpacity style={styles.iconButton} onPress={onProfilePress}>
            <MaterialIcons name="account-circle" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        {!showNotification && !showProfile && <View style={styles.iconPlaceholder} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2B2E83',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  leftSection: {
    width: 40,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'FiraSans_700Bold',
  },
  iconButton: {
    padding: 8,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
  },
});