import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

admin.initializeApp();

const expo = new Expo();

export const onNotificationCreated = functions.firestore
  .document("notifications/{notificationId}")
  .onCreate(async (snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    const data = snapshot.data();
    if (!data) return;

    const { userId, title, message } = data;

    if (!userId || !title || !message) {
      console.log("Missing required fields (userId, title, message)");
      return;
    }

    try {
      // Get the user's document to find their expoPushToken
      const userDoc = await admin.firestore().collection("users").doc(userId).get();
      if (!userDoc.exists) {
        console.log(`User ${userId} not found`);
        return;
      }

      const userData = userDoc.data();
      const pushToken = userData?.expoPushToken;

      if (!pushToken) {
        console.log(`No expoPushToken found for user ${userId}`);
        return;
      }

      // Check if the token is valid for Expo
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        return;
      }

      // Create the messages
      const messages: ExpoPushMessage[] = [];
      messages.push({
        to: pushToken,
        sound: "default",
        title: title,
        body: message,
        data: { ...data }, // Optional additional data
      });

      // Send the chunks to Expo
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          console.log("Ticket chunk:", ticketChunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error("Error sending chunk:", error);
        }
      }

      console.log(`Notification sent to user ${userId} via Expo`);
    } catch (error) {
      console.error("Error in onNotificationCreated:", error);
    }
  });
