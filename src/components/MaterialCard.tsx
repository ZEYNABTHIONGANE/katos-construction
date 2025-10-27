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
  horizontal?: boolean;
}

export default function MaterialCard({
  material,
  onPress,
  onSelect,
  isSelected = false,
  horizontal = false,
}: MaterialCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (horizontal) {
    return (
      <TouchableOpacity
        style={[styles.horizontalContainer, isSelected && styles.selectedHorizontalContainer]}
        onPress={onPress}
      >
        <View style={styles.horizontalCardInner}>
          <View style={styles.horizontalImageContainer}>
            <Image source={{ uri: material.imageUrl }} style={styles.horizontalImage} />

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{material.category}</Text>
            </View>
          </View>

          <View style={styles.horizontalContent}>
            <View style={styles.horizontalHeader}>
              <View style={styles.horizontalInfo}>
                <Text style={styles.horizontalName} numberOfLines={1}>
                  {material.name}
                </Text>
                <Text style={styles.horizontalPrice}>{formatPrice(material.price)}</Text>
              </View>

              {onSelect && (
                <TouchableOpacity
                  style={[
                    styles.horizontalSelectButton,
                    isSelected && styles.selectedHorizontalButton,
                  ]}
                  onPress={onSelect}
                >
                  <MaterialIcons
                    name={isSelected ? 'check' : 'add'}
                    size={14}
                    color={isSelected ? '#FFFFFF' : '#2B2E83'}
                  />
                </TouchableOpacity>
              )}
            </View>

            {material.description && (
              <Text style={styles.horizontalDescription} numberOfLines={2}>
                {material.description}
              </Text>
            )}

            {material.supplier && (
              <View style={styles.horizontalSupplierContainer}>
                <MaterialIcons name="business" size={12} color="#6B7280" />
                <Text style={styles.horizontalSupplier}>{material.supplier}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}
    >
      <View style={styles.cardInner}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: material.imageUrl }} style={styles.image} />

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{material.category}</Text>
          </View>

          {isSelected && (
            <View style={styles.selectedBadge}>
              <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
            </View>
          )}

          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{formatPrice(material.price)}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>
            {material.name}
          </Text>

          {material.description && (
            <Text style={styles.description} numberOfLines={2}>
              {material.description}
            </Text>
          )}

          {material.supplier && (
            <View style={styles.supplierContainer}>
              <MaterialIcons name="business" size={14} color="#6B7280" />
              <Text style={styles.supplier}>{material.supplier}</Text>
            </View>
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
                color={isSelected ? '#FFFFFF' : '#2B2E83'}
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
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  selectedContainer: {
    transform: [{ scale: 0.98 }],
    borderWidth: 3,
    borderColor: '#E96C2E',
  },
  cardInner: {
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    position: 'relative',
    height: 140,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#E96C2E',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  priceBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(43, 46, 131, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  priceText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_700Bold',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 14,
    color: '#2B2E83',
    marginBottom: 8,
    fontFamily: 'FiraSans_600SemiBold',
    lineHeight: 18,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(233, 108, 46, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
    fontFamily: 'FiraSans_400Regular',
  },
  supplierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  supplier: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    fontFamily: 'FiraSans_400Regular',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F1FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B2E83',
    shadowColor: '#2B2E83',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedButton: {
    backgroundColor: '#E96C2E',
    borderColor: '#E96C2E',
    shadowColor: '#E96C2E',
  },
  selectButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  selectedButtonText: {
    color: '#FFFFFF',
  },

  // Styles horizontaux
  horizontalContainer: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  selectedHorizontalContainer: {
    borderWidth: 2,
    borderColor: '#E96C2E',
  },
  horizontalCardInner: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    padding: 12,
  },
  horizontalImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  horizontalContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  horizontalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  horizontalInfo: {
    flex: 1,
  },
  horizontalName: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 2,
  },
  horizontalPrice: {
    fontSize: 13,
    color: '#E96C2E',
    fontFamily: 'FiraSans_700Bold',
  },
  horizontalSelectButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F1FF',
    borderWidth: 1,
    borderColor: '#2B2E83',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  selectedHorizontalButton: {
    backgroundColor: '#E96C2E',
    borderColor: '#E96C2E',
  },
  horizontalDescription: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    lineHeight: 14,
    marginBottom: 4,
  },
  horizontalSupplierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  horizontalSupplier: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 4,
    fontFamily: 'FiraSans_400Regular',
  },
});