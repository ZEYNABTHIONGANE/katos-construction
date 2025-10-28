import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { Toast } from 'toastify-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList, Category, Material, Selection } from '../../types';
import CategoryButton from '../../components/CategoryButton';
import MaterialCard from '../../components/MaterialCard';
import { mockCategories, mockSelections } from '../../data/mockData';

type Props = BottomTabScreenProps<HomeTabParamList, 'Finitions'>;

export default function FinitionsScreen({ navigation }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(mockCategories[0] || null);
  const [userSelections, setUserSelections] = useState<Selection[]>(mockSelections);
  const [showSelectionsModal, setShowSelectionsModal] = useState(false);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleMaterialSelect = (material: Material) => {
    const existingSelection = userSelections.find(
      (s) => s.materialId === material.id
    );

    if (existingSelection) {
      // Remove selection
      setUserSelections(
        userSelections.filter((s) => s.materialId !== material.id)
      );
    } else {
      // Add selection
      const newSelection: Selection = {
        id: `sel${Date.now()}`,
        materialId: material.id,
        material,
        selectedAt: new Date(),
      };
      setUserSelections([...userSelections, newSelection]);
    }
  };

  const isSelected = (materialId: string) => {
    return userSelections.some((s) => s.materialId === materialId);
  };

  const handleConfirmSelections = () => {
    Toast.success('Sélections confirmées avec succès !');
    setShowSelectionsModal(false);
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <CategoryButton
      name={item.name}
      icon={item.icon}
      onPress={() => handleCategorySelect(item)}
      isSelected={selectedCategory?.id === item.id}
    />
  );

  const renderMaterial = ({ item }: { item: Material }) => (
    <MaterialCard
      material={item}
      onSelect={() => handleMaterialSelect(item)}
      isSelected={isSelected(item.id)}
      horizontal={true}
    />
  );

  const renderSelection = ({ item }: { item: Selection }) => (
    <MaterialCard
      material={item.material}
      onSelect={() => handleMaterialSelect(item.material)}
      isSelected={true}
      horizontal={true}
    />
  );

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
          <Text style={styles.headerTitle}>Finitions</Text>
          <View style={styles.headerRight} />
        </View>

      <View style={styles.content}>
        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <FlatList
            data={mockCategories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Materials or Selections */}
        <View style={styles.materialsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory ? selectedCategory.name : 'Matériaux'}
            </Text>
            <TouchableOpacity
              style={styles.selectionsButton}
              onPress={() => setShowSelectionsModal(true)}
            >
              <MaterialIcons name="check-circle" size={20} color="#E96C2E" />
              <Text style={styles.selectionsButtonText}>
                Mes sélections ({userSelections.length})
              </Text>
            </TouchableOpacity>
          </View>

          {selectedCategory && selectedCategory.materials.length > 0 ? (
            <FlatList
              data={selectedCategory.materials}
              renderItem={renderMaterial}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.materialsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="construction" size={48} color="#E0E0E0" />
              <Text style={styles.emptyStateText}>
                {selectedCategory ? 'Aucun matériau disponible dans cette catégorie' : 'Aucune catégorie disponible'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedCategory ? 'Cette section sera bientôt mise à jour' : 'Veuillez vérifier votre connexion'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Selections Modal */}
      <Modal
        visible={showSelectionsModal}
        animationType="slide"
        onRequestClose={() => setShowSelectionsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mes sélections</Text>
            <TouchableOpacity onPress={() => setShowSelectionsModal(false)}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {userSelections.length > 0 ? (
            <FlatList
              data={userSelections}
              renderItem={renderSelection}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContent}
            />
          ) : (
            <View style={styles.emptySelections}>
              <MaterialIcons name="shopping-cart" size={48} color="#E0E0E0" />
              <Text style={styles.emptySelectionsText}>
                Aucune sélection pour le moment
              </Text>
              <Text style={styles.emptySelectionsSubtext}>
                Parcourez les catégories et choisissez vos matériaux
              </Text>
            </View>
          )}

          {userSelections.length > 0 && (
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmSelections}
              >
                <Text style={styles.confirmButtonText}>
                  Confirmer mes sélections
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
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
  categoriesSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 40,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#2B2E83',
    paddingHorizontal: 20,
    marginBottom: 15,
    fontFamily: 'FiraSans_700Bold',
  },
  categoriesList: {
    paddingLeft: 20,
  },
  materialsSection: {
    flex: 1,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  selectionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E96C2E',
  },
  selectionsButtonText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
  },
  materialsList: {
    paddingHorizontal: 20,
    paddingBottom: 130, // Espace pour la navigation flottante
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'FiraSans_400Regular',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'FiraSans_400Regular',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2B2E83',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'FiraSans_700Bold',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptySelections: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptySelectionsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'FiraSans_400Regular',
  },
  emptySelectionsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'FiraSans_400Regular',
  },
  modalFooter: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#E96C2E',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'FiraSans_700Bold',
  },
});