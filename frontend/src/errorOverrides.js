/**
 * errorOverrides.js - Suppress known React Native Web validation warnings
 * These errors are from internal RN Web components and don't affect functionality
 */

const originalError = console.error;

console.error = function(...args) {
  // Suppress the "Unexpected text node" warning - it's from RN Web's internal tab rendering
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    args[0].includes('Unexpected text node')
  ) {
    return; // Silently ignore this warning
  }

  // Call the original error method for other errors
  originalError.apply(console, args);
};
