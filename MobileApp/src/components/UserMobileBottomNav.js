import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { height: windowHeight } = Dimensions.get('window');
const { height: screenHeight } = Dimensions.get('screen');
const navBarDiff = Math.max(0, screenHeight - windowHeight);
const safeBottomPadding = Platform.select({
  ios: 22,
  android: navBarDiff > 20 ? Math.min(navBarDiff + 2, 44) : 20,
  default: 8,
});

export default function UserMobileBottomNav({
  activeTab = 'home',
  onSelectTab,
  onPlusClick,
  unreadTotalCount = 0,
}) {
  return (
    <View style={styles.navContainer}>
      {/* 1. Home */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onSelectTab('home')}
        activeOpacity={0.7}
      >
        <Feather
          name="home"
          size={22}
          color={activeTab === 'home' ? '#5321E8' : '#334155'}
        />
        <Text
          style={[
            styles.navLabel,
            activeTab === 'home' && styles.navLabelActive,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* 2. Network */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onSelectTab('network')}
        activeOpacity={0.7}
      >
        <Feather
          name="users"
          size={22}
          color={activeTab === 'network' ? '#5321E8' : '#334155'}
        />
        <Text
          style={[
            styles.navLabel,
            activeTab === 'network' && styles.navLabelActive,
          ]}
        >
          Network
        </Text>
      </TouchableOpacity>

      {/* 3. Center Elevated Plus Button */}
      <View style={styles.fabWrapper}>
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={onPlusClick}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 4. Opportunity */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onSelectTab('opportunity')}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="target"
          size={24}
          color={activeTab === 'opportunity' ? '#5321E8' : '#334155'}
        />
        <Text
          style={[
            styles.navLabel,
            activeTab === 'opportunity' && styles.navLabelActive,
          ]}
        >
          Opportunity
        </Text>
      </TouchableOpacity>

      {/* 5. Menu */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onSelectTab('menu')}
        activeOpacity={0.7}
      >
        <View style={styles.menuIconBox}>
          <Feather
            name="menu"
            size={22}
            color={activeTab === 'menu' ? '#5321E8' : '#334155'}
          />
          {unreadTotalCount > 0 && <View style={styles.menuDot} />}
        </View>
        <Text
          style={[
            styles.navLabel,
            activeTab === 'menu' && styles.navLabelActive,
          ]}
        >
          Menu
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEAF5',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: safeBottomPadding,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 90,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  navLabelActive: {
    color: '#5321E8',
    fontWeight: '700',
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5321E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    shadowColor: '#5321E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  menuIconBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDot: {
    position: 'absolute',
    top: -1,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F60808',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
