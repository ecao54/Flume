import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ButtonBar = ({ navigation, activeScreen }) => {
  const insets = useSafeAreaInsets();
  
  const buttons = [
    { name: 'Home', screen: 'Home', icon: require('../assets/home.png'), activeIcon: require('../assets/home-active.png')},
    { name: 'Send', screen: 'Send', icon: require('../assets/send.png'), activeIcon: require('../assets/send-active.png') },
    { name: 'Receive', screen: 'Receive', icon: require('../assets/receive.png'), activeIcon: require('../assets/receive-active.png')},
    { name: 'Profile', screen: 'Profile', icon: require('../assets/profile.png'), activeIcon: require('../assets/profile-active.png')}
  ];
  
  const handlePress = (screenName) => {
    navigation.navigate(screenName);
  };
  
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {buttons.map((button) => (
        
        <TouchableOpacity
          key={button.name}
          style={[
            styles.button,
            activeScreen === button.screen && styles.activeButton
          ]}
          onPress={() => handlePress(button.screen)}
        >
          <Image
            source={activeScreen === button.screen ? button.activeIcon : button.icon}
            style={styles.icon}
          />
          <Text
            style={[
              styles.buttonText,
              activeScreen === button.screen && styles.activeButtonText
            ]}
          >
            {button.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FBFBFC',
    borderTopWidth: .5,
    borderTopColor: '#E6E6E7',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 12,
    fontFamily: 'Figtree',
    fontWeight: '500',
    color: '#B3B3BB'
  },
  activeButtonText: {
    fontWeight: '500',
    color: '#20859E'
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 4
  }
});

export default ButtonBar;
