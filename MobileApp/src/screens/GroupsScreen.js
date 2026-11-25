import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  FlatList,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UserHeader from '../components/UserHeader';

const { width } = Dimensions.get('window');

const PRESET_GROUPS = [
  {
    id: 'g1',
    name: 'Success Mindset & Motivation',
    category: 'Motivation',
    tagline: 'Daily morning routines & leadership mindset drills',
    membersCount: 3420,
    avatarText: 'SM',
    gradient: ['#F59E0B', '#EF4444'],
    isMember: true,
  },
  {
    id: 'g2',
    name: 'Fortaa Direct Selling Leaders',
    category: 'Direct Selling',
    tagline: 'Official strategy group for top direct sellers',
    membersCount: 1850,
    avatarText: 'FD',
    gradient: ['#4E1AD9', '#320CA0'],
    isMember: true,
  },
  {
    id: 'g3',
    name: 'Diamond & Silver Leaders Club',
    category: 'Leadership',
    tagline: 'High-level networking & executive mentorship',
    membersCount: 940,
    avatarText: 'DS',
    gradient: ['#DC3AEE', '#5321E8'],
    isMember: false,
  },
  {
    id: 'g4',
    name: 'Health & Wellness Products Hub',
    category: 'Health & Wellness',
    tagline: 'Product catalogs, testimonials and doctor sessions',
    membersCount: 2150,
    avatarText: 'HW',
    gradient: ['#10B981', '#059669'],
    isMember: false,
  },
  {
    id: 'g5',
    name: 'Business Growth & Marketing',
    category: 'Leadership',
    tagline: 'Digital marketing, leads funnels and social branding',
    membersCount: 1260,
    avatarText: 'BG',
    gradient: ['#2563EB', '#1D4ED8'],
    isMember: false,
  },
];

const CATEGORIES = ['All', 'My Groups', 'Leadership', 'Direct Selling', 'Motivation', 'Health & Wellness'];

export default function GroupsScreen({
  user,
  onOpenGroupChat,
  onNavigateToMessages,
  onNavigateToProfile,
  onNavigateToNotifications,
  onLogout,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [groups, setGroups] = useState(PRESET_GROUPS);

  // Create Group Modal State
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCat, setNewGroupCat] = useState('Leadership');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  // Members Modal State
  const [selectedGroupMembers, setSelectedGroupMembers] = useState(null);

  // Toggle Join/Leave
  const handleToggleJoin = (groupId) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const nextMemberState = !g.isMember;
          Alert.alert(
            nextMemberState ? 'Joined Group 🎉' : 'Left Group',
            nextMemberState
              ? `You are now a member of ${g.name}`
              : `You have left ${g.name}`
          );
          return {
            ...g,
            isMember: nextMemberState,
            membersCount: nextMemberState ? g.membersCount + 1 : Math.max(1, g.membersCount - 1),
          };
        }
        return g;
      })
    );
  };

  // Create Group Handler
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for your group');
      return;
    }

    const newGroup = {
      id: `g_${Date.now()}`,
      name: newGroupName.trim(),
      category: newGroupCat,
      tagline: newGroupDesc.trim() || 'New community group created by leader',
      membersCount: 1,
      avatarText: newGroupName.substring(0, 2).toUpperCase(),
      gradient: ['#6366F1', '#4F46E5'],
      isMember: true,
    };

    setGroups([newGroup, ...groups]);
    setNewGroupName('');
    setNewGroupDesc('');
    setCreateGroupModalOpen(false);
    Alert.alert('Group Created 🎉', `Your group "${newGroup.name}" is now live!`);
  };

  // Filtered Groups
  const filteredGroups = groups.filter((g) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = g.name.toLowerCase().includes(q);
      const matchTag = g.tagline.toLowerCase().includes(q);
      const matchCat = g.category.toLowerCase().includes(q);
      if (!matchName && !matchTag && !matchCat) return false;
    }
    // Category
    if (selectedCategory === 'My Groups') return g.isMember;
    if (selectedCategory !== 'All') return g.category === selectedCategory;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* 1. Universal Top Header */}
      <UserHeader
        user={user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToNotifications={onNavigateToNotifications || (() => {})}
        onNavigateToProfile={onNavigateToProfile}
        onLogout={onLogout}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Page Title & Create Group Button */}
        <View style={styles.topActionRow}>
          <View>
            <Text style={styles.pageTitle}>Community Groups</Text>
            <Text style={styles.pageSubtitle}>Connect with peers, teams and direct sellers</Text>
          </View>
          <TouchableOpacity
            style={styles.createGroupBtn}
            onPress={() => setCreateGroupModalOpen(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#DC3AEE', '#5321E8']}
              style={styles.createGroupGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.createGroupBtnText}>Create Group</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 3. Category Horizontal Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPills}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catPill, isActive && styles.catPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 4. Groups List */}
        <View style={styles.groupsList}>
          {filteredGroups.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <View style={styles.groupHeaderRow}>
                <LinearGradient
                  colors={group.gradient}
                  style={styles.groupAvatarCircle}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.groupAvatarText}>{group.avatarText}</Text>
                </LinearGradient>

                <View style={styles.groupMeta}>
                  <Text style={styles.groupName} numberOfLines={1}>
                    {group.name}
                  </Text>
                  <View style={styles.groupBadgesRow}>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>{group.category}</Text>
                    </View>
                    <Text style={styles.membersCountText}>
                      👥 {group.membersCount.toLocaleString()} members
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.groupTagline} numberOfLines={2}>
                {group.tagline}
              </Text>

              {/* Group Action Buttons */}
              <View style={styles.groupActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.joinBtn,
                    group.isMember ? styles.joinedBtn : styles.notJoinedBtn,
                  ]}
                  onPress={() => handleToggleJoin(group.id)}
                  activeOpacity={0.75}
                >
                  <Feather
                    name={group.isMember ? 'check' : 'user-plus'}
                    size={14}
                    color={group.isMember ? '#10B981' : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.joinBtnText,
                      group.isMember ? styles.joinedBtnText : styles.notJoinedBtnText,
                    ]}
                  >
                    {group.isMember ? 'Joined' : 'Join Group'}
                  </Text>
                </TouchableOpacity>

                {group.isMember ? (
                  <TouchableOpacity
                    style={styles.chatGroupBtn}
                    onPress={() => {
                      if (onOpenGroupChat) {
                        onOpenGroupChat({
                          id: group.id,
                          name: group.name,
                          role: `${group.category} · ${group.membersCount} members`,
                          avatarType: 'group',
                          isGroup: true,
                          membersCount: group.membersCount,
                        });
                      } else {
                        Alert.alert('Group Chat', `Opening chat for ${group.name}`);
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <Feather name="message-circle" size={14} color="#4F46E5" />
                    <Text style={styles.chatGroupBtnText}>Open Chat</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.membersBtn}
                    onPress={() => setSelectedGroupMembers(group)}
                    activeOpacity={0.75}
                  >
                    <Feather name="info" size={14} color="#64748B" />
                    <Text style={styles.membersBtnText}>View Details</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 5. Create Group Modal */}
      <Modal
        visible={createGroupModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateGroupModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCreateGroupModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.createModalCard}>
                <View style={styles.createModalHeader}>
                  <Text style={styles.createModalTitle}>Create Community Group</Text>
                  <TouchableOpacity
                    onPress={() => setCreateGroupModalOpen(false)}
                    style={{ padding: 4 }}
                  >
                    <Feather name="x" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.createForm}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Group Name *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. Bhopal Leaders Team"
                      placeholderTextColor="#94A3B8"
                      value={newGroupName}
                      onChangeText={setNewGroupName}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Category</Text>
                    <View style={styles.categoryPickerRow}>
                      {['Leadership', 'Direct Selling', 'Motivation', 'Health & Wellness'].map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.catPickerChip,
                            newGroupCat === c && styles.catPickerChipActive,
                          ]}
                          onPress={() => setNewGroupCat(c)}
                        >
                          <Text
                            style={[
                              styles.catPickerText,
                              newGroupCat === c && styles.catPickerTextActive,
                            ]}
                          >
                            {c}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Description</Text>
                    <TextInput
                      style={[styles.formInput, { minHeight: 65, textAlignVertical: 'top' }]}
                      placeholder="What is this group about?"
                      placeholderTextColor="#94A3B8"
                      value={newGroupDesc}
                      onChangeText={setNewGroupDesc}
                      multiline
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.submitCreateBtn}
                    onPress={handleCreateGroup}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#DC3AEE', '#5321E8']}
                      style={styles.submitCreateGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.submitCreateText}>Create Group Now</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 6. Group Details Modal */}
      <Modal
        visible={!!selectedGroupMembers}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedGroupMembers(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedGroupMembers(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.detailsModalCard}>
                {selectedGroupMembers && (
                  <>
                    <View style={styles.createModalHeader}>
                      <Text style={styles.createModalTitle}>{selectedGroupMembers.name}</Text>
                      <TouchableOpacity
                        onPress={() => setSelectedGroupMembers(null)}
                        style={{ padding: 4 }}
                      >
                        <Feather name="x" size={20} color="#64748B" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.detailsBody}>
                      <Text style={styles.detailsTagline}>{selectedGroupMembers.tagline}</Text>
                      <View style={styles.detailsStatRow}>
                        <View style={styles.detailsStatBox}>
                          <Text style={styles.detailsStatNum}>
                            {selectedGroupMembers.membersCount.toLocaleString()}
                          </Text>
                          <Text style={styles.detailsStatLabel}>Members</Text>
                        </View>
                        <View style={styles.detailsStatBox}>
                          <Text style={styles.detailsStatNum}>{selectedGroupMembers.category}</Text>
                          <Text style={styles.detailsStatLabel}>Category</Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.joinFromDetailsBtn}
                        onPress={() => {
                          handleToggleJoin(selectedGroupMembers.id);
                          setSelectedGroupMembers(null);
                        }}
                      >
                        <Text style={styles.joinFromDetailsText}>
                          {selectedGroupMembers.isMember ? 'Leave Group' : 'Join Group Now'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },

  /* Top Title & Action */
  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  createGroupBtn: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  createGroupGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  createGroupBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Category Filter Pills */
  categoryPills: {
    gap: 8,
    paddingVertical: 4,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  catPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },

  /* Groups List & Cards */
  groupsList: {
    gap: 12,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  groupMeta: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  groupBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  catBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  membersCountText: {
    fontSize: 11,
    color: '#64748B',
  },
  groupTagline: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  groupActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  joinBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  notJoinedBtn: {
    backgroundColor: '#4F46E5',
  },
  joinedBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  joinBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  notJoinedBtnText: {
    color: '#FFFFFF',
  },
  joinedBtnText: {
    color: '#059669',
  },
  chatGroupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  chatGroupBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  membersBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  membersBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  createModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    gap: 16,
  },
  createModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  createModalTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  createForm: {
    gap: 12,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#0F172A',
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catPickerChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  catPickerChipActive: {
    backgroundColor: '#4F46E5',
  },
  catPickerText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  catPickerTextActive: {
    color: '#FFFFFF',
  },
  submitCreateBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 6,
  },
  submitCreateGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitCreateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Details Modal */
  detailsModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  detailsBody: {
    gap: 14,
  },
  detailsTagline: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 19,
  },
  detailsStatRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailsStatBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  detailsStatNum: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailsStatLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  joinFromDetailsBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  joinFromDetailsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
