import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeTabParamList, RootStackParamList } from "../../types";
import { useClientSpecificData } from "../../hooks/useClientSpecificData";
import { useClientChantier } from "../../hooks/useClientChantier";
import AppHeader from "../../components/AppHeader";
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';

// Mock data pour les documents - à remplacer par des données réelles plus tard
const mockDocumentsData = {
  totalDocuments: 8,
  recentUploads: 3,
  categories: {
    contracts: 2,
    plans: 3,
    photos: 3
  }
};

type Props = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }: Props) {
  const {
    isAuthenticated,
    clientInfo
  } = useClientSpecificData();

  const {
    chantier,
    loading: chantierLoading,
    error: chantierError,
    hasChantier,
    currentPhase,
    globalProgress,
    status,
    name: chantierName,
    address: chantierAddress,
    startDate,
    recentUpdates
  } = useClientChantier();


  const handleProjectPress = () => {
    if (chantier?.id) {
      navigation.navigate("Chantier", { chantierId: chantier.id });
    } else {
      navigation.navigate("Chantier", {});
    }
  };

  const handleChatPress = () => {
    navigation.navigate("Chat");
  };

  // Show loading state
  if (chantierLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2B2E83" />
        <Text style={styles.loadingText}>Chargement de votre chantier...</Text>
      </View>
    );
  }

  // Show error state
  if (chantierError || (!chantierLoading && !hasChantier)) {
    const errorTitle = !hasChantier
      ? "Aucun chantier assigné"
      : "Erreur de chargement";

    const errorMessage = !hasChantier
      ? "Aucun chantier n'a été assigné à votre compte. Votre chantier apparaîtra ici une fois créé par l'administration."
      : chantierError;

    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <MaterialIcons name="home-work" size={48} color="#E96C2E" />
        <Text style={[styles.errorText, { color: '#E96C2E' }]}>{errorTitle}</Text>
        <Text style={styles.errorSubtext}>{errorMessage}</Text>
      </View>
    );
  }

  const statisticsData = [
    {
      id: "1",
      title: "Avancement chantier",
      value: `${globalProgress}%`,
      icon: "trending-up",
      color: "#2B2E83",
      backgroundColor: "#F8F9FF",
    },
    {
      id: "2",
      title: "Phase actuelle",
      value: currentPhase,
      icon: "construction",
      color: "#E96C2E",
      backgroundColor: "#FFF7ED",
    },
    {
      id: "3",
      title: "Messages non lus",
      value: "5",
      icon: "chat-bubble",
      color: "#2B2E83",
      backgroundColor: "#F8F9FF",
    },
  ];

  const handleDocumentsPress = () => {
    navigation.navigate('ClientProjects');
  };

  const renderMainStatCard = (stat: (typeof statisticsData)[0]) => (
    <TouchableOpacity key={stat.id} style={styles.mainStatCard}>
      <ExpoLinearGradient
        colors={[stat.color, stat.color + 'CC']}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.mainStatCardGradient}
      >
        <View style={styles.mainStatContent}>
          <View style={styles.mainStatLeft}>
            <Text style={styles.mainStatTitle}>{stat.title}</Text>
            <Text style={styles.mainStatValue}>{stat.value}</Text>
          </View>
          <View style={styles.mainStatIcon}>
            <MaterialIcons name={stat.icon as any} size={36} color="#FFFFFF" />
          </View>
        </View>
      </ExpoLinearGradient>
    </TouchableOpacity>
  );

  const renderSecondaryStatCard = (stat: (typeof statisticsData)[0]) => (
    <TouchableOpacity key={stat.id} style={styles.secondaryStatCard}>
      <View style={[styles.secondaryStatContent, { backgroundColor: stat.backgroundColor }]}>
        <View style={[styles.secondaryStatIcon, { backgroundColor: stat.color + '15' }]}>
          <MaterialIcons name={stat.icon as any} size={22} color={stat.color} />
        </View>
        <View style={styles.secondaryStatInfo}>
          <Text style={[styles.secondaryStatValue, { color: stat.color }]}>{stat.value}</Text>
          <Text style={styles.secondaryStatTitle}>{stat.title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );


  return (
    <View style={styles.container}>
      <AppHeader
        title="Tableau de bord"
        showNotification={true}
        onNotificationPress={() => {}}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ExpoLinearGradient
          colors={['#2B2E83', '#E96C2E']}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.welcomeSection}
        >
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.name}>{clientInfo?.firstName || 'Client'}</Text>
          <Text style={styles.subtitle}>Client chez Katos Construction</Text>
        </ExpoLinearGradient>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Tableau de bord</Text>

          {/* Carte principale - Avancement */}
          {renderMainStatCard(statisticsData[0])}

          {/* Cartes secondaires */}
          <View style={styles.secondaryStatsGrid}>
            {statisticsData.slice(1).map(renderSecondaryStatCard)}
          </View>
        </View>

        <View style={styles.projectsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mon chantier</Text>
            <TouchableOpacity onPress={handleProjectPress}>
              <Text style={styles.seeAllText}>Voir détails</Text>
            </TouchableOpacity>
          </View>

          {hasChantier ? (
            <TouchableOpacity
              style={styles.projectCard}
              onPress={handleProjectPress}
              activeOpacity={0.7}
            >
              <View style={styles.projectCardInner} pointerEvents="none">
                <View style={styles.projectHeader}>
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectName}>{chantierName}</Text>
                    <Text style={styles.clientName}>{chantierAddress}</Text>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor: status === 'En cours' ? '#4CAF50' :
                                   status === 'Terminé' ? '#2196F3' :
                                   status === 'En retard' ? '#F44336' : '#E0B043'
                  }]}>
                    <Text style={styles.statusText}>{status}</Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progression</Text>
                    <Text style={styles.progressValue}>{globalProgress}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <ExpoLinearGradient
                      colors={['#2B2E83', '#E96C2E']}
                      start={[0, 0]}
                      end={[1, 0]}
                      style={[
                        styles.progressFill,
                        { width: `${globalProgress}%` }
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.projectFooter}>
                  <View style={styles.dueDateContainer}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons name="schedule" size={18} color="#2B2E83" />
                    </View>
                    <Text style={styles.dueDate}>Début: {startDate}</Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <MaterialIcons name="arrow-forward-ios" size={18} color="#2B2E83" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyProjectCard}>
              <MaterialIcons name="home-work" size={48} color="#E0E0E0" />
              <Text style={styles.emptyProjectText}>Aucun chantier assigné</Text>
              <Text style={styles.emptyProjectSubtext}>
                Votre chantier apparaîtra ici une fois créé par l'administration
              </Text>
            </View>
          )}
        </View>

        {/* Section Documents */}
        <View style={styles.projectsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes documents</Text>
            <TouchableOpacity onPress={handleDocumentsPress}>
              <Text style={styles.seeAllText}>Gérer</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.documentsCard} onPress={handleDocumentsPress}>
            <ExpoLinearGradient
              colors={['#2B2E83', '#E96C2E']}
              start={[0, 0]}
              end={[1, 1]}
              style={styles.documentsCardGradient}
            >
              <View style={styles.documentsCardContent}>
                <View style={styles.documentsCardHeader}>
                  <View style={styles.documentsMainInfo}>
                    {/* <Text style={styles.documentsTitle}>Documents</Text> */}
                    <Text style={styles.documentsCount}>{mockDocumentsData.totalDocuments} fichiers</Text>
                  </View>
                  <View style={styles.documentsIcon}>
                    <MaterialIcons name="folder" size={32} color="#FFFFFF" />
                  </View>
                </View>

                <View style={styles.documentsStats}>
                  <View style={styles.documentsStat}>
                    <MaterialIcons name="description" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.documentsStatText}>{mockDocumentsData.categories.contracts} contrats</Text>
                  </View>
                  <View style={styles.documentsStat}>
                    <MaterialIcons name="architecture" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.documentsStatText}>{mockDocumentsData.categories.plans} plans</Text>
                  </View>
                  <View style={styles.documentsStat}>
                    <MaterialIcons name="photo-library" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.documentsStatText}>{mockDocumentsData.categories.photos} photos</Text>
                  </View>
                </View>

                <View style={styles.documentsFooter}>
                  <View style={styles.recentUploads}>
                    <MaterialIcons name="upload" size={16} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.recentUploadsText}>{mockDocumentsData.recentUploads} ajoutés récemment</Text>
                  </View>
                  <MaterialIcons name="arrow-forward" size={20} color="rgba(255,255,255,0.9)" />
                </View>
              </View>
            </ExpoLinearGradient>
          </TouchableOpacity>
        </View>

  
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  welcomeSection: {
    paddingHorizontal: 25,
    paddingVertical: 30,
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  greeting: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_400Regular',
    opacity: 0.9,
  },
  name: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_700Bold',
    marginTop: 5,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    opacity: 0.8,
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 16,
  },
  // Carte principale
  mainStatCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#2B2E83',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  mainStatCardGradient: {
    borderRadius: 20,
    padding: 24,
  },
  mainStatContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainStatLeft: {
    flex: 1,
  },
  mainStatTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    opacity: 0.9,
    marginBottom: 8,
  },
  mainStatValue: {
    fontSize: 36,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_700Bold',
  },
  mainStatIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Cartes secondaires
  secondaryStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryStatCard: {
    flex: 1,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  secondaryStatContent: {
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    height: 80,
  },
  secondaryStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  secondaryStatInfo: {
    flex: 1,
  },
  secondaryStatValue: {
    fontSize: 14,
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 2,
  },
  secondaryStatTitle: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'FiraSans_600SemiBold',
    flexWrap: 'wrap',
    flexShrink: 1,
    lineHeight: 12,
  },
  projectsContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
  },
  projectCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    minHeight: 120, // S'assurer qu'il y a assez de zone tactile
  },
  projectCardInner: {
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  progressValue: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dueDate: {
    fontSize: 13,
    color: '#4B5563',
    fontFamily: 'FiraSans_600SemiBold',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Styles pour la carte des documents
  documentsCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#2B2E83',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  documentsCardGradient: {
    borderRadius: 20,
    padding: 24,
  },
  documentsCardContent: {
    flex: 1,
  },
  documentsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  documentsMainInfo: {
    flex: 1,
  },
  documentsTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 4,
  },
  documentsCount: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_700Bold',
  },
  documentsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  documentsStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 2,
  },
  documentsStatText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 4,
    flexShrink: 1,
  },
  documentsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  recentUploads: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentUploadsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 6,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  emptyProjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    marginHorizontal: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyProjectText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyProjectSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
  },
  updateDescription: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 4,
    lineHeight: 18,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#F44336',
    fontFamily: 'FiraSans_600SemiBold',
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
  },
});
