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
exports.onSelectionStatusUpdate = exports.onNewSelection = exports.onNewMessage = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const expo_server_sdk_1 = require("expo-server-sdk");
// Initialiser Firebase Admin
admin.initializeApp();
const db = admin.firestore();
// Initialiser Expo SDK
const expo = new expo_server_sdk_1.Expo({
    accessToken: process.env.EXPO_ACCESS_TOKEN, // Optionnel, mais recommandé en production
});
/**
 * Utilitaire pour envoyer une notification push Expo
 */
async function sendExpoPushNotification(pushToken, title, body, data) {
    // Vérifier que le token est valide
    if (!expo_server_sdk_1.Expo.isExpoPushToken(pushToken)) {
        console.error(`Token push invalide: ${pushToken}`);
        return;
    }
    const message = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
    };
    try {
        const chunks = expo.chunkPushNotifications([message]);
        const tickets = [];
        for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }
        console.log('✅ Notification envoyée:', { title, body, to: pushToken });
        // Vérifier les tickets pour les erreurs
        for (const ticket of tickets) {
            if (ticket.status === 'error') {
                console.error('❌ Erreur envoi notification:', ticket.message);
                if (ticket.details && ticket.details.error) {
                    console.error('Détails erreur:', ticket.details.error);
                }
            }
        }
    }
    catch (error) {
        console.error('❌ Erreur envoi notification push:', error);
    }
}
/**
 * Cloud Function: Notification nouveau message
 * Trigger: onCreate dans projects/{projectId}/messages/{messageId}
 */
exports.onNewMessage = functions.firestore
    .document('projects/{projectId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
    try {
        const message = snap.data();
        const projectId = context.params.projectId;
        console.log('💬 Nouveau message détecté:', {
            projectId,
            senderId: message.senderId,
            text: message.text.substring(0, 50) + '...'
        });
        // Récupérer les informations du projet pour trouver le destinataire
        const projectDoc = await db.collection('projects').doc(projectId).get();
        if (!projectDoc.exists) {
            console.error('❌ Projet introuvable:', projectId);
            return;
        }
        const project = projectDoc.data();
        // Déterminer le destinataire (l'autre personne du projet)
        let recipientId;
        if (message.senderId === project.chefUserId) {
            recipientId = project.clientUserId;
        }
        else {
            recipientId = project.chefUserId;
        }
        console.log('📨 Destinataire du message:', recipientId);
        // Récupérer les données du destinataire
        const recipientDoc = await db.collection('users').doc(recipientId).get();
        if (!recipientDoc.exists) {
            console.error('❌ Destinataire introuvable:', recipientId);
            return;
        }
        const recipient = recipientDoc.data();
        // Vérifier si les notifications sont activées et le token existe
        if (!recipient.notificationsEnabled || !recipient.pushToken) {
            console.log('⚠️ Notifications désactivées ou token manquant pour:', recipientId);
            return;
        }
        // Envoyer la notification push
        const title = `💬 Nouveau message de ${message.senderName}`;
        const body = message.text.length > 100
            ? `${message.text.substring(0, 100)}...`
            : message.text;
        await sendExpoPushNotification(recipient.pushToken, title, body, {
            type: 'message',
            projectId,
            fromUserId: message.senderId,
            fromUserName: message.senderName,
            messageText: message.text,
        });
    }
    catch (error) {
        console.error('❌ Erreur dans onNewMessage:', error);
    }
});
/**
 * Cloud Function: Notification nouvelle sélection
 * Trigger: onCreate dans projects/{projectId}/selections/{selectionId}
 */
exports.onNewSelection = functions.firestore
    .document('projects/{projectId}/selections/{selectionId}')
    .onCreate(async (snap, context) => {
    try {
        const selection = snap.data();
        const projectId = context.params.projectId;
        console.log('📋 Nouvelle sélection détectée:', {
            projectId,
            userId: selection.userId,
            label: selection.label,
            category: selection.category
        });
        // Récupérer les informations du projet pour trouver le chef
        const projectDoc = await db.collection('projects').doc(projectId).get();
        if (!projectDoc.exists) {
            console.error('❌ Projet introuvable:', projectId);
            return;
        }
        const project = projectDoc.data();
        const chefUserId = project.chefUserId;
        // Ne notifier que si la sélection ne vient pas du chef
        if (selection.userId === chefUserId) {
            console.log('⚠️ Sélection créée par le chef, pas de notification');
            return;
        }
        console.log('📨 Notification au chef:', chefUserId);
        // Récupérer les données du chef
        const chefDoc = await db.collection('users').doc(chefUserId).get();
        if (!chefDoc.exists) {
            console.error('❌ Chef introuvable:', chefUserId);
            return;
        }
        const chef = chefDoc.data();
        // Vérifier si les notifications sont activées et le token existe
        if (!chef.notificationsEnabled || !chef.pushToken) {
            console.log('⚠️ Notifications désactivées ou token manquant pour le chef:', chefUserId);
            return;
        }
        // Récupérer le nom du client qui a fait la sélection
        const clientDoc = await db.collection('users').doc(selection.userId).get();
        const clientName = clientDoc.exists
            ? clientDoc.data().displayName
            : 'Un client';
        // Envoyer la notification push
        const title = `📋 Nouvelle sélection de ${clientName}`;
        const body = `${selection.label} (${selection.category})${selection.note ? ` - "${selection.note}"` : ''}`;
        await sendExpoPushNotification(chef.pushToken, title, body, {
            type: 'selection',
            projectId,
            fromUserId: selection.userId,
            fromUserName: clientName,
            selectionLabel: selection.label,
            category: selection.category,
        });
    }
    catch (error) {
        console.error('❌ Erreur dans onNewSelection:', error);
    }
});
/**
 * Cloud Function: Notification changement de statut sélection
 * Trigger: onUpdate dans projects/{projectId}/selections/{selectionId}
 */
exports.onSelectionStatusUpdate = functions.firestore
    .document('projects/{projectId}/selections/{selectionId}')
    .onUpdate(async (change, context) => {
    try {
        const beforeData = change.before.data();
        const afterData = change.after.data();
        const projectId = context.params.projectId;
        // Vérifier si le statut a changé
        if (beforeData.status === afterData.status) {
            return; // Pas de changement de statut
        }
        console.log('🔄 Statut sélection modifié:', {
            projectId,
            selectionId: context.params.selectionId,
            oldStatus: beforeData.status,
            newStatus: afterData.status,
        });
        // Notifier le client seulement si le statut change vers 'validated' ou 'rejected'
        if (afterData.status === 'validated' || afterData.status === 'rejected') {
            // Récupérer les données du client
            const clientDoc = await db.collection('users').doc(afterData.userId).get();
            if (!clientDoc.exists) {
                console.error('❌ Client introuvable:', afterData.userId);
                return;
            }
            const client = clientDoc.data();
            // Vérifier si les notifications sont activées et le token existe
            if (!client.notificationsEnabled || !client.pushToken) {
                console.log('⚠️ Notifications désactivées ou token manquant pour le client:', afterData.userId);
                return;
            }
            // Préparer le message
            const statusText = afterData.status === 'validated' ? 'validée' : 'rejetée';
            const statusEmoji = afterData.status === 'validated' ? '✅' : '❌';
            const title = `${statusEmoji} Sélection ${statusText}`;
            const body = `Votre sélection "${afterData.label}" a été ${statusText} par le chef de projet`;
            await sendExpoPushNotification(client.pushToken, title, body, {
                type: 'selection_status',
                projectId,
                selectionLabel: afterData.label,
                status: afterData.status,
                reviewNote: afterData.reviewNote,
            });
        }
    }
    catch (error) {
        console.error('❌ Erreur dans onSelectionStatusUpdate:', error);
    }
});
//# sourceMappingURL=index.js.map