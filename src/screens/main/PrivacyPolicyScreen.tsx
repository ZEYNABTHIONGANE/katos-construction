import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

export default function PrivacyPolicyScreen({ navigation }: Props) {
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
                    <Text style={styles.headerTitle}>Politique de confidentialité</Text>
                    <View style={styles.headerRight} />
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>1. Introduction</Text>
                        <Text style={styles.text}>
                            Bienvenue sur l'application mobile de Katos Consulting ("l'Application"). Nous nous engageons à protéger la confidentialité de vos données personnelles et des informations relatives à vos projets de construction et de rénovation. Cette politique détaille comment nous collectons, utilisons et protégeons vos informations.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>2. Informations collectées</Text>
                        <Text style={styles.text}>
                            Dans le cadre de la gestion de vos chantiers, nous pouvons collecter les types d'informations suivants :
                            {'\n\n'}• <Text style={{ fontWeight: 'bold' }}>Informations personnelles :</Text> Nom, prénom, adresse électronique, numéro de téléphone, et adresse de facturation.
                            {'\n\n'}• <Text style={{ fontWeight: 'bold' }}>Données du chantier :</Text> Adresses des sites de construction, plans architecturaux, permis de construire, devis, et factures.
                            {'\n\n'}• <Text style={{ fontWeight: 'bold' }}>Contenu multimédia :</Text> Photos et vidéos de l'avancement des travaux, qui peuvent être téléchargées par vous ou par nos chefs de chantier.
                            {'\n\n'}• <Text style={{ fontWeight: 'bold' }}>Données de localisation :</Text> Nous pouvons utiliser la localisation pour vérifier la présence sur le chantier ou géolocaliser les projets lors de la création.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>3. Utilisation des données</Text>
                        <Text style={styles.text}>
                            Vos informations sont utilisées exclusivement pour :
                            {'\n'}• Assurer le suivi en temps réel de vos projets de construction.
                            {'\n'}• Faciliter la communication entre vous, les chefs de chantier et l'administration.
                            {'\n'}• Vous envoyer des notifications sur l'avancement des étapes (ex: fin des fondations, livraison de matériaux).
                            {'\n'}• Gérer la facturation et les paiements (acomptes, soldes).
                            {'\n'}• Améliorer la qualité de nos services et de l'application.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>4. Partage des informations</Text>
                        <Text style={styles.text}>
                            Vos données de projet sont partagées uniquement avec les parties prenantes directement impliquées dans votre chantier :
                            {'\n'}• Les chefs de chantier et ouvriers assignés à votre projet.
                            {'\n'}• L'équipe administrative de Katos Consulting.
                            {'\n'}• Les sous-traitants ou architectes partenaires, si nécessaire pour l'exécution des travaux.
                            {'\n\n'}Nous ne vendons aucune de vos données personnelles à des tiers à des fins publicitaires.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>5. Sécurité et Stockage</Text>
                        <Text style={styles.text}>
                            Toutes les données sensibles (documents, plans, contrats) sont stockées de manière sécurisée. L'accès à l'application est protégé par authentification (email/mot de passe ou PIN). Nous mettons en œuvre des mesures techniques pour prévenir tout accès non autorisé, perte ou altération de vos données.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>6. Vos droits et Suppression</Text>
                        <Text style={styles.text}>
                            Vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
                            {'\n\n'}
                            <Text style={{ fontWeight: 'bold' }}>Suppression du compte :</Text> Vous pouvez demander la suppression de votre compte directement depuis l'application via la rubrique "Mon Profil". Notez que certaines données légales liées à la construction (garanties décennales, factures) seront conservées conformément aux obligations réglementaires, même après la suppression de votre accès.
                        </Text>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Dernière mise à jour : 21 Janvier 2026
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
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        color: '#2B2E83',
        fontFamily: 'FiraSans_700Bold',
        marginBottom: 12,
    },
    text: {
        fontSize: 14,
        color: '#4B5563',
        fontFamily: 'FiraSans_400Regular',
        lineHeight: 22,
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    footerText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: 'FiraSans_400Regular',
    },
});
