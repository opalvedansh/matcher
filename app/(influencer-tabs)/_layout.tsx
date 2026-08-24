import { Tabs } from 'expo-router';
import { NavHomeIcon, NavMatchIcon, NavHeartIcon, NavMessageIcon, NavProfileIcon } from '@/components/BottomNavIcons';

export default function InfluencerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 55, // Reduced height
          paddingBottom: 5,
          paddingTop: 5,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          position: 'absolute', // To show rounded corners over content
          elevation: 10, // For Android shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarItemStyle: {
          height: 55,
          paddingTop: 8,
          // @ts-ignore
          outlineStyle: 'none' as any,
          // @ts-ignore
          outlineWidth: 0,
          borderWidth: 0,
        },
        tabBarActiveTintColor: '#FF6B2B',
        tabBarInactiveTintColor: '#666',
        tabBarShowLabel: false,
      }}
      initialRouteName="match"
    >
      <Tabs.Screen
        name="match"
        options={{
          title: 'Match',
          tabBarIcon: ({ color, size }) => <NavMatchIcon size={24} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <NavHomeIcon size={24} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          title: 'Likes',
          tabBarIcon: ({ color, size }) => <NavHeartIcon size={26} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <NavMessageIcon size={24} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <NavProfileIcon size={24} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
