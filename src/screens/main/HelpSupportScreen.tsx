import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpSupport'>;

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  isExpanded: boolean;
}

export default function HelpSupportScreen({ navigation }: Props) {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([
    {
      id: '1',
      question: 'Comment suivre l\'avancement de mon projet ?',
      answer: 'Vous pouvez suivre l\'avancement de votre projet en temps réel depuis la page d\'accueil. Un pourcentage d\'avancement et des mises à jour régulières vous permettent de rester informé.',
      isExpanded: false,
    },
    {
      id: '2',
      question: 'Comment contacter mon chef de projet ?',
      answer: 'Utilisez la messagerie intégrée pour communiquer directement avec votre chef de projet. Vous recevrez des notifications pour chaque nouveau message.',
      isExpanded: false,
    },
    {
      id: '3',
      question: 'Que faire en cas de problème technique ?',
      answer: 'En cas de problème technique, contactez notre support via l\'email support@katosconstruction.com ou utilisez le formulaire de contact ci-dessous.',
      isExpanded: false,
    },
    {
      id: '4',
      question: 'Comment modifier les détails de mon projet ?',
      answer: 'Pour modifier les détails de votre projet, contactez votre chef de projet qui pourra effectuer les changements nécessaires après validation.',
      isExpanded: false,
    },
    {
      id: '5',
      question: 'Comment activer/désactiver les notifications ?',
      answer: 'Rendez-vous dans votre profil et utilisez le bouton de basculement des notifications pour les activer ou désactiver selon vos préférences.',
      isExpanded: false,
    },
  ]);

  const toggleFAQ = (id: string) => {
    setFaqItems(items =>
      items.map(item =>
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    );
  };

  const handleEmailSupport = () => {
    const email = 'contact@katosconsulting.com';
    const subject = 'Demande de support - Application Katos';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir l\'application email. Veuillez contacter contact@katosconsulting.com',
        [{ text: 'OK' }]
      );
    });
  };

  const handlePhoneSupport = () => {
    const phoneNumber = 'tel:+22177032690';

    Linking.openURL(phoneNumber).catch(() => {
      Alert.alert(
        'Erreur',
        'Impossible d\'effectuer l\'appel. Veuillez composer le +221 77 032 69 90',
        [{ text: 'OK' }]
      );
    });
  };

  const handlePhone2Support = () => {
    const phoneNumber = 'tel:+22133856918';

    Linking.openURL(phoneNumber).catch(() => {
      Alert.alert(
        'Erreur',
        'Impossible d\'effectuer l\'appel. Veuillez composer le +221 33 856 91 86',
        [{ text: 'OK' }]
      );
    });
  };

  const renderFAQItem = (item: FAQItem) => (
    <View key={item.id} style={styles.faqItem}>
      <TouchableOpacity
        style={styles.faqQuestion}
        onPress={() => toggleFAQ(item.id)}
      >
        <Text style={styles.faqQuestionText}>{item.question}</Text>
        <MaterialIcons
          name={item.isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={24}
          color="#2B2E83"
        />
      </TouchableOpacity>
      {item.isExpanded && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{item.answer}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aide et Support</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section FAQ */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Questions Fréquentes</Text>
            <View style={styles.faqContainer}>
              {faqItems.map(renderFAQItem)}
            </View>
          </View>

          {/* Section Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nous Contacter</Text>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={handleEmailSupport}
            >
              <View style={styles.contactIcon}>
                <MaterialIcons name="email" size={24} color="#E96C2E" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Email Support</Text>
                <Text style={styles.contactSubtitle}>contact@katosconsulting.com</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={handlePhoneSupport}
            >
              <View style={styles.contactIcon}>
                <MaterialIcons name="phone" size={24} color="#E96C2E" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Téléphone Mobile</Text>
                <Text style={styles.contactSubtitle}>+221 77 032 69 90</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={handlePhone2Support}
            >
              <View style={styles.contactIcon}>
                <MaterialIcons name="phone" size={24} color="#E96C2E" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Téléphone Fixe</Text>
                <Text style={styles.contactSubtitle}>+221 33 856 91 86</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <MaterialIcons name="location-on" size={24} color="#E96C2E" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Adresse</Text>
                <Text style={styles.contactSubtitle}>Point E, Rue Kaolack Villa 2ba5</Text>
              </View>
            </View>
          </View>

          {/* Section Heures d'ouverture */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Heures d'Ouverture</Text>
            <View style={styles.hoursContainer}>
              <View style={styles.hourItem}>
                <Text style={styles.dayText}>Lundi - Samedi</Text>
                <Text style={styles.timeText}>9:00 - 18:00</Text>
              </View>
              <View style={styles.hourItem}>
                <Text style={styles.dayText}>Dimanche</Text>
                <Text style={styles.timeText}>Fermé</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2B2E83',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 80,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'FiraSans_700Bold',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 16,
  },
  faqContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  faqQuestionText: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    lineHeight: 20,
  },
  contactItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  hoursContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  hourItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayText: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  timeText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
});