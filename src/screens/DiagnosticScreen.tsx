import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { diagnosticChantiers } from '../utils/diagnosticChantiers';

export default function DiagnosticScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  // Override console.log pour capturer les résultats
  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);

    const originalLog = console.log;
    const capturedLogs: string[] = [];

    // Intercepter console.log
    console.log = (...args) => {
      const message = args.join(' ');
      capturedLogs.push(message);
      originalLog(...args);
    };

    try {
      await diagnosticChantiers();
    } catch (error) {
      capturedLogs.push(`❌ Erreur: ${error}`);
    }

    // Restaurer console.log
    console.log = originalLog;

    setResults(capturedLogs);
    setIsRunning(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Diagnostic Chantiers</Text>

      <TouchableOpacity
        style={[styles.button, isRunning && styles.buttonDisabled]}
        onPress={runDiagnostic}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? 'Diagnostic en cours...' : 'Lancer le diagnostic'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2B2E83',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
    color: '#333',
  },
});