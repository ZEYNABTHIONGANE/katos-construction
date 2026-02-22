
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
import { useClientAuth } from "../../hooks/useClientAuth";
import AppHeader from "../../components/AppHeader";
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useClientDocuments } from "../../hooks/useDocuments";
import { useUserNames } from "../../hooks/useUserNames";
import { useNotifications } from "../../hooks/useNotifications";
import { optimizeCloudinaryUrl, getVideoThumbnailUrl } from "../../utils/cloudinaryUtils";

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

  const { session } = useClientAuth();

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
    assignedChefId,
    startDate,
    mainImage,
    recentUpdates
  } = useClientChantier();

  const { unreadCount } = useNotifications();

  // Récupérer le nom du chef de chantier
  const { getUserName } = useUserNames(assignedChefId ? [assignedChefId] : []);
  const chefName = assignedChefId ? getUserName(assignedChefId) : '';



  // Documents dynamiques
  const {
    documents,
    documentsByCategory,
    totalDocuments,
  } = useClientDocuments(
    chantier?.id || ''
  );

  const newDocuments = documents.filter(doc => {
    const uploadDate = doc.uploadedAt?.toDate?.() || new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return uploadDate > weekAgo;
  }).length;

  // Calcul des statistiques pour l'affichage
  const documentsStats = {
    totalDocuments: totalDocuments,
    recentUploads: newDocuments,
    categories: {
      contracts: documentsByCategory['contract']?.length || 0,
      videos: documentsByCategory['video']?.length || 0,
      plans: documentsByCategory['plan']?.length || 0,
      photos: documentsByCategory['photo']?.length || 0,
      other: (documentsByCategory['invoice']?.length || 0) +
        (documentsByCategory['permit']?.length || 0) +
        (documentsByCategory['report']?.length || 0) +
        (documentsByCategory['other']?.length || 0)
    }
  };

  // ... rest of the code using documentsStats instead of mockDocumentsData

  // Simple loading logic: show loading only when actually loading
  const shouldShowLoading = !isAuthenticated || chantierLoading;




  const handleProjectPress = () => {
    if (chantier?.id) {
      navigation.navigate("Chantier", { chantierId: chantier.id });
    } else {
      navigation.navigate("Chantier", {});
    }
  };


  // Unified loading state
  if (!isAuthenticated || chantierLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Tableau de bord" showNotification={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B2E83" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  // Show error state only for real errors
  if (chantierError) {
    const errorTitle = "Erreur de chargement";
    const errorMessage = chantierError;

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
    // {
    //   id: "3",
    //   title: "Messages non lus",
    //   value: "5",
    //   icon: "chat-bubble",
    //   color: "#2B2E83",
    //   backgroundColor: "#F8F9FF",
    // },
  ];

  const handleDocumentsPress = () => {
    navigation.navigate('Documents');
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
        notificationCount={unreadCount}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card - Modern */}
        <ExpoLinearGradient
          colors={['#2B2E83', '#E96C2E']}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.welcomeCardGradient}
        >
          <Text style={styles.greetingText}>Bienvenue,</Text>
          <Text style={styles.clientNameText}>
            {clientInfo?.firstName || 'Client'} {clientInfo?.lastName || ''}
          </Text>
        </ExpoLinearGradient>

        {/* Hero Section - Modern Project Card */}
        {hasChantier && (
          <View style={styles.heroCard}>
            {/* Project Image with Overlay */}
            {mainImage && (
              <View style={styles.heroImageContainer}>
                <Image
                  source={{
                    uri: (mainImage as any).type === 'video'
                      ? getVideoThumbnailUrl(mainImage.url, { width: 800 })
                      : optimizeCloudinaryUrl(mainImage.url, { width: 800, quality: 'auto' })
                  }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <View style={styles.heroOverlay}>
                  <Text style={styles.heroProjectName}>{chantierName}</Text>
                </View>
              </View>
            )}

            {/* Project Info Pills */}
            <View style={styles.heroInfoContainer}>
              {chantierAddress && (
                <View style={styles.infoPill}>
                  <MaterialIcons name="location-on" size={16} color="#E96C2E" />
                  <Text style={styles.infoPillText}>{chantierAddress}</Text>
                </View>
              )}

              {chefName && (
                <View style={styles.infoPill}>
                  <MaterialIcons name="engineering" size={16} color="#2B2E83" />
                  <Text style={styles.infoPillText}>{chefName}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Welcome for users without project */}
        {!hasChantier && (
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeGreeting}>Bienvenue,</Text>
            <Text style={styles.welcomeName}>
              {clientInfo?.firstName || 'Client'} {clientInfo?.lastName || ''}
            </Text>
          </View>
        )}

        {/* Modern Stats Grid */}
        {hasChantier && (
          <View style={styles.statsGrid}>
            {/* Progress Card */}
            <TouchableOpacity
              style={styles.statCard}
              onPress={handleProjectPress}
              activeOpacity={0.7}
            >
              <View style={styles.statIconContainer}>
                <MaterialIcons name="trending-up" size={28} color="#2B2E83" />
              </View>
              <Text style={styles.statValue}>{globalProgress}%</Text>
              <Text style={styles.statLabel}>Avancement</Text>
            </TouchableOpacity>

            {/* Phase Card */}
            <TouchableOpacity
              style={styles.statCard}
              onPress={handleProjectPress}
              activeOpacity={0.7}
            >
              <View style={styles.statIconContainer}>
                <MaterialIcons name="construction" size={28} color="#E96C2E" />
              </View>
              <Text style={styles.statValue} numberOfLines={1}>{currentPhase || 'N/A'}</Text>
              <Text style={styles.statLabel}>Phase actuelle</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Message si pas de chantier */}
        {!hasChantier && (
          <View style={styles.emptyProjectCard}>
            <MaterialIcons name="home-work" size={48} color="#E0E0E0" />
            <Text style={styles.emptyProjectText}>Aucun chantier assigné</Text>
            <Text style={styles.emptyProjectSubtext}>
              Votre chantier apparaîtra ici une fois créé par l'administration
            </Text>

            {/* Diagnostic info for developers/admins */}
            <View style={styles.diagnosticContainer}>
              <Text style={styles.diagnosticTitle}>Infos Diagnostic :</Text>
              <Text style={styles.diagnosticText}>Client ID: {clientInfo?.id || 'N/A'}</Text>
              <Text style={styles.diagnosticText}>Statut Client: {clientInfo?.status || 'N/A'}</Text>
              <Text style={styles.diagnosticText}>Auth UID: {session?.clientId ? 'Connecté' : 'Non connecté'}</Text>

              <TouchableOpacity
                style={styles.diagnosticButton}
                onPress={() => navigation.navigate('Diagnostic' as any)}
              >
                <Text style={styles.diagnosticButtonText}>Lancer le diagnostic complet</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Section Documents - Simplified */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Documents</Text>

          <TouchableOpacity style={styles.documentsCardCompact} onPress={handleDocumentsPress}>
            <View style={styles.documentsIconCompact}>
              <MaterialIcons name="folder" size={32} color="#2B2E83" />
            </View>

            <View style={styles.documentsInfoCompact}>
              <Text style={styles.documentsCountCompact}>{documentsStats.totalDocuments} fichiers</Text>
              <View style={styles.documentsStatsCompact}>
                <Text style={styles.documentsStatCompact}>{documentsStats.categories.videos} vidéos</Text>
                <Text style={styles.documentsDot}>•</Text>
                <Text style={styles.documentsStatCompact}>{documentsStats.categories.plans} plans</Text>
                <Text style={styles.documentsDot}>•</Text>
                <Text style={styles.documentsStatCompact}>{documentsStats.categories.photos} photos</Text>
              </View>
            </View>

            <MaterialIcons name="arrow-forward-ios" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Discreet link to showcase */}
        <TouchableOpacity
          style={styles.showcaseLink}
          onPress={() => navigation.navigate('Showcase' as any)}
        >
          <Text style={styles.showcaseLinkText}>Découvrir nos autres programmes</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#E96C2E" />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2E7D4A',
    fontFamily: 'FiraSans_400Regular',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  welcomeSection: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  welcomeContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 0,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_500Medium',
    marginBottom: 8,
    textAlign: 'center',
  },
  name: {
    fontSize: 24,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
    textAlign: 'center',
  },

  // Status du projet
  projectStatus: {
    marginTop: 0,
  },
  statusCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2B2E83',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  statusGradient: {
    padding: 20,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'FiraSans_600SemiBold',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
  },
  statusProjectName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 12,
  },
  statusDetails: {
    flex: 1,
    marginTop: 8,
  },
  statusInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusInfoContent: {
    flex: 1,
  },
  statusInfoLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusInfoValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
  },

  // Styles pour l'image du chantier intégrée
  chantierImageContainer: {
    position: 'relative',
    height: 180,
    width: '100%',
  },
  chantierImage: {
    width: '100%',
    height: '100%',
  },
  chantierImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  chantierImageTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 4,
  },
  chantierImageSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'FiraSans_500Medium',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 15,
    paddingLeft: 5,
  },
  // Carte principale
  mainStatCard: {
    borderRadius: 24,
    marginBottom: 25,
    shadowColor: '#2B2E83',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(43, 46, 131, 0.08)',
  },
  mainStatCardGradient: {
    borderRadius: 24,
    padding: 28,
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
    gap: 15,
  },
  secondaryStatCard: {
    flex: 1,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
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
    fontSize: 18,
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 2,
  },
  secondaryStatTitle: {
    fontSize: 12,
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
  },
  seeAllText: {
    fontSize: 14,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
  },
  projectCard: {
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#2B2E83',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(43, 46, 131, 0.06)',
  },
  projectCardInner: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  projectImageContainer: {
    position: 'relative',
    height: 180,
    width: '100%',
  },
  projectMainImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(43, 46, 131, 0.15)',
  },
  projectContent: {
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
    marginBottom: 8,
  },
  projectDetails: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginLeft: 4,
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
  projectDetailsInfo: {
    flex: 1,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
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
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#2B2E83',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(43, 46, 131, 0.08)',
  },
  documentsCardGradient: {
    borderRadius: 24,
    padding: 28,
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

  // Styles pour le container des widgets iOS
  widgetContainer: {
    padding: 20,
    paddingTop: 15,
  },

  // Widget principal
  mainWidget: {
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#2B2E83',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  mainWidgetGradient: {
    borderRadius: 24,
    padding: 24,
  },
  mainWidgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 8,
  },
  progressPercentage: {
    fontSize: 32,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_700Bold',
  },
  progressIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Barre de progression widget
  progressBarWidget: {
    marginBottom: 16,
  },
  progressTrackWidget: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFillWidget: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },

  // Phase actuelle widget
  currentPhaseWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  currentPhaseText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 8,
  },

  // Mini widgets horizontaux
  miniWidgetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  miniWidget: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  miniWidgetContent: {
    alignItems: 'center',
  },
  miniWidgetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  miniWidgetNumber: {
    fontSize: 24,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 4,
  },
  miniWidgetDate: {
    fontSize: 12,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 4,
    textAlign: 'center',
  },
  miniWidgetLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
    textAlign: 'center',
  },

  // Welcome Card Gradient (always shown)
  welcomeCardGradient: {
    paddingHorizontal: 25,
    paddingVertical: 30,
    marginTop: 15,
    marginHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  greetingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_400Regular',
    opacity: 0.9,
  },
  clientNameText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_700Bold',
    marginTop: 5,
  },

  // Modern Hero Card Styles
  heroCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  heroImageContainer: {
    position: 'relative',
    height: 200,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroProjectName: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_700Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroInfoContainer: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  infoPillText: {
    fontSize: 13,
    color: '#4B5563',
    fontFamily: 'FiraSans_600SemiBold',
  },

  // Welcome Card (for users without project)
  welcomeCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 32,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },
  welcomeGreeting: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_500Medium',
    marginBottom: 8,
  },
  welcomeName: {
    fontSize: 26,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
    textAlign: 'center',
  },

  // Modern Stats Grid
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 13,
    color: '#1F2937',
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
    textAlign: 'center',
  },

  // Compact Documents Section
  documentsSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  documentsCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  documentsIconCompact: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  documentsInfoCompact: {
    flex: 1,
  },
  documentsCountCompact: {
    fontSize: 18,
    color: '#1F2937',
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 4,
  },
  documentsStatsCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  documentsStatCompact: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_500Medium',
  },
  documentsDot: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  showcaseLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
    gap: 8,
  },
  showcaseLinkText: {
    fontSize: 15,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
    textDecorationLine: 'underline',
  },
  diagnosticContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FFF4ED',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0CC',
    width: '100%',
  },
  diagnosticTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E96C2E',
    marginBottom: 10,
  },
  diagnosticText: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  diagnosticButton: {
    marginTop: 15,
    backgroundColor: '#E96C2E',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  diagnosticButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
