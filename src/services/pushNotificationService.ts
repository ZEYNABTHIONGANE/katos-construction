import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../types/firebase';
import Constants from 'expo-constants';

// Configure how notifications are handled when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const pushNotificationService = {
  /**
   * Request permissions and get the Expo Push Token
   */
  async registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // Get the token from Expo
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
      
      if (!projectId) {
          console.error("No Project ID found for push notifications. Check app.config.ts");
          return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      })).data;

      console.log('Expo Push Token received:', token);

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2B2E83',
        });
      }

      return token;
    } catch (error) {
      console.error('Error during push notification registration:', error);
      return null;
    }
  },

  /**
   * Save the token to the user's document in Firestore
   */
  async saveTokenToFirestore(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.users, userId);
      await updateDoc(userRef, {
        expoPushToken: token,
      });
      console.log('Push token successfully saved to Firestore for user:', userId);
    } catch (error) {
      console.error('Error saving push token to Firestore:', error);
    }
  },

  /**
   * Send a push notification directly from the client (Option A)
   */
  async sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data || {},
      // Logo Katos (Android uniquement)
      icon: 'https://res.cloudinary.com/dnxfzj45y/image/upload/v1774835900/wsjvuuutqhyzime8d86n.png',
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const resData = await response.json();
      console.log('Push notification sent response:', resData);
      return resData;
    } catch (error) {
      console.error('Error sending push notification via Expo:', error);
    }
  },
};
