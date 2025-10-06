import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';

type CatalogScreenRouteProp = RouteProp<RootStackParamList, 'Catalog'>;

const CatalogScreen = () => {
  const route = useRoute<CatalogScreenRouteProp>();
  const { category } = route.params || {};

  const categories = [
    { id: 1, name: 'Revêtements', count: 24 },
    { id: 2, name: 'Peintures', count: 18 },
    { id: 3, name: 'Sanitaires', count: 12 },
    { id: 4, name: 'Électricité', count: 15 },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Catalogue</Text>
        {category && (
          <Text style={styles.subtitle}>{category}</Text>
        )}
      </View>

      <View style={styles.grid}>
        {categories.map((cat) => (
          <TouchableOpacity key={cat.id} style={styles.card}>
            <Text style={styles.cardTitle}>{cat.name}</Text>
            <Text style={styles.cardCount}>{cat.count} articles</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  grid: {
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    width: '45%',
    backgroundColor: '#fff',
    margin: '2.5%',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2a4d69',
    marginBottom: 4,
  },
  cardCount: {
    fontSize: 14,
    color: '#666',
  },
});

export default CatalogScreen;