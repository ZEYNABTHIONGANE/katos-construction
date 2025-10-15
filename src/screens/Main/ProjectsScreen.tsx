import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MainMenu from '../../components/MainMenu';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Project {
  id: string;
  title: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  progress: number;
  dueDate: string;
  budget: number;
  client: string;
}

const sampleProjects: Project[] = [
  {
    id: '1',
    title: 'Rénovation Villa Moderne',
    status: 'in-progress',
    progress: 75,
    dueDate: '2024-12-15',
    budget: 150000,
    client: 'M. Martin',
  },
  {
    id: '2',
    title: 'Extension Maison',
    status: 'planning',
    progress: 0,
    dueDate: '2024-11-30',
    budget: 80000,
    client: 'Mme. Bernard',
  },
  {
    id: '3',
    title: 'Réfection Toiture',
    status: 'completed',
    progress: 100,
    dueDate: '2024-09-30',
    budget: 25000,
    client: 'M. Dubois',
  },
];

const getStatusColor = (status: Project['status']) => {
  switch (status) {
    case 'planning':
      return '#f39c12';
    case 'in-progress':
      return '#3498db';
    case 'completed':
      return '#2ecc71';
    case 'on-hold':
      return '#e74c3c';
    default:
      return '#95a5a6';
  }
};

const getStatusText = (status: Project['status']) => {
  switch (status) {
    case 'planning':
      return 'Planification';
    case 'in-progress':
      return 'En cours';
    case 'completed':
      return 'Terminé';
    case 'on-hold':
      return 'En pause';
    default:
      return status;
  }
};

const ProjectCard = ({ project }: { project: Project }) => (
  <TouchableOpacity style={styles.projectCard}>
    <View style={styles.projectHeader}>
      <Text style={styles.projectTitle}>{project.title}</Text>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
        <Text style={styles.statusText}>{getStatusText(project.status)}</Text>
      </View>
    </View>

    <View style={styles.projectInfo}>
      <View style={styles.infoRow}>
        <Icon name="person" size={16} color="#666" />
        <Text style={styles.infoText}>{project.client}</Text>
      </View>
      <View style={styles.infoRow}>
        <Icon name="event" size={16} color="#666" />
        <Text style={styles.infoText}>{project.dueDate}</Text>
      </View>
      <View style={styles.infoRow}>
        <Icon name="euro" size={16} color="#666" />
        <Text style={styles.infoText}>{project.budget.toLocaleString()}€</Text>
      </View>
    </View>

    <View style={styles.progressContainer}>
      <View style={styles.progressBarBackground}>
        <View 
          style={[styles.progressBar, { width: project.progress + '%' }]} 
        />
      </View>
      <Text style={styles.progressText}>{project.progress}%</Text>
    </View>
  </TouchableOpacity>
);

const ProjectsScreen = () => {
  const navigation = useNavigation();
  const [filter, setFilter] = useState<Project['status'] | 'all'>('all');

  const filteredProjects = filter === 'all'
    ? sampleProjects
    : sampleProjects.filter(project => project.status === filter);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Projets</Text>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Nouveau projet</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filtersContainer}
        >
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'all' && styles.activeFilter]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>Tous</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'in-progress' && styles.activeFilter]}
            onPress={() => setFilter('in-progress')}
          >
            <Text style={[styles.filterText, filter === 'in-progress' && styles.activeFilterText]}>En cours</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'planning' && styles.activeFilter]}
            onPress={() => setFilter('planning')}
          >
            <Text style={[styles.filterText, filter === 'planning' && styles.activeFilterText]}>Planification</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'completed' && styles.activeFilter]}
            onPress={() => setFilter('completed')}
          >
            <Text style={[styles.filterText, filter === 'completed' && styles.activeFilterText]}>Terminés</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.projectList}>
          {filteredProjects.length > 0 ? (
            filteredProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="assignment" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Aucun projet {filter !== 'all' ? 'dans cette catégorie' : 'en cours'}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <MainMenu />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#4b86b4',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
  filtersContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  filterChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activeFilter: {
    backgroundColor: '#2a4d69',
  },
  filterText: {
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  projectList: {
    padding: 15,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2a4d69',
    flex: 1,
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
  projectInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginRight: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4b86b4',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    width: 35,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default ProjectsScreen;