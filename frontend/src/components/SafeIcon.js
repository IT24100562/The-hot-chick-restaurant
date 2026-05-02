import React from 'react';
import { Platform, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * SafeIcon - Web-safe icon component that provides fallbacks
 * On web, returns Text with emoji instead of icon
 * On native, returns the actual Ionicons component
 */
export const SafeIcon = ({ name, size = 24, color = '#000000', style, ...props }) => {
  // Icon emoji mappings for web fallback
  const iconEmojis = {
    // Navigation icons
    'home': '🏠',
    'home-outline': '🏠',
    'restaurant': '🍽️',
    'restaurant-outline': '🍽️',
    'cart': '🛒',
    'cart-outline': '🛒',
    'receipt': '📋',
    'receipt-outline': '📋',
    'person': '👤',
    'person-outline': '👤',
    'bicycle': '🚴',
    'bicycle-outline': '🚴',
    'grid': '⚙️',
    'grid-outline': '⚙️',
    'fast-food': '🍔',
    'fast-food-outline': '🍔',
    'chatbubbles': '💬',
    'chatbubbles-outline': '💬',
    'settings': '⚙️',
    'settings-outline': '⚙️',
    
    // Other common icons
    'star': '⭐',
    'arrow-forward': '→',
    'arrow-back': '←',
    'search': '🔍',
    'close': '✕',
    'lock-closed-outline': '🔒',
    'eye-outline': '👁️',
    'eye-off-outline': '🚫',
    'mail-outline': '✉️',
    'add': '➕',
    'trash-outline': '🗑️',
    'create-outline': '✏️',
    'arrow-forward-ios': '→',
    'arrow-back-ios': '←',
    'shopping-cart': '🛒',
    'error-outline': '⚠️',
  };

  const emoji = iconEmojis[name] || '•';
  const fontSize = Math.round(size * 0.75);

  if (Platform.OS === 'web') {
    return (
      <Text style={[{ fontSize, color, width: size, textAlign: 'center' }, style]}>
        {emoji}
      </Text>
    );
  }

  return <Ionicons name={name} size={size} color={color} style={style} {...props} />;
};
