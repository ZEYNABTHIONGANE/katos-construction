import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

export default function AboutScreen({ navigation }: Props) {
  const handleWebsite = () => {
    const url = 'https://katosconsulting.com/';
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir le lien. Veuillez visiter katosconsulting.com',
        [{ text: 'OK' }]
      );
    });
  };

  const handleEmail = () => {
    const email = 'contact@katosconsulting.com';
    const url = `mailto:${email}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir l\'application email. Veuillez contacter contact@katosconsulting.com',
        [{ text: 'OK' }]
      );
    });
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Politique de confidentialité',
      'La politique de confidentialité sera disponible dans une prochaine mise à jour.',
      [{ text: 'OK' }]
    );
  };

  const handleTermsOfService = () => {
    Alert.alert(
      'Conditions d\'utilisation',
      'Les conditions d\'utilisation seront disponibles dans une prochaine mise à jour.',
      [{ text: 'OK' }]
    );
  };

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
          <Text style={styles.headerTitle}>À propos</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo et informations principales */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Katos Consulting</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appDescription}>
              Votre partenaire de confiance pour tous vos projets de construction et rénovation
            </Text>
          </View>

          {/* Informations sur l'entreprise */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>À propos de nous</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Katos Consulting est une entreprise spécialisée dans la construction et la rénovation.
                Avec plus de 15 ans d'expérience, nous accompagnons nos clients dans la réalisation
                de leurs projets avec professionnalisme et expertise.
              </Text>
              <Text style={styles.infoText}>
                Notre application mobile vous permet de suivre l'avancement de votre projet en temps réel,
                de communiquer avec votre équipe et de rester informé à chaque étape.
              </Text>
            </View>
          </View>

          {/* Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nos Services</Text>
            <View style={styles.servicesContainer}>
              <View style={styles.serviceItem}>
                <MaterialIcons name="home" size={24} color="#E96C2E" />
                <Text style={styles.serviceText}>Construction neuve</Text>
              </View>
              <View style={styles.serviceItem}>
                <MaterialIcons name="build" size={24} color="#E96C2E" />
                <Text style={styles.serviceText}>Rénovation</Text>
              </View>
              <View style={styles.serviceItem}>
                <MaterialIcons name="design-services" size={24} color="#E96C2E" />
                <Text style={styles.serviceText}>Design intérieur</Text>
              </View>
              <View style={styles.serviceItem}>
                <MaterialIcons name="engineering" size={24} color="#E96C2E" />
                <Text style={styles.serviceText}>Conseil technique</Text>
              </View>
            </View>
          </View>

          {/* Contact et liens */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>

            <TouchableOpacity style={styles.contactItem} onPress={handleWebsite}>
              <View style={styles.contactIcon}>
                <MaterialIcons name="language" size={24} color="#E96C2E" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Site Web</Text>
                <Text style={styles.contactSubtitle}>katosconsulting.com</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
              <View style={styles.contactIcon}>
                <MaterialIcons name="email" size={24} color="#E96C2E" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Email</Text>
                <Text style={styles.contactSubtitle}>contact@katosconsulting.com</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Mentions légales */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mentions Légales</Text>

            <TouchableOpacity style={styles.legalItem} onPress={handlePrivacyPolicy}>
              <Text style={styles.legalText}>Politique de confidentialité</Text>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.legalItem} onPress={handleTermsOfService}>
              <Text style={styles.legalText}>Conditions d'utilisation</Text>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © Copyright 2024 Tous droits réservés KATOS CONSULTING
            </Text>
            <Text style={styles.footerSubtext}>
              Développé avec ❤️ pour nos clients
            </Text>
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
  logoSection: {
    alignItems: 'center',
    padding: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF3E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  logo: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 28,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  appVersion: {
    fontSize: 16,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 16,
  },
  appDescription: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
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
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoText: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    lineHeight: 22,
    marginBottom: 12,
  },
  servicesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  serviceText: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_500Medium',
    marginLeft: 16,
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
  legalItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  legalText: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_500Medium',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
    marginBottom: 2,
    textAlign: 'center',
  },
});