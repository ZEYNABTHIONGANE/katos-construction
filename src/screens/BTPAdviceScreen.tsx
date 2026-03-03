
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
    Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Message } from '../types';
import ChatBubble from '../components/ChatBubble';
import { btpAdviceService } from '../services/btpAdviceService';

type Props = NativeStackScreenProps<RootStackParamList, 'BTPAdvice'>;

export default function BTPAdviceScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Bonjour ! Je suis l'expert BTP de Katos. Je suis ici pour vous conseiller exclusivement sur vos projets de construction, rénovation et foncier au Sénégal. Comment puis-je vous aider ?",
            senderId: 'bot',
            senderName: 'Katos Expert',
            timestamp: new Date(),
            isFromUser: false,
            isRead: true,
        }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleSendMessage = async (text?: string) => {
        const messageText = text || newMessage;
        if (!messageText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: messageText.trim(),
            senderId: 'user',
            senderName: 'Moi',
            timestamp: new Date(),
            isFromUser: true,
        };

        setMessages(prev => [...prev, userMsg]);
        setNewMessage('');
        setIsTyping(true);

        try {
            const botResponse = await btpAdviceService.getResponse(messageText);

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: botResponse.text,
                senderId: 'bot',
                senderName: btpAdviceService.getBotName(),
                timestamp: new Date(),
                isFromUser: false,
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Erreur bot:', error);
        } finally {
            setIsTyping(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <ChatBubble message={item} />
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>Katos Conseil</Text>
                        <Text style={styles.headerSubtitle}>Assistant Expert BTP</Text>
                    </View>
                    <View style={styles.headerIconBg}>
                        <MaterialIcons name="engineering" size={24} color="#FFFFFF" />
                    </View>
                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.messagesList}
                        showsVerticalScrollIndicator={false}
                    />

                    {isTyping && (
                        <View style={styles.typingWrapper}>
                            <TypingIndicator />
                            <Text style={styles.typingText}>L'expert analyse votre question...</Text>
                        </View>
                    )}

                    {/* Suggestions rapide */}
                    {!isTyping && messages[messages.length - 1]?.isFromUser === false && (
                        <View style={styles.suggestionsContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                                {['Construction', 'Finitions', 'Vérifier terrain', 'Titre foncier', 'NICAD', 'Notaire', 'Fondations', 'Prix devis'].map((tag, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={styles.suggestionTag}
                                        onPress={() => handleSendMessage(tag)}
                                    >
                                        <Text style={styles.suggestionTagText}>{tag}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Posez votre question BTP..."
                                value={newMessage}
                                onChangeText={setNewMessage}
                                multiline
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, { backgroundColor: newMessage.trim() ? '#2B2E83' : '#E5E7EB' }]}
                                onPress={() => handleSendMessage()}
                                disabled={!newMessage.trim()}
                            >
                                <MaterialIcons
                                    name="send"
                                    size={20}
                                    color={newMessage.trim() ? '#FFFFFF' : '#9CA3AF'}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

import { ScrollView } from 'react-native';

function TypingIndicator() {
    const animation1 = useRef(new Animated.Value(0)).current;
    const animation2 = useRef(new Animated.Value(0)).current;
    const animation3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createAnimation = (anim: Animated.Value, delay: number) => {
            return Animated.sequence([
                Animated.delay(delay),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                        Animated.delay(400) // pause between jumps
                    ])
                )
            ]);
        };

        Animated.parallel([
            createAnimation(animation1, 0),
            createAnimation(animation2, 200),
            createAnimation(animation3, 400),
        ]).start();
    }, []);

    const dotStyle = (anim: Animated.Value) => ({
        transform: [{
            translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -5]
            })
        }],
        opacity: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1]
        })
    });

    return (
        <View style={styles.typingDotsContainer}>
            <Animated.View style={[styles.dot, dotStyle(animation1)]} />
            <Animated.View style={[styles.dot, dotStyle(animation2)]} />
            <Animated.View style={[styles.dot, dotStyle(animation3)]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2B2E83',
        paddingTop: 70,
        paddingHorizontal: 16,
        paddingBottom: 15,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    backButton: {
        padding: 8,
    },
    headerInfo: {
        flex: 1,
        marginLeft: 8,
    },
    headerTitle: {
        fontSize: 18,
        color: '#FFFFFF',
        fontFamily: 'FiraSans_700Bold',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'FiraSans_400Regular',
    },
    headerIconBg: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 12,
    },
    messagesList: {
        padding: 16,
        paddingBottom: 24,
    },
    typingWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        alignSelf: 'flex-start',
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 20,
        marginLeft: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    typingDotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
        height: 12,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E96C2E',
        marginHorizontal: 3,
    },
    typingText: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#6B7280',
        fontFamily: 'FiraSans_400Regular',
    },
    suggestionsContainer: {
        paddingVertical: 10,
        backgroundColor: '#F3F4F6',
    },
    suggestionsScroll: {
        paddingHorizontal: 16,
    },
    suggestionTag: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    suggestionTagText: {
        fontSize: 13,
        color: '#2B2E83',
        fontFamily: 'FiraSans_600SemiBold',
    },
    inputContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 25,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        maxHeight: 100,
        paddingVertical: 8,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});
