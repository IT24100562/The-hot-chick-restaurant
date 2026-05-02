import React from 'react';
import { View, StyleSheet } from 'react-native';

export const PremiumCard = ({
  children,
  variant = 'light', // light, green, elevated
  padding = 16,
  marginVertical = 10,
  marginHorizontal = 16,
  onPress,
  style,
}) => {
  const variants = {
    light: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E2E8F0',
      elevation: 3,
    },
    green: {
      backgroundColor: '#DCFCE7',
      borderColor: '#BBF7D0',
      elevation: 2,
    },
    elevated: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E2E8F0',
      elevation: 8,
    },
  };

  const variantStyle = variants[variant];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          elevation: variantStyle.elevation,
          padding,
          marginVertical,
          marginHorizontal,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
});
