import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../types';
import AppHeader from '../../components/AppHeader';
import ProgressBar from '../../components/ProgressBar';
import {
  mockProject,
  mockProjectPhases,
  mockProjectUpdates,
} from '../../data/mockData';

type Props = BottomTabScreenProps<HomeTabParamList, 'Chantier'>;

const { width } = Dimensions.get('window');

export default function ChantierScreen({ navigation }: Props) {
  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'in-progress':
        return '#EF9631';
      case 'pending':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const getPhaseStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'in-progress':
        return 'schedule';
      case 'pending':
        return 'radio-button-unchecked';
      default:
        return 'radio-button-unchecked';
    }
  };

  const projectImages = [
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=400&h=300&fit=crop',
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
        {/* Header moderne */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chantier</Text>
          <View style={styles.headerRight} />
        </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Project Info */}
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{mockProject.name}</Text>
          <Text style={styles.projectAddress}>{mockProject.address}</Text>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Avancement global</Text>
              <Text style={styles.progressValue}>{mockProject.progress}%</Text>
            </View>
            <ProgressBar progress={mockProject.progress} height={12} />
          </View>
        </View>

        {/* Photo Gallery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos du chantier</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryContainer}
          >
            {projectImages.map((imageUrl, index) => (
              <TouchableOpacity key={index} style={styles.galleryItem}>
                <Image source={{ uri: imageUrl }} style={styles.galleryImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline du projet</Text>
          <View style={styles.timeline}>
            {mockProjectPhases.map((phase, index) => (
              <View key={phase.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineIcon,
                      { backgroundColor: getPhaseStatusColor(phase.status) },
                    ]}
                  >
                    <MaterialIcons
                      name={getPhaseStatusIcon(phase.status)}
                      size={16}
                      color="#fff"
                    />
                  </View>
                  {index < mockProjectPhases.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>

                <View style={styles.timelineContent}>
                  <Text style={styles.phaseName}>{phase.name}</Text>
                  <Text style={styles.phaseDescription}>{phase.description}</Text>

                  {phase.startDate && (
                    <Text style={styles.phaseDate}>
                      Début: {phase.startDate}
                      {phase.endDate && ` • Fin: ${phase.endDate}`}
                    </Text>
                  )}

                  <View style={styles.phaseStatus}>
                    <Text
                      style={[
                        styles.phaseStatusText,
                        { color: getPhaseStatusColor(phase.status) },
                      ]}
                    >
                      {phase.status === 'completed'
                        ? 'Terminé'
                        : phase.status === 'in-progress'
                        ? 'En cours'
                        : 'En attente'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Updates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mises à jour récentes</Text>
          {mockProjectUpdates.map((update) => (
            <View key={update.id} style={styles.updateCard}>
              <View style={styles.updateHeader}>
                <MaterialIcons
                  name={update.status === 'completed' ? 'check-circle' : 'schedule'}
                  size={20}
                  color={update.status === 'completed' ? '#28a745' : '#EF9631'}
                />
                <Text style={styles.updateDate}>{update.date}</Text>
              </View>
              <Text style={styles.updateTitle}>{update.title}</Text>
              <Text style={styles.updateDescription}>{update.description}</Text>
              {update.imageUrl && (
                <Image source={{ uri: update.imageUrl }} style={styles.updateImage} />
              )}
            </View>
          ))}
        </View>

        {/* Contact Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate('Chat')}
          >
            <MaterialIcons name="chat" size={24} color="#fff" />
            <Text style={styles.contactButtonText}>Contacter le chef de chantier</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  },
  backButton: {
    padding: 8,
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
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  projectInfo: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 40,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  projectName: {
    fontSize: 20,
    color: '#1A1A1A',
    marginBottom: 5,
    fontFamily: 'FiraSans_700Bold',
  },
  projectAddress: {
    fontSize: 14,
    color: '#EF9631',
    marginBottom: 20,
    fontFamily: 'FiraSans_400Regular',
  },
  progressSection: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'FiraSans_400Regular',
  },
  progressValue: {
    fontSize: 18,
    color: '#EF9631',
    fontFamily: 'FiraSans_700Bold',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#2B2E83',
    marginBottom: 15,
    fontFamily: 'FiraSans_700Bold',
  },
  galleryContainer: {
    paddingRight: 20,
  },
  galleryItem: {
    marginRight: 15,
  },
  galleryImage: {
    width: width * 0.6,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  timeline: {
    paddingLeft: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 15,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  phaseName: {
    fontSize: 16,
    color: '#2B2E83',
    marginBottom: 5,
    fontFamily: 'FiraSans_700Bold',
  },
  phaseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'FiraSans_400Regular',
  },
  phaseDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    fontFamily: 'FiraSans_400Regular',
  },
  phaseStatus: {
    alignSelf: 'flex-start',
  },
  phaseStatusText: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontFamily: 'FiraSans_600SemiBold',
  },
  updateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  updateDate: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
    fontFamily: 'FiraSans_400Regular',
  },
  updateTitle: {
    fontSize: 16,
    color: '#2B2E83',
    marginBottom: 5,
    fontFamily: 'FiraSans_700Bold',
  },
  updateDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
    fontFamily: 'FiraSans_400Regular',
  },
  updateImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  contactButton: {
    backgroundColor: '#EF9631',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  contactButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#fff',
    fontFamily: 'FiraSans_700Bold',
  },
  scrollContent: {
    paddingBottom: 130, // Espace pour la navigation flottante
  },
});