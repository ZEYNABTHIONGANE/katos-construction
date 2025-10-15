import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Icon from 'react-native-vector-icons/MaterialIcons';

type MainMenuNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MenuItem {
  name: keyof RootStackParamList;
  label: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { name: 'Home', label: 'Accueil', icon: 'home' },
  { name: 'Projects', label: 'Projets', icon: 'construction' },
  { name: 'Catalog', label: 'Catalogue', icon: 'category' },
  { name: 'Messages', label: 'Messages', icon: 'message' },
];

const MainMenu = () => {
  const navigation = useNavigation<MainMenuNavigationProp>();
  const route = useRoute();
  const currentScreen = route.name;

  return (
    <View style={styles.container}>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={[
            styles.menuItem,
            currentScreen === item.name && styles.activeMenuItem,
          ]}
          onPress={() => navigation.navigate(item.name)}
        >
          <Icon
            name={item.icon}
            size={24}
            color={currentScreen === item.name ? '#2a4d69' : '#666'}
          />
          <Text
            style={[
              styles.menuText,
              currentScreen === item.name && styles.activeMenuText,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: Dimensions.get('window').width / 4,
  },
  activeMenuItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#2a4d69',
  },
  menuText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeMenuText: {
    color: '#2a4d69',
    fontWeight: '600',
  },
});

export default MainMenu;