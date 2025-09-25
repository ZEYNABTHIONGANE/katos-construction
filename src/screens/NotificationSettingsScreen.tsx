import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSessionStore } from '../store/session';
import { updateNotificationSettings, registerForPushNotifications, savePushToken, sendLocalNotification } from '../services/notifications';

interface Props {
  // Standalone screen - peut être appelé via Alert ou navigation personnalisée
}

export default function NotificationSettingsScreen({}: Props) {
  const { appUser } = useSessionStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(appUser?.notificationsEnabled ?? true);
  const [loading, setLoading] = useState(false);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (appUser?.notificationsEnabled !== undefined) {
      setNotificationsEnabled(appUser.notificationsEnabled);
    }
  }, [appUser]);

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!appUser) return;

    if (isWeb) {
      Alert.alert('Information', 'Les notifications push ne sont pas disponibles sur le web.');
      return;
    }

    setLoading(true);
    try {
      if (enabled) {
        // Réactiver les notifications
        const token = await registerForPushNotifications();
        if (token) {
          await savePushToken(appUser.uid, token);
        }
      }

      // Mettre à jour les préférences
      await updateNotificationSettings(appUser.uid, enabled);
      setNotificationsEnabled(enabled);

      Alert.alert(
        'Succès',
        enabled ? 'Notifications activées' : 'Notifications désactivées'
      );
    } catch (error) {
      console.error('❌ Erreur mise à jour notifications:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour les préférences');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (isWeb) {
      Alert.alert('Information', 'Les notifications push ne sont pas disponibles sur le web.');
      return;
    }

    try {
      await sendLocalNotification(
        '🧪 Test de notification',
        'Ceci est une notification de test pour vérifier que tout fonctionne correctement !',
        { type: 'test' }
      );
    } catch (error) {
      console.error('❌ Erreur test notification:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer la notification de test');
    }
  };

  const notificationTypes = [
    {
      id: 'messages',
      title: 'Nouveaux messages',
      description: 'Recevoir une notification pour chaque nouveau message',
      icon: '💬',
    },
    {
      id: 'selections',
      title: 'Sélections',
      description: appUser?.role === 'chef'
        ? 'Notifications quand un client fait une sélection'
        : 'Notifications quand le chef valide/rejette vos sélections',
      icon: '📋',
    },
    {
      id: 'project_updates',
      title: 'Mises à jour projet',
      description: 'Notifications importantes sur l\'avancement du projet',
      icon: '🏗️',
      disabled: true, // Coming soon
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📱 Paramètres des notifications</Text>
        <Text style={styles.headerSubtitle}>
          Gérez vos préférences de notification
        </Text>
      </View>

      {/* Toggle principal */}
      <View style={styles.section}>
        <View style={styles.mainToggle}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Notifications push</Text>
            <Text style={styles.toggleSubtitle}>
              {isWeb
                ? 'Fonctionnalité indisponible sur le web'
                : notificationsEnabled
                  ? 'Vous recevrez des notifications sur cet appareil'
                  : 'Aucune notification ne sera envoyée'
              }
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            disabled={loading || isWeb}
            trackColor={{ false: '#e0e0e0', true: '#2E7D3E' }}
            thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Types de notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Types de notifications</Text>
        <Text style={styles.sectionSubtitle}>
          {isWeb
            ? 'Les notifications push ne sont pas disponibles sur le web.'
            : notificationsEnabled
              ? 'Choisissez les types de notifications que vous souhaitez recevoir'
              : 'Activez d\'abord les notifications pour configurer les types'
          }
        </Text>

        {notificationTypes.map((type) => (
          <View
            key={type.id}
            style={[
              styles.notificationType,
              (!notificationsEnabled || type.disabled || isWeb) && styles.notificationTypeDisabled
            ]}
          >
            <Text style={styles.notificationIcon}>{type.icon}</Text>
            <View style={styles.notificationContent}>
              <Text style={[
                styles.notificationTitle,
                (!notificationsEnabled || type.disabled || isWeb) && styles.disabledText
              ]}>
                {type.title}
              </Text>
              <Text style={[
                styles.notificationDescription,
                (!notificationsEnabled || type.disabled || isWeb) && styles.disabledText
              ]}>
                {type.description}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled && !type.disabled && !isWeb}
              onValueChange={() => {
                // Pour l'instant, on ne peut pas désactiver individuellement
                // On pourrait ajouter cette fonctionnalité plus tard
              }}
              disabled={!notificationsEnabled || type.disabled || isWeb}
              trackColor={{ false: '#e0e0e0', true: '#2E7D3E' }}
              thumbColor={notificationsEnabled && !type.disabled && !isWeb ? '#fff' : '#f4f3f4'}
            />
            {type.disabled && (
              <Text style={styles.comingSoonBadge}>Bientôt</Text>
            )}
          </View>
        ))}
      </View>

      {/* Actions de test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test des notifications</Text>
        <TouchableOpacity
          style={[
            styles.testButton,
            (!notificationsEnabled || isWeb) && styles.testButtonDisabled
          ]}
          onPress={handleTestNotification}
          disabled={!notificationsEnabled || isWeb}
          accessibilityRole="button"
          accessibilityLabel="Tester les notifications"
          accessibilityState={{ disabled: !notificationsEnabled || isWeb }}
        >
          <Text style={styles.testButtonIcon}>🧪</Text>
          <Text style={[
            styles.testButtonText,
            (!notificationsEnabled || isWeb) && styles.disabledText
          ]}>
            Tester les notifications
          </Text>
        </TouchableOpacity>
      </View>

      {/* Informations techniques */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Token Push</Text>
          <Text style={styles.infoValue}>
            {appUser?.pushToken ? '✅ Configuré' : '❌ Non configuré'}
          </Text>

          <Text style={styles.infoTitle}>Rôle</Text>
          <Text style={styles.infoValue}>
            {appUser?.role === 'chef' ? '👔 Chef de projet' : '👤 Client'}
          </Text>

          <Text style={styles.infoTitle}>Projet</Text>
          <Text style={styles.infoValue}>
            {appUser?.projectId || 'Aucun projet assigné'}
          </Text>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2E7D3E" />
          <Text style={styles.loadingText}>Mise à jour en cours...</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Les notifications vous permettent de rester informé en temps réel
          des messages et mises à jour de votre projet.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2E7D3E',
    padding: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
  },
  mainToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 15,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  notificationType: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationTypeDisabled: {
    opacity: 0.5,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 30,
    textAlign: 'center',
  },
  notificationContent: {
    flex: 1,
    marginRight: 15,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  notificationDescription: {
    fontSize: 12,
    color: '#666',
  },
  disabledText: {
    color: '#999',
  },
  comingSoonBadge: {
    backgroundColor: '#4A90E2',
    color: 'white',
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontWeight: 'bold',
    position: 'absolute',
    right: 60,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  testButtonDisabled: {
    opacity: 0.5,
  },
  testButtonIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginTop: 10,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    color: '#333',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: 'white',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});
