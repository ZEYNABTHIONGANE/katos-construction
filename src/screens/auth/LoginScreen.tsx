import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, User } from '../../types';
// Import removed - we'll use authService instead
import { authService } from '../../services/authService';
import { useClientAuth } from '../../hooks/useClientAuth';
import { Toast } from 'toastify-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Use the client auth hook for mobile clients
  const clientAuth = useClientAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [detectedUserType, setDetectedUserType] = useState<'chef' | 'client' | null>(null);

  // Animation references
  const usernameInputAnimation = useRef(new Animated.Value(0)).current;
  const passwordInputAnimation = useRef(new Animated.Value(0)).current;
  const buttonAnimation = useRef(new Animated.Value(1)).current;
  const successAnimation = useRef(new Animated.Value(0)).current;

  // Auto-detect user type and validate
  const validateUsername = (text: string) => {
    if (text.length === 0) {
      setUsernameValid(null);
      setDetectedUserType(null);
      return;
    }

    // Auto-detect user type based on input format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^CLI\d{9}$/;

    if (emailRegex.test(text)) {
      // Email format detected → Chef
      setDetectedUserType('chef');
      setUsernameValid(true);
    } else if (usernameRegex.test(text)) {
      // CLI format detected → Client
      setDetectedUserType('client');
      setUsernameValid(true);
    } else {
      // Invalid format
      setUsernameValid(false);
      // Try to detect intended type based on partial input
      if (text.includes('@') || text.includes('.')) {
        setDetectedUserType('chef');
      } else if (text.startsWith('CLI')) {
        setDetectedUserType('client');
      } else {
        setDetectedUserType(null);
      }
    }
  };

  // Animation handlers
  const animateInput = (animation: Animated.Value, toValue: number) => {
    Animated.spring(animation, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const animateButton = (toValue: number) => {
    Animated.spring(buttonAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleUsernameFocus = () => {
    setUsernameFocused(true);
    animateInput(usernameInputAnimation, 1);
  };

  const handleUsernameBlur = () => {
    setUsernameFocused(false);
    animateInput(usernameInputAnimation, 0);
  };

  const handlePasswordFocus = () => {
    setPasswordFocused(true);
    animateInput(passwordInputAnimation, 1);
  };

  const handlePasswordBlur = () => {
    setPasswordFocused(false);
    animateInput(passwordInputAnimation, 0);
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    validateUsername(text);
  };

  // Plus besoin de toggle mode - détection automatique
  const clearForm = () => {
    setUsername('');
    setPassword('');
    setUsernameValid(null);
    setDetectedUserType(null);
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    // Validate input format based on detected type
    if (!detectedUserType) {
      Alert.alert(
        'Format invalide',
        'Utilisez un email (chef@exemple.com) ou un identifiant client (CLI123456789)'
      );
      return;
    }

    if (detectedUserType === 'chef') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(username)) {
        Alert.alert(
          'Format invalide',
          'Veuillez entrer une adresse email valide'
        );
        return;
      }
    } else {
      const usernameRegex = /^CLI\d{9}$/;
      if (!usernameRegex.test(username)) {
        Alert.alert(
          'Format invalide',
          'L\'identifiant client doit suivre le format CLI123456789'
        );
        return;
      }
    }

    setLoading(true);
    animateButton(0.95);

    try {
      if (detectedUserType === 'chef') {
        // Chef login with email
        await authService.signIn(username, password);
      } else {
        // Client login with username
        await authService.signInWithUsername(username, password);
        // Force the client auth hook to detect the new session
        await clientAuth.forceRefresh();
        console.log('✅ Client auth completed');

        // Force immediate navigation to ClientTabs
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'ClientTabs' }],
          });
        }, 100);
        return; // Exit early to prevent normal flow
      }

      setLoginSuccess(true);

      // Success animation
      Animated.sequence([
        Animated.timing(successAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.timing(successAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();

      Toast.success('Connexion réussie');
      // La navigation sera gérée automatiquement par onAuthStateChanged
    } catch (error: any) {
      console.error('Erreur de connexion:', error);

      let errorMessage = detectedUserType === 'chef'
        ? 'Email ou mot de passe incorrect'
        : 'Identifiant ou mot de passe incorrect';

      if (detectedUserType === 'client') {
        if (error.message === 'USERNAME_NOT_FOUND') {
          errorMessage = 'Identifiant introuvable. Vérifiez le format (ex: CLI123456789)';
        } else if (error.message === 'USER_BLOCKED' || error.message === 'ACCOUNT_DISABLED') {
          errorMessage = 'Ce compte a été désactivé. Contactez le support';
        }
      }

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte trouvé';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mot de passe incorrect';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Compte invalide';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Ce compte a été désactivé';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives de connexion. Réessayez plus tard';
      }

      Alert.alert('Erreur de connexion', errorMessage);
    } finally {
      setLoading(false);
      setLoginSuccess(false);
      animateButton(1);
    }
  };

  return (
    <ExpoLinearGradient
      colors={['#2B2E83', '#E96C2E']}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Showcase')}
          >
            <MaterialIcons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 50}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {/* Header Section */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Image source={require('../../assets/logo.png')} style={styles.logo} />
                </View>
                <Text style={styles.title}>Katos Connect</Text>
                <Text style={styles.subtitle}>
                  Connectez-vous avec votre email ou identifiant client
                </Text>

                {/* Indicateur de type détecté */}
                {detectedUserType && (
                  <View style={styles.userTypeIndicator}>
                    <MaterialIcons
                      name={detectedUserType === 'chef' ? 'engineering' : 'person'}
                      size={16}
                      color="#10B981"
                    />
                    <Text style={styles.userTypeText}>
                      {detectedUserType === 'chef' ? 'Chef de chantier' : 'Client'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Form Section */}
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Animated.View style={[
                    styles.inputWrapper,
                    {
                      borderColor: usernameInputAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          usernameValid === true ? '#10B981' :
                            usernameValid === false ? '#EF4444' : '#E5E7EB',
                          '#2B2E83'
                        ]
                      }),
                      borderWidth: usernameInputAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1.5, 2]
                      }),
                      shadowOpacity: usernameInputAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.1]
                      })
                    }
                  ]}>
                    <MaterialIcons
                      name="person"
                      size={20}
                      color={usernameFocused ? '#2B2E83' : usernameValid === true ? '#10B981' : usernameValid === false ? '#EF4444' : '#6B7280'}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="email@exemple.com ou CLI123456789"
                      placeholderTextColor="#9CA3AF"
                      value={username}
                      onChangeText={handleUsernameChange}
                      onFocus={handleUsernameFocus}
                      onBlur={handleUsernameBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      maxLength={50}
                      multiline={false}
                      numberOfLines={1}
                    />
                    {usernameValid === true && (
                      <MaterialIcons
                        name="check-circle"
                        size={18}
                        color="#10B981"
                        style={styles.validationIcon}
                      />
                    )}
                    {usernameValid === false && username.length > 0 && (
                      <MaterialIcons
                        name="error"
                        size={18}
                        color="#EF4444"
                        style={styles.validationIcon}
                      />
                    )}
                  </Animated.View>
                </View>

                <View style={styles.inputContainer}>
                  <Animated.View style={[
                    styles.inputWrapper,
                    {
                      borderColor: passwordInputAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['#E5E7EB', '#2B2E83']
                      }),
                      borderWidth: passwordInputAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1.5, 2]
                      }),
                      shadowOpacity: passwordInputAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.1]
                      })
                    }
                  ]}>
                    <MaterialIcons
                      name="lock"
                      size={20}
                      color={passwordFocused ? '#2B2E83' : '#6B7280'}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Mot de passe"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={handlePasswordFocus}
                      onBlur={handlePasswordBlur}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                      multiline={false}
                      numberOfLines={1}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <MaterialIcons
                        name={showPassword ? 'visibility' : 'visibility-off'}
                        size={20}
                        color={passwordFocused ? '#2B2E83' : '#6B7280'}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                </View>

                <Animated.View style={{
                  transform: [{ scale: buttonAnimation }]
                }}>
                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      loading && styles.loginButtonDisabled,
                      loginSuccess && styles.loginButtonSuccess
                    ]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <View style={styles.buttonContent}>
                        <ActivityIndicator color="#FFFFFF" size="small" />
                        <Text style={[styles.loginButtonText, { marginLeft: 8 }]}>
                          Connexion...
                        </Text>
                      </View>
                    ) : loginSuccess ? (
                      <Animated.View
                        style={[
                          styles.buttonContent,
                          {
                            opacity: successAnimation,
                            transform: [{
                              scale: successAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.8, 1]
                              })
                            }]
                          }
                        ]}
                      >
                        <MaterialIcons name="check" color="#FFFFFF" size={20} />
                        <Text style={[styles.loginButtonText, { marginLeft: 8 }]}>
                          Connecté
                        </Text>
                      </Animated.View>
                    ) : (
                      <Text style={styles.loginButtonText}>Se connecter</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ExpoLinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 56,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#f7f7f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'FiraSans_700Bold',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontFamily: 'FiraSans_400Regular',
    marginBottom: 16,
  },
  userTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginTop: 12,
  },
  userTypeText: {
    fontSize: 12,
    color: '#10B981',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 4,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    marginHorizontal: 6,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFCFD',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 14,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 14, // Slightly smaller to ensure long placeholder fits
    color: '#1A1A1A',
    fontFamily: 'FiraSans_400Regular',
    textAlignVertical: 'center', // Fix for Android centering/wrapping
  },
  validationIcon: {
    marginLeft: 8,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  loginButton: {
    backgroundColor: '#2B2E83',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#2B2E83',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 56,
  },
  loginButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  loginButtonSuccess: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'FiraSans_600SemiBold',
    letterSpacing: 0.5,
  },
  demoContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  demoTitle: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  demoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontFamily: 'FiraSans_400Regular',
  },
  pinTitle: {
    fontSize: 20,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  pinSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
    marginBottom: 32,
  },
  pinInputContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pinInput: {
    width: 120,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'FiraSans_600SemiBold',
    backgroundColor: '#F9FAFB',
    letterSpacing: 8,
  },
  switchModeButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_400Regular',
  },
});