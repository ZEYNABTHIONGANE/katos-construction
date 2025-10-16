import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Material } from '../types';

interface MaterialCardProps {
  material: Material;
  onPress?: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

export default function MaterialCard({
  material,
  onPress,
  onSelect,
  isSelected = false,
}: MaterialCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}
    >
      <Image source={{ uri: material.imageUrl }} style={styles.image} />

      {isSelected && (
        <View style={styles.selectedOverlay}>
          <MaterialIcons name="check-circle" size={24} color="#EF9631" />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {material.name}
        </Text>

        {material.description && (
          <Text style={styles.description} numberOfLines={2}>
            {material.description}
          </Text>
        )}

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(material.price)}</Text>
          <Text style={styles.category}>{material.category}</Text>
        </View>

        {material.supplier && (
          <Text style={styles.supplier}>Fournisseur: {material.supplier}</Text>
        )}

        {onSelect && (
          <TouchableOpacity
            style={[
              styles.selectButton,
              isSelected && styles.selectedButton,
            ]}
            onPress={onSelect}
          >
            <MaterialIcons
              name={isSelected ? 'check' : 'add'}
              size={16}
              color={isSelected ? '#fff' : '#2B2E83'}
            />
            <Text
              style={[
                styles.selectButtonText,
                isSelected && styles.selectedButtonText,
              ]}
            >
              {isSelected ? 'Sélectionné' : 'Choisir'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: '#EF9631',
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: '#F5F5F5',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  content: {
    padding: 15,
  },
  name: {
    fontSize: 16,
    color: '#2B2E83',
    marginBottom: 5,
    fontFamily: 'FiraSans_700Bold',
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    lineHeight: 16,
    fontFamily: 'FiraSans_400Regular',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    color: '#EF9631',
    fontFamily: 'FiraSans_700Bold',
  },
  category: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontFamily: 'FiraSans_400Regular',
  },
  supplier: {
    fontSize: 11,
    color: '#666',
    marginBottom: 10,
    fontFamily: 'FiraSans_400Regular',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2B2E83',
  },
  selectedButton: {
    backgroundColor: '#EF9631',
    borderColor: '#EF9631',
  },
  selectButtonText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  selectedButtonText: {
    color: '#fff',
  },
});