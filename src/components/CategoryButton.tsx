import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CategoryButtonProps {
  name: string;
  icon: string;
  onPress: () => void;
  isSelected?: boolean;
}

export default function CategoryButton({
  name,
  icon,
  onPress,
  isSelected = false,
}: CategoryButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}
    >
      <MaterialIcons
        name={icon as any}
        size={24}
        color={isSelected ? '#fff' : '#2B2E83'}
      />
      <Text style={[styles.name, isSelected && styles.selectedName]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedContainer: {
    backgroundColor: '#2B2E83',
    borderColor: '#2B2E83',
  },
  name: {
    marginTop: 8,
    fontSize: 12,
    color: '#2B2E83',
    textAlign: 'center',
    fontFamily: 'FiraSans_500Medium',
  },
  selectedName: {
    color: '#fff',
  },
});