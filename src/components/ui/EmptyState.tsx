import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    actionText?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    actionText,
    onAction
}) => {
    return (
        <View style={styles.container}>
            <Ionicons name={icon as any} size={64} color="#E5E7EB" />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        marginTop: 40,
    },
    title: {
        fontSize: 18,
        fontFamily: 'FiraSans_600SemiBold',
        color: '#374151',
        marginTop: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        fontFamily: 'FiraSans_400Regular',
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
    },
});
