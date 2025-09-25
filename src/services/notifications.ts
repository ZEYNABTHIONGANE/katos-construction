import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';

import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User } from '../types/user';

/**
 * Configuration des notifications
 */
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Types pour les notifications
 */
export interface NotificationData {
  type: 'message' | 'selection' | 'test';
  projectId?: string;
  fromUserId?: string;
  fromUserName?: string;
  messageText?: string;
  selectionLabel?: string;
  [key: string]: any;  // Allow additional properties
}

/**
 * Obtenir le token Expo Push
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    console.log('📱 Demande de permission notifications...');

    if (!Device.isDevice) {
      console.warn('⚠️ Les notifications push ne fonctionnent que sur un appareil physique');
      return null;
    }

    if (Platform.OS === 'web') {
      console.warn('⚠️ Les notifications push Expo ne sont pas disponibles sur le web');
      return null;
    }

    // Vérifier les permissions existantes
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Demander la permission si nécessaire
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('❌ Permission notifications refusée');
      return null;
    }

    // Obtenir le token Expo Push
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (!projectId) {
      console.error('❌ Projet ID manquant pour Expo Push');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('✅ Token Expo Push obtenu:', token.data);
    return token.data;

  } catch (error) {
    console.error('❌ Erreur obtention token push:', error);
    return null;
  }
}

/**
 * Sauvegarder le token push dans le document utilisateur
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      pushToken: token,
      notificationsEnabled: true,
      updatedAt: new Date(),
    });

    console.log('✅ Token push sauvegardé pour utilisateur:', userId);
  } catch (error) {
    console.error('❌ Erreur sauvegarde token push:', error);
    throw new Error('Impossible de sauvegarder le token push');
  }
}

/**
 * Supprimer le token push (déconnexion)
 */
export async function removePushToken(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      pushToken: null,
      updatedAt: new Date(),
    });

    console.log('✅ Token push supprimé pour utilisateur:', userId);
  } catch (error) {
    console.error('❌ Erreur suppression token push:', error);
  }
}

/**
 * Mettre à jour les préférences notifications
 */
export async function updateNotificationSettings(
  userId: string,
  enabled: boolean
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      notificationsEnabled: enabled,
      updatedAt: new Date(),
    });

    console.log('✅ Préférences notifications mises à jour:', { userId, enabled });
  } catch (error) {
    console.error('❌ Erreur mise à jour préférences notifications:', error);
    throw new Error('Impossible de mettre à jour les préférences');
  }
}

/**
 * Initialiser les notifications pour un utilisateur
 */
export async function initializeNotifications(user: User): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      console.info('🔕 Notifications push ignorées sur le web');
      return;
    }

    // Obtenir le token push
    const token = await registerForPushNotifications();

    if (token) {
      // Sauvegarder le token dans Firestore
      await savePushToken(user.uid, token);
    }

    // Configurer les listeners pour les notifications reçues
    setupNotificationListeners();

  } catch (error) {
    console.error('❌ Erreur initialisation notifications:', error);
  }
}

/**
 * Configurer les listeners de notifications
 */
function setupNotificationListeners(): void {
  if (Platform.OS === 'web') {
    return;
  }

  // Notification reçue quand l'app est au premier plan
  Notifications.addNotificationReceivedListener(notification => {
    console.log('📨 Notification reçue:', notification);

    // On peut custom ici pour afficher une bannière ou jouer un son
    const data = notification.request.content.data as unknown as NotificationData;

    if (data.type === 'message') {
      console.log('💬 Nouveau message de:', data.fromUserName);
    } else if (data.type === 'selection') {
      console.log('📋 Nouvelle sélection:', data.selectionLabel);
    }
  });

  // Notification cliquée
  Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Notification cliquée:', response);

    const data = response.notification.request.content.data as unknown as NotificationData;

    // Naviguer vers l'écran approprié selon le type
    if (data.type === 'message') {
      // TODO: Naviguer vers ChatScreen
      console.log('Naviguer vers Chat');
    } else if (data.type === 'selection') {
      // TODO: Naviguer vers SelectionsScreen
      console.log('Naviguer vers Selections');
    }
  });
}

/**
 * Envoyer une notification locale (pour test)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: NotificationData
): Promise<void> {
  if (Platform.OS === 'web') {
    Alert.alert(title, body);
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data as Record<string, unknown> || {},
    },
    trigger: null, // Immédiat
  });
}
