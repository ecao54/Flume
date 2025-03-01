import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ButtonBar = ({ navigation, activeScreen }) => {
  const insets = useSafeAreaInsets();
  
  const buttons = [
    { name: 'Home', screen: 'Home' },
    { name: 'Send', screen: 'Send' },
    { name: 'Receive', screen: 'Receive' },
    { name: 'Profile', screen: 'Profile' }
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
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
  activeButton: {
    borderTopWidth: 2,
    borderTopColor: '#007AFF', // iOS blue
  },
  buttonText: {
    fontSize: 12,
    color: '#8E8E93', // iOS gray
  },
  activeButtonText: {
    color: '#007AFF', // iOS blue
    fontWeight: '500',
  },
});

export default ButtonBar;
