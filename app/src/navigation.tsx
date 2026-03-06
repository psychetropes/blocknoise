import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { theme } from './theme';
import { HomeScreen } from './screens/home';
import { GenerateScreen } from './screens/generate';
import { BlockMixerScreen } from './screens/block-mixer';
import { MintScreen } from './screens/mint';
import { LeaderboardScreen } from './screens/leaderboard';
import { RadioScreen } from './screens/radio';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontFamily: 'JetBrainsMono-Regular',
        fontSize: 10,
        color: focused ? theme.cyan : theme.muted,
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
          backgroundColor: theme.bg2,
          borderTopColor: theme.muted2,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.cyan,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: {
          fontFamily: 'JetBrainsMono-Regular',
          fontSize: 10,
        },
      }}
    >
      <Tab.Screen
        name="home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'home',
          tabBarIcon: ({ focused }) => <TabIcon label="~" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarLabel: 'board',
          tabBarIcon: ({ focused }) => <TabIcon label="#" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="radio"
        component={RadioScreen}
        options={{
          tabBarLabel: 'radio',
          tabBarIcon: ({ focused }) => <TabIcon label=">" focused={focused} />,
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
          contentStyle: { backgroundColor: theme.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="tabs" component={TabNavigator} />
        <Stack.Screen name="generate" component={GenerateScreen} />
        <Stack.Screen name="block-mixer" component={BlockMixerScreen} />
        <Stack.Screen name="mint" component={MintScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
