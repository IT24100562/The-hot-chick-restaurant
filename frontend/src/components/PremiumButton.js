import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export const PremiumButton = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, outline, danger
  size = 'md', // sm, md, lg
  loading = false,
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  const variants = {
    primary: {
      bg: '#16A34A',
      text: '#FFFFFF',
      shadow: '#16A34A',
    },
    secondary: {
      bg: '#DCFCE7',
      text: '#16A34A',
      border: '#16A34A',
    },
    outline: {
      bg: '#FFFFFF',
      text: '#16A34A',
      border: '#16A34A',
    },
    danger: {
      bg: '#EF4444',
      text: '#FFFFFF',
      shadow: '#EF4444',
    },
  };

  const sizes = {
    sm: { paddingHorizontal: 12, paddingVertical: 8, fontSize: 12 },
    md: { paddingHorizontal: 24, paddingVertical: 14, fontSize: 16 },
    lg: { paddingHorizontal: 32, paddingVertical: 18, fontSize: 18 },
  };

  const variantStyle = variants[variant];
  const sizeStyle = sizes[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: variantStyle.bg,
          borderWidth: variantStyle.border ? 2 : 0,
          borderColor: variantStyle.border,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          paddingVertical: sizeStyle.paddingVertical,
          opacity: disabled ? 0.6 : 1,
          shadowColor: variantStyle.shadow,
          shadowOpacity: variant === 'primary' || variant === 'danger' ? 0.3 : 0,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: variantStyle.text,
              fontSize: sizeStyle.fontSize,
              fontWeight: variant === 'outline' ? '600' : '700',
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
