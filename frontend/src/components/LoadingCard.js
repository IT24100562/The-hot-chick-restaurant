import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export const LoadingCard = ({ style }) => {
  const shimmer = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const backgroundColor = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F3F4F6', '#E5E7EB'],
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor,
          },
        ]}
      />
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.line,
            { backgroundColor },
            { width: '100%' },
          ]}
        />
        <Animated.View
          style={[
            styles.line,
            { backgroundColor },
            { width: '80%', marginTop: 8 },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  card: {
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  content: {
    paddingHorizontal: 12,
  },
  line: {
    height: 12,
    borderRadius: 6,
  },
});
