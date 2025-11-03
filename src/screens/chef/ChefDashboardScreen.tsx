import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChefTabParamList } from '../../types';
import AppHeader from '../../components/AppHeader';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<ChefTabParamList, 'ChefDashboard'>;

interface StatCard {
  id: string;
  title: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  backgroundColor: string;
}

interface ProjectCard {
  id: string;
  name: string;
  client: string;
  progress: number;
  status: 'En cours' | 'En retard' | 'Terminé';
  dueDate: string;
}

const mockStats: StatCard[] = [
  {
    id: '1',
    title: 'Projets actifs',
    value: '12',
    icon: 'domain',
    color: '#2B2E83',
    backgroundColor: '#F8F9FF',
  },
  {
    id: '2',
    title: 'Terminés ce mois',
    value: '8',
    icon: 'check-circle',
    color: '#E96C2E',
    backgroundColor: '#FFF7ED',
  },
  {
    id: '3',
    title: 'Clients satisfaits',
    value: '98%',
    icon: 'sentiment-very-satisfied',
    color: '#2B2E83',
    backgroundColor: '#F8F9FF',
  },
  {
    id: '4',
    title: 'Messages non lus',
    value: '5',
    icon: 'chat-bubble',
    color: '#E96C2E',
    backgroundColor: '#FFF7ED',
  },
];

const mockProjects: ProjectCard[] = [
  {
    id: '1',
    name: 'Villa Amina F6',
    client: 'Moussa Diop',
    progress: 65,
    status: 'En cours',
    dueDate: '30 Juin 2024',
  },
  {
    id: '2',
    name: 'Villa Zahra F3',
    client: 'SARL Teranga',
    progress: 30,
    status: 'En cours',
    dueDate: '15 Août 2024',
  },
  {
    id: '3',
    name: 'Villa Kenza F3',
    client: 'Fatou Kane',
    progress: 90,
    status: 'En cours',
    dueDate: '20 Avril 2024',
  },
];

export default function ChefDashboardScreen({ navigation }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours':
        return '#E0B043';
      case 'En retard':
        return '#F44336';
      case 'Terminé':
        return '#4CAF50';
      default:
        return '#9CA3AF';
    }
  };

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
          <Text style={styles.name}>Papis Sakho</Text>
          <Text style={styles.subtitle}>Chef de chantier chez Katos Construction</Text>
        </ExpoLinearGradient>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Aperçu général</Text>
          <View style={styles.statsGrid}>
            {mockStats.map((stat) => (
              <TouchableOpacity key={stat.id} style={styles.statCard}>
                <View style={[styles.statCardContent, { backgroundColor: stat.backgroundColor }]}>
                  <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                    <MaterialIcons name={stat.icon} size={28} color={stat.color} />
                  </View>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      <View style={styles.projectsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Projets en cours</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ChefChantiers')}
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {mockProjects.map((project) => (
          <TouchableOpacity key={project.id} style={styles.projectCard}>
            <View style={styles.projectCardInner}>
              <View style={styles.projectHeader}>
                <View style={styles.projectInfo}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <Text style={styles.clientName}>{project.client}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                  <Text style={styles.statusText}>{project.status}</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progression</Text>
                  <Text style={styles.progressValue}>{project.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <ExpoLinearGradient
                    colors={['#2B2E83', '#E96C2E']}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={[
                      styles.progressFill,
                      { width: `${project.progress}%` }
                    ]}
                  />
                </View>
              </View>

              <View style={styles.projectFooter}>
                <View style={styles.dueDateContainer}>
                  <View style={styles.iconContainer}>
                    <MaterialIcons name="schedule" size={18} color="#2B2E83" />
                  </View>
                  <Text style={styles.dueDate}>Échéance: {project.dueDate}</Text>
                </View>
                <View style={styles.arrowContainer}>
                  <MaterialIcons name="arrow-forward-ios" size={18} color="#2B2E83" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  statCardContent: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 6,
  },
  statTitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'FiraSans_600SemiBold',
    textAlign: 'center',
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
});