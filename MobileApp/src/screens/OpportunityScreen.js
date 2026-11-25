import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import UserHeader from '../components/UserHeader';

export default function OpportunityScreen({
  user,
  onNavigateToMessages,
  onNavigateToProfile,
  onLogout,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const opportunities = [
    {
      id: '1',
      title: 'Digital Marketing & Growth Lead',
      company: 'Fortaa Ecosystem',
      category: 'Marketing',
      desc: 'Lead the direct selling growth across northern states with high-impact marketing funnels.',
      tags: ['Full Time', 'High Commission', 'Verified'],
    },
    {
      id: '2',
      title: 'Senior Wellness & FMCG Distributor',
      company: 'Shivkripa Enterprises',
      category: 'Distribution',
      desc: 'Exclusive state dealership & distributor rights available for certified wellness product lines.',
      tags: ['State Rights', 'B2B', 'Immediate'],
    },
    {
      id: '3',
      title: 'Direct Selling Team Leader & Mentor',
      company: 'Apex Leaders Club',
      category: 'Leadership',
      desc: 'Build, mentor and earn with a pan-India team of 500+ direct sellers and network marketers.',
      tags: ['Mentorship', 'Royalty Income', 'Pan India'],
    },
  ];

  return (
    <View style={styles.container}>
      <UserHeader
        user={user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToNotifications={() => Alert.alert('Notifications', 'No new notifications right now.')}
        onNavigateToProfile={onNavigateToProfile}
        onLogout={onLogout}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageHeading}>Explore Opportunities</Text>
        <Text style={styles.pageSubheading}>
          Discover verified business partnerships and distributor openings.
        </Text>

        <View style={styles.list}>
          {opportunities.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
                <Text style={styles.companyName}>{item.company}</Text>
              </View>

              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>

              <View style={styles.tagsRow}>
                {item.tags.map((t) => (
                  <View key={t} style={styles.tagPill}>
                    <Text style={styles.tagText}>{t}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => Alert.alert('Opportunity Applied 🎉', `You have expressed interest in: ${item.title}`)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>Express Interest →</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 28,
  },
  pageHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  pageSubheading: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 14,
    marginTop: 2,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
  },
  companyName: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  cardDesc: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 17,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
  },
  tagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10.5,
    color: '#475569',
    fontWeight: '600',
  },
  applyBtn: {
    backgroundColor: '#5321E8',
    borderRadius: 8,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
