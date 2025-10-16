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
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { HomeTabParamList } from "../../types";
import { mockUser, mockProject, mockProjectUpdates } from "../../data/mockData";

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
      title: "Avancement",
      value: `${mockProject.progress}%`,
      icon: "trending-up",
      iconColor: "#2B2E83",
      iconBg: "#E8E9F7",
    },
    {
      id: "2",
      title: "Phase actuelle",
      value: "Toiture",
      icon: "construction",
      iconColor: "#EF9631",
      iconBg: "#FDF4E8",
    },
    {
      id: "3",
      title: "Messages",
      value: "5",
      icon: "chat",
      iconColor: "#2B2E83",
      iconBg: "#E8E9F7",
    },
    {
      id: "4",
      title: "Finitions",
      value: "3/12",
      icon: "palette",
      iconColor: "#EF9631",
      iconBg: "#FDF4E8",
    },
  ];

  const renderStatCard = (stat: (typeof statisticsData)[0]) => (
    <View key={stat.id} style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: stat.iconBg }]}>
        <MaterialIcons
          name={stat.icon as any}
          size={24}
          color={stat.iconColor}
        />
      </View>
      <Text style={styles.statTitle}>{stat.title}</Text>
      <Text style={styles.statValue}>{stat.value}</Text>
    </View>
  );

  const renderRecentUpdate = (
    update: (typeof mockProjectUpdates)[0],
    index: number
  ) => (
    <TouchableOpacity key={update.id} style={styles.updateItem}>
      <View style={styles.updateAvatar}>
        <MaterialIcons
          name={update.status === "completed" ? "check-circle" : "schedule"}
          size={20}
          color={update.status === "completed" ? "#4CAF50" : "#FF9800"}
        />
      </View>
      <View style={styles.updateContent}>
        <Text style={styles.updateTitle}>{update.title}</Text>
        <Text style={styles.updateDate}>{update.date}</Text>
      </View>
      <View
        style={[
          styles.updateStatus,
          {
            backgroundColor:
              update.status === "completed" ? "#E8F5E8" : "#FFF3E0",
          },
        ]}
      >
        <Text
          style={[
            styles.updateStatusText,
            { color: update.status === "completed" ? "#4CAF50" : "#FF9800" },
          ]}
        >
          {update.status === "completed" ? "Terminé" : "En cours"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
        {/* Header moderne */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Bonjour</Text>
            <Text style={styles.userName}>
              {mockUser.name.split(" ")[0]} 👋
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("Profil")}
          >
            <Image
              source={{ uri: mockUser.avatar }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Section Statistiques */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle,{paddingBottom: 14}]}>Tableau de bord</Text>
            <View style={styles.statsGrid}>
              {statisticsData.map(renderStatCard)}
            </View>
          </View>

          {/* Projet Principal */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mon Projet</Text>
              <TouchableOpacity onPress={handleProjectPress}>
                <Text style={styles.seeMoreText}>Voir détails</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.projectCard}
              onPress={handleProjectPress}
            >
              <Image
                source={{ uri: mockProject.imageUrl }}
                style={styles.projectImage}
              />
              <View style={styles.projectInfo}>
                <Text style={styles.projectName}>{mockProject.name}</Text>
                <Text style={styles.projectAddress}>{mockProject.address}</Text>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${mockProject.progress}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {mockProject.progress}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Actions Rapides */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle,{paddingBottom: 14}]}>Actions Rapides</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate("Chantier")}
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: "#E3F2FD" }]}
                >
                  <MaterialIcons
                    name="construction"
                    size={24}
                    color="#2196F3"
                  />
                </View>
                <Text style={styles.actionText}>Chantier</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={handleChatPress}
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: "#E8F5E8" }]}
                >
                  <MaterialIcons name="chat" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.actionText}>Messages</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate("Finitions")}
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: "#FCE4EC" }]}
                >
                  <MaterialIcons name="palette" size={24} color="#E91E63" />
                </View>
                <Text style={styles.actionText}>Finitions</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mises à jour récentes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mises à jour récentes</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Chantier")}>
                <Text style={styles.seeMoreText}>Voir plus</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.updatesContainer}>
              {mockProjectUpdates.slice(0, 4).map(renderRecentUpdate)}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
     backgroundColor: "#2B2E83",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 80,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20, 


  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
    fontFamily: 'FiraSans_400Regular',
  },
  userName: {
    fontSize: 20,
    color: "#FFFFFF",
    fontFamily: 'FiraSans_700Bold',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingBottom: 130, // Espace pour la navigation flottante
    paddingTop: 40,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#1A1A1A",
    fontFamily: 'FiraSans_700Bold',
  },
  seeMoreText: {
    fontSize: 14,
    color: "#2B2E83",
    fontFamily: 'FiraSans_500Medium',
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    width: (width - 60) / 2,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    textAlign: "center",
    fontFamily: 'FiraSans_400Regular',
  },
  statValue: {
    fontSize: 18,
    color: "#1A1A1A",
    textAlign: "center",
    fontFamily: 'FiraSans_700Bold',
  },
  projectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  projectImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#F3F4F6",
  },
  projectInfo: {
    padding: 16,
  },
  projectName: {
    fontSize: 16,
    color: "#1A1A1A",
    marginBottom: 4,
    fontFamily: 'FiraSans_600SemiBold',
  },
  projectAddress: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
    fontFamily: 'FiraSans_400Regular',
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginRight: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2B2E83",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#2B2E83",
    fontFamily: 'FiraSans_600SemiBold',
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    width: (width - 80) / 3,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: "#1A1A1A",
    textAlign: "center",
    fontFamily: 'FiraSans_500Medium',
  },
  updatesContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  updateItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  updateAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  updateContent: {
    flex: 1,
  },
  updateTitle: {
    fontSize: 14,
    color: "#1A1A1A",
    marginBottom: 2,
    fontFamily: 'FiraSans_500Medium',
  },
  updateDate: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: 'FiraSans_400Regular',
  },
  updateStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  updateStatusText: {
    fontSize: 11,
    fontFamily: 'FiraSans_500Medium',
  },
  safeArea: {
    flex: 1,
  },
});
