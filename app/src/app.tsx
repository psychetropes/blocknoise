import React from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { AppNavigator } from './navigation';
import { colors } from './theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    'ABCSolar-Bold': require('../assets/fonts/ABCSolar-Bold.otf'),
    'ABCSolar-Regular': require('../assets/fonts/ABCSolar-Regular.otf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.white, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>loading...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
