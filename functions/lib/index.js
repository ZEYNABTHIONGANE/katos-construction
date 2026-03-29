"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onNotificationCreated = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const expo_server_sdk_1 = require("expo-server-sdk");
admin.initializeApp();
const expo = new expo_server_sdk_1.Expo();
exports.onNotificationCreated = functions.firestore
    .document("notifications/{notificationId}")
    .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (!data)
        return;
    const { userId, title, message } = data;
    if (!userId || !title || !message) {
        console.log("Missing required fields (userId, title, message)");
        return;
    }
    try {
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
        if (!expo_server_sdk_1.Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
            return;
        }
        const messages = [];
        messages.push({
            to: pushToken,
            sound: "default",
            title: title,
            body: message,
            data: { ...data },
        });
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];
        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log("Ticket chunk:", ticketChunk);
                tickets.push(...ticketChunk);
            }
            catch (error) {
                console.error("Error sending chunk:", error);
            }
        }
        console.log(`Notification sent to user ${userId} via Expo`);
    }
    catch (error) {
        console.error("Error in onNotificationCreated:", error);
    }
});
//# sourceMappingURL=index.js.map