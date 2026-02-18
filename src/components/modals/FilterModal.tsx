import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApplyFilters: (filters: any) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApplyFilters }) => {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.title}>Filtres</Text>
                    <Text style={styles.message}>Les filtres avancés seront bientôt disponibles.</Text>
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>Fermer</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: 'white',
        padding: 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    message: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#2B2E83',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
