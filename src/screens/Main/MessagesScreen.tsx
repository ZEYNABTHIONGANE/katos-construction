import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const MessagesScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <ScrollView style={styles.messageList}>
        <TouchableOpacity style={styles.messageCard}>
          <View style={styles.messageHeader}>
            <Text style={styles.sender}>Chef de projet</Text>
            <Text style={styles.time}>14:30</Text>
          </View>
          <Text style={styles.preview}>Validation des plans de la semaine...</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.messageCard}>
          <View style={styles.messageHeader}>
            <Text style={styles.sender}>Support technique</Text>
            <Text style={styles.time}>Hier</Text>
          </View>
          <Text style={styles.preview}>Questions sur les matériaux...</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  messageList: {
    padding: 15,
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4b86b4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sender: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2a4d69',
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  preview: {
    fontSize: 14,
    color: '#666',
  },
});

export default MessagesScreen;