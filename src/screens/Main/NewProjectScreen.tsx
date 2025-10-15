import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';

type NewProjectScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ProjectForm {
  title: string;
  description: string;
  client: string;
  budget: string;
  startDate: string;
  endDate: string;
}

const NewProjectScreen = () => {
  const [form, setForm] = useState<ProjectForm>({
    title: '',
    description: '',
    client: '',
    budget: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NewProjectScreenNavigationProp>();

  const handleSubmit = async () => {
    if (!form.title || !form.client) {
      Alert.alert('Erreur', 'Veuillez remplir au moins le titre et le client');
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Erreur', 'Vous devez être connecté pour créer un projet');
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        title: form.title,
        description: form.description,
        client: form.client,
        budget: form.budget ? parseFloat(form.budget) : 0,
        startDate: form.startDate || new Date(),
        endDate: form.endDate || null,
        status: 'planning',
        progress: 0,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'projects'), projectData);
      
      Alert.alert('Succès', 'Projet créé avec succès', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Erreur création projet:', error);
      Alert.alert('Erreur', 'Impossible de créer le projet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Nouveau Projet</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Titre du projet *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Rénovation Villa Moderne"
              value={form.title}
              onChangeText={(text) => setForm({ ...form, title: text })}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description détaillée du projet..."
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              multiline
              numberOfLines={4}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Client *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom du client"
              value={form.client}
              onChangeText={(text) => setForm({ ...form, client: text })}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Budget (€)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={form.budget}
              onChangeText={(text) => setForm({ ...form, budget: text })}
              keyboardType="numeric"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date de début</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={form.startDate}
              onChangeText={(text) => setForm({ ...form, startDate: text })}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date de fin prévue</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={form.endDate}
              onChangeText={(text) => setForm({ ...form, endDate: text })}
              editable={!loading}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Icon name="save" size={20} color="#fff" />
              <Text style={styles.buttonText}>Créer le projet</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2a4d69',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2a4d69',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#2a4d69',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default NewProjectScreen;
