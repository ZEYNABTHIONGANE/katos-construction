import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Project } from '../types';
import ProgressBar from './ProgressBar';

interface ProjectCardProps {
  project: Project;
  onPress?: () => void;
}

export default function ProjectCard({ project, onPress }: ProjectCardProps) {
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'En cours':
        return '#EF9631';
      case 'Terminé':
        return '#28a745';
      case 'En attente':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'En cours':
        return 'construction';
      case 'Terminé':
        return 'check-circle';
      case 'En attente':
        return 'schedule';
      default:
        return 'schedule';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <ImageBackground
        source={{ uri: project.imageUrl }}
        style={styles.imageBackground}
        imageStyle={styles.image}
      >
        <View style={styles.overlay}>
          <View style={styles.statusContainer}>
            <MaterialIcons
              name={getStatusIcon(project.status)}
              size={16}
              color={getStatusColor(project.status)}
            />
            <Text style={[styles.status, { color: getStatusColor(project.status) }]}>
              {project.status}
            </Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.content}>
        <Text style={styles.title}>{project.name}</Text>
        <Text style={styles.address}>{project.address}</Text>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Avancement</Text>
            <Text style={styles.progressValue}>{project.progress}%</Text>
          </View>
          <ProgressBar progress={project.progress} />
        </View>

        <View style={styles.dateSection}>
          <View style={styles.dateItem}>
            <MaterialIcons name="event" size={16} color="#666" />
            <Text style={styles.dateText}>Début: {project.startDate}</Text>
          </View>
          {project.endDate && (
            <View style={styles.dateItem}>
              <MaterialIcons name="event-available" size={16} color="#666" />
              <Text style={styles.dateText}>Fin prévue: {project.endDate}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.detailButton} onPress={onPress}>
          <Text style={styles.detailButtonText}>Voir les détails</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#2B2E83" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  imageBackground: {
    height: 200,
  },
  image: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    padding: 15,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  status: {
    marginLeft: 5,
    fontSize: 12,
    fontFamily: 'FiraSans_600SemiBold',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    color: '#2B2E83',
    marginBottom: 5,
    fontFamily: 'FiraSans_700Bold',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontFamily: 'FiraSans_400Regular',
  },
  progressSection: {
    marginBottom: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'FiraSans_500Medium',
  },
  progressValue: {
    fontSize: 14,
    color: '#EF9631',
    fontFamily: 'FiraSans_700Bold',
  },
  dateSection: {
    marginBottom: 20,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
    fontFamily: 'FiraSans_400Regular',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
  },
  detailButtonText: {
    color: '#2B2E83',
    fontSize: 14,
    marginRight: 5,
    fontFamily: 'FiraSans_600SemiBold',
  },
});