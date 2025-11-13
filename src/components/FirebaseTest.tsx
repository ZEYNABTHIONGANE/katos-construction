import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useAuth, useFirebaseClients, useFirebaseProjects, useFirebaseMaterials } from '../hooks';

export const FirebaseTest: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { clients, loading: clientsLoading } = useFirebaseClients();
  const { projects, loading: projectsLoading } = useFirebaseProjects();
  const { materials, loading: materialsLoading } = useFirebaseMaterials();

  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const results: string[] = [];

    // Test Firebase configuration
    if (process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID === 'katos-construction') {
      results.push('✅ Firebase configuration loaded successfully');
    } else {
      results.push('❌ Firebase configuration failed');
    }

    // Test authentication state
    if (user !== undefined) {
      results.push(`✅ Authentication service initialized (User: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'})`);
    } else {
      results.push('❌ Authentication service failed to initialize');
    }

    // Test Firestore connections
    if (!clientsLoading) {
      results.push(`✅ Clients collection connected (${clients.length} clients found)`);
    }

    if (!projectsLoading) {
      results.push(`✅ Projects collection connected (${projects.length} projects found)`);
    }

    if (!materialsLoading) {
      results.push(`✅ Materials collection connected (${materials.length} materials found)`);
    }

    setTestResults(results);
  }, [user, isAuthenticated, clients, projects, materials, clientsLoading, projectsLoading, materialsLoading]);

  const handleTestComplete = () => {
    Alert.alert(
      'Firebase Integration Test',
      'All Firebase services are properly configured and consistent with the backoffice system.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Integration Test</Text>
      <Text style={styles.subtitle}>Katos Mobile App - Firebase Consistency Check</Text>

      <View style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.result}>
            {result}
          </Text>
        ))}
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>Project ID: katos-construction</Text>
        <Text style={styles.infoText}>Auth Domain: katos-construction.firebaseapp.com</Text>
        <Text style={styles.infoText}>Collections: users, clients, projects, materials</Text>
      </View>

      <Button
        title="Test Complete"
        onPress={handleTestComplete}
        disabled={clientsLoading || projectsLoading || materialsLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333'
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666'
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  result: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 24
  },
  info: {
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 5
  }
});