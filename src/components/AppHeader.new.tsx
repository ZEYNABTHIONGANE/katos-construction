import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface AppHeaderProps {
  title?: string;
  userName?: string;
  userAvatar?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showNotification?: boolean;
  onNotificationPress?: () => void;
  showProfile?: boolean;
  onProfilePress?: () => void;
  backgroundColor?: string;
  textColor?: string;
}

export default function AppHeader({
  title,
  userName,
  userAvatar,
  showBack = false,
  onBackPress,
  showNotification = false,
  onNotificationPress,
  showProfile = false,
  onProfilePress,
  backgroundColor = '#2B2E83',
  textColor = '#FFFFFF',
}: AppHeaderProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.leftSection}>
        {showBack ? (
          <TouchableOpacity style={styles.iconButton} onPress={onBackPress}>
            <MaterialIcons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
        ) : (
          <View style={styles.titleSection}>
            {title && <Text style={[styles.title, { color: textColor }]}>{title}</Text>}
            {userName && (
              <View>
                <Text style={[styles.greeting, { color: `${textColor}CC` }]}>Bonjour</Text>
                <Text style={[styles.userName, { color: textColor }]}>{userName} 👋</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.rightSection}>
        {showNotification && (
          <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
            <MaterialIcons name="notifications" size={24} color={textColor} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        )}

        {showProfile && userAvatar && (
          <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
            <Image source={{ uri: userAvatar }} style={styles.profileImage} />
          </TouchableOpacity>
        )}

        {showProfile && !userAvatar && (
          <TouchableOpacity style={styles.iconButton} onPress={onProfilePress}>
            <MaterialIcons name="account-circle" size={28} color={textColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  leftSection: {
    flex: 1,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'FiraSans_700Bold',
  },
  greeting: {
    fontSize: 14,
    marginBottom: 2,
    fontFamily: 'FiraSans_400Regular',
  },
  userName: {
    fontSize: 20,
    fontFamily: 'FiraSans_700Bold',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  profileButton: {
    marginLeft: 8,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});