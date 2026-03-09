import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors, typography } from './theme';
import { HomeScreen } from './screens/home';
import { PaymentScreen } from './screens/payment';
import { PaymentStatusScreen } from './screens/payment-status';
import { GenerateScreen } from './screens/generate';
import { BlockMixerScreen } from './screens/block-mixer';
import { MintScreen } from './screens/mint';
import { MintCompleteScreen } from './screens/mint-complete';
import { LeaderboardScreen } from './screens/leaderboard';
import { RadioScreen } from './screens/radio';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 18,
        color: focused ? colors.white : 'rgba(255,255,255,0.4)',
        marginBottom: 2,
      }}
    >
      {label}
    </Text>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.black,
          borderTopColor: colors.black,
          borderTopWidth: 3,
          height: 82,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarLabelStyle: {
          fontFamily: typography.mono,
          fontSize: 9,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 2,
        },
      }}
    >
      <Tab.Screen
        name="home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'HOME',
          tabBarIcon: ({ focused }) => <TabIcon label={'\u25A0'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarLabel: 'BOARD',
          tabBarIcon: ({ focused }) => <TabIcon label={'\u2630'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="radio"
        component={RadioScreen}
        options={{
          tabBarLabel: 'RADIO',
          tabBarIcon: ({ focused }) => <TabIcon label={'\u25B6'} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.blue },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="tabs" component={TabNavigator} />
        <Stack.Screen name="payment" component={PaymentScreen} />
        <Stack.Screen name="payment-status" component={PaymentStatusScreen} />
        <Stack.Screen name="generate" component={GenerateScreen} />
        <Stack.Screen name="block-mixer" component={BlockMixerScreen} />
        <Stack.Screen name="mint" component={MintScreen} />
        <Stack.Screen name="mint-complete" component={MintCompleteScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
