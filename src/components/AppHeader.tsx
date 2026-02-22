import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useNavigation } from '@react-navigation/native';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showNotification?: boolean;
  onNotificationPress?: () => void;
  notificationCount?: number;
  showProfile?: boolean;
  onProfilePress?: () => void;
}

export default function AppHeader({
  title,
  showBack = false,
  onBackPress,
  showNotification = false,
  onNotificationPress,
  notificationCount = 0,
  showProfile = false,
  onProfilePress,
}: AppHeaderProps) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showBack && (
          <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerRight}>
        {showNotification && (
          <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
            <View>
              <MaterialIcons name="notifications" size={24} color="#fff" />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        {showProfile && (
          <TouchableOpacity style={styles.iconButton} onPress={onProfilePress}>
            <MaterialIcons name="account-circle" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2B2E83',
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  headerLeft: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    color: '#fff',
    fontFamily: 'FiraSans_700Bold',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E96C2E',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#2B2E83',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'FiraSans_700Bold',
    textAlign: 'center',
  },
});