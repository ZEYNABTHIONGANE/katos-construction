import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface ProjectCardProps {
  title: string;
  status: string;
  progress: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ title, status, progress }) => (
  <TouchableOpacity style={styles.projectCard}>
    <View style={styles.projectHeader}>
      <Text style={styles.projectTitle}>{title}</Text>
      <View style={[styles.statusBadge, { backgroundColor: status === 'En cours' ? '#4b86b4' : '#2ecc71' }]}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </View>
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { width: progress + '%' }]} />
    </View>
    <Text style={styles.progressText}>{progress}% complété</Text>
  </TouchableOpacity>
);

const CatalogueItem = ({ title, count }: { title: string; count: number }) => (
  <TouchableOpacity style={styles.catalogueItem}>
    <Text style={styles.catalogueTitle}>{title}</Text>
    <Text style={styles.catalogueCount}>{count} éléments</Text>
  </TouchableOpacity>
);

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Bienvenue sur</Text>
          <Text style={styles.appName}>Katos Construction</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Projects')}
          >
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Nouveau Projet</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Catalog', { category: undefined })}
          >
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Catalogue</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Messages')}
          >
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Messages</Text>
          </TouchableOpacity>
        </View>

        {/* Projects Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projets en cours</Text>
          <ProjectCard title="Rénovation Maison" status="En cours" progress={75} />
          <ProjectCard title="Construction Garage" status="Planifié" progress={0} />
        </View>

        {/* Catalogue Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catalogue Matériaux</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <CatalogueItem title="Revêtements" count={24} />
            <CatalogueItem title="Peintures" count={18} />
            <CatalogueItem title="Sanitaires" count={12} />
            <CatalogueItem title="Électricité" count={15} />
          </ScrollView>
        </View>

        {/* Messages Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Messages récents</Text>
          <TouchableOpacity style={styles.messageCard}>
            <Text style={styles.messageTitle}>Chef de projet</Text>
            <Text style={styles.messagePreview}>Validation des plans...</Text>
            <Text style={styles.messageTime}>Il y a 2h</Text>
          </TouchableOpacity>
        </View>

        {/* Test Section - MediaManager */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Test - Gestion des médias</Text>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={() => navigation.navigate('MediaManager', { projectId: 'test-project-123' })}
          >
            <Text style={styles.testButtonText}>📸 Ouvrir MediaManager (Test)</Text>
            <Text style={styles.testButtonSubtext}>ID Projet: test-project-123</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#2a4d69',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  appName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#fff',
    marginVertical: 10,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
  actionText: {
    fontSize: 12,
    color: '#2a4d69',
  },
  section: {
    padding: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#2a4d69',
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2a4d69',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginVertical: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4b86b4',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  catalogueItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
    width: width * 0.4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  catalogueTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2a4d69',
    marginBottom: 5,
  },
  catalogueCount: {
    fontSize: 12,
    color: '#666',
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4b86b4',
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2a4d69',
    marginBottom: 5,
  },
  messagePreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  testButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#4b86b4',
    borderStyle: 'dashed',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b86b4',
    marginBottom: 5,
  },
  testButtonSubtext: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default HomeScreen;