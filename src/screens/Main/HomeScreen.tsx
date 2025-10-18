import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { HomeTabParamList } from "../../types";
import { mockUser, mockProject, mockProjectUpdates } from "../../data/mockData";
import AppHeader from "../../components/AppHeader";
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';

type Props = BottomTabScreenProps<HomeTabParamList, "Home">;

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }: Props) {
  const handleProjectPress = () => {
    navigation.navigate("Chantier");
  };

  const handleChatPress = () => {
    navigation.navigate("Chat");
  };

  const statisticsData = [
    {
      id: "1",
      title: "Avancement projet",
      value: `${mockProject.progress}%`,
      icon: "trending-up",
      color: "#2B2E83",
      backgroundColor: "#F8F9FF",
    },
    {
      id: "2",
      title: "Phase actuelle",
      value: "Toiture",
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
    {
      id: "4",
      title: "Documents",
      value: "12",
      icon: "description",
      color: "#E96C2E",
      backgroundColor: "#FFF7ED",
    },
  ];

  const renderStatCard = (stat: (typeof statisticsData)[0]) => (
    <TouchableOpacity key={stat.id} style={styles.statCard}>
      <View style={[styles.statCardContent, { backgroundColor: stat.backgroundColor }]}>
        <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
          <MaterialIcons name={stat.icon as any} size={28} color={stat.color} />
        </View>
        <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
        <Text style={styles.statTitle}>{stat.title}</Text>
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
          <Text style={styles.name}>{mockUser.name.split(" ")[0]}</Text>
          <Text style={styles.subtitle}>Client chez Katos Construction</Text>
        </ExpoLinearGradient>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Aperçu général</Text>
          <View style={styles.statsGrid}>
            {statisticsData.map(renderStatCard)}
          </View>
        </View>

        <View style={styles.projectsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mon projet</Text>
            <TouchableOpacity onPress={handleProjectPress}>
              <Text style={styles.seeAllText}>Voir détails</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.projectCard} onPress={handleProjectPress}>
            <View style={styles.projectCardInner}>
              <View style={styles.projectHeader}>
                <View style={styles.projectInfo}>
                  <Text style={styles.projectName}>{mockProject.name}</Text>
                  <Text style={styles.clientName}>{mockProject.address}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#E0B043' }]}>
                  <Text style={styles.statusText}>En cours</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progression</Text>
                  <Text style={styles.progressValue}>{mockProject.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <ExpoLinearGradient
                    colors={['#2B2E83', '#E96C2E']}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={[
                      styles.progressFill,
                      { width: `${mockProject.progress}%` }
                    ]}
                  />
                </View>
              </View>

              <View style={styles.projectFooter}>
                <View style={styles.dueDateContainer}>
                  <View style={styles.iconContainer}>
                    <MaterialIcons name="schedule" size={18} color="#2B2E83" />
                  </View>
                  <Text style={styles.dueDate}>Début: Janvier 2024</Text>
                </View>
                <View style={styles.arrowContainer}>
                  <MaterialIcons name="arrow-forward-ios" size={18} color="#2B2E83" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Mises à jour récentes */}
        <View style={styles.projectsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mises à jour récentes</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Chantier")}>
              <Text style={styles.seeAllText}>Voir plus</Text>
            </TouchableOpacity>
          </View>

          {mockProjectUpdates.slice(0, 3).map((update) => (
            <TouchableOpacity key={update.id} style={styles.projectCard}>
              <View style={styles.projectCardInner}>
                <View style={styles.projectHeader}>
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectName}>{update.title}</Text>
                    <Text style={styles.clientName}>{update.date}</Text>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor: update.status === 'completed' ? '#4CAF50' : '#E96C2E'
                  }]}>
                    <Text style={styles.statusText}>
                      {update.status === 'completed' ? 'Terminé' : 'En cours'}
                    </Text>
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
    fontFamily: 'FiraSans_500Medium',
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
    fontFamily: 'FiraSans_500Medium',
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
    fontFamily: 'FiraSans_500Medium',
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
    fontFamily: 'FiraSans_500Medium',
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
