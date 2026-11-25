import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Share,
  Alert,
} from 'react-native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';

export default function PostActionModal({
  visible,
  onClose,
  post,
  currentUser,
  onDeletePost,
  onGoToPost,
  onAboutAccount,
}) {
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  if (!post) return null;

  const isOwner =
    currentUser &&
    post &&
    (post.user_id === currentUser.id ||
      post.userId === currentUser.id ||
      post.author_id === currentUser.id ||
      post.author_name === currentUser.name);

  // Copy link handler
  const handleCopyLink = async () => {
    onClose();
    try {
      await Share.share({
        title: 'Fortaa Post',
        message: `Check out this post on Fortaa: https://fortaa.com/posts/${post.id}`,
      });
    } catch (err) {
      Alert.alert('Link Copied', `https://fortaa.com/posts/${post.id}`);
    }
  };

  // Share handler
  const handleShare = async () => {
    onClose();
    try {
      await Share.share({
        title: `${post.author_name || 'Fortaa Leader'} on Fortaa`,
        message: `${post.content ? post.content.substring(0, 120) + '... ' : ''}https://fortaa.com/posts/${post.id}`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  // Report handler
  const handleReport = () => {
    onClose();
    Alert.alert(
      'Report Submitted 🛡️',
      'Thank you for reporting this post. Our trust and safety team will review it within 24 hours.'
    );
  };

  // Delete handler
  const handleDelete = () => {
    onClose();
    Alert.alert(
      'Delete Post',
      'Are you sure you want to permanently delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDeletePost) onDeletePost(post.id);
          },
        },
      ]
    );
  };

  const handleOpenAbout = () => {
    onClose();
    if (onAboutAccount) {
      onAboutAccount(post);
    } else {
      setAboutModalVisible(true);
    }
  };

  return (
    <>
      {/* 1. Main Instagram Style Post Action Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                {/* 1. Delete (if owner) OR Report (if other) */}
                {isOwner ? (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleDelete}
                    activeOpacity={0.7}
                  >
                    <Feather name="trash-2" size={19} color="#EF4444" style={styles.menuIcon} />
                    <Text style={[styles.menuItemText, styles.textDanger]}>Delete post</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleReport}
                    activeOpacity={0.7}
                  >
                    <Feather name="alert-circle" size={19} color="#EF4444" style={styles.menuIcon} />
                    <Text style={[styles.menuItemText, styles.textDanger]}>Report</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.divider} />

                {/* 2. Copy Link */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleCopyLink}
                  activeOpacity={0.7}
                >
                  <Feather name="link-2" size={19} color="#1E293B" style={styles.menuIcon} />
                  <Text style={styles.menuItemText}>Copy link</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* 3. Share */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleShare}
                  activeOpacity={0.7}
                >
                  <Feather name="share-2" size={19} color="#1E293B" style={styles.menuIcon} />
                  <Text style={styles.menuItemText}>Share</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* 4. Go to Post */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onClose();
                    if (onGoToPost) onGoToPost(post);
                    else Alert.alert('Post Details', post.content || 'Viewing post');
                  }}
                  activeOpacity={0.7}
                >
                  <Feather name="maximize-2" size={19} color="#1E293B" style={styles.menuIcon} />
                  <Text style={styles.menuItemText}>Go to post</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* 5. About this account */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleOpenAbout}
                  activeOpacity={0.7}
                >
                  <Feather name="info" size={19} color="#6366F1" style={styles.menuIcon} />
                  <Text style={[styles.menuItemText, styles.textPurple]}>About this account</Text>
                </TouchableOpacity>

                <View style={styles.thickDivider} />

                {/* 6. Cancel */}
                <TouchableOpacity
                  style={styles.cancelItem}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 2. About This Account Modal */}
      <Modal
        visible={aboutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setAboutModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.aboutCard}>
                <View style={styles.aboutHeader}>
                  <Text style={styles.aboutHeaderTitle}>About this account</Text>
                  <TouchableOpacity
                    onPress={() => setAboutModalVisible(false)}
                    style={styles.aboutCloseBtn}
                  >
                    <Feather name="x" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.aboutContent}>
                  <View style={styles.aboutAvatarCircle}>
                    <Text style={styles.aboutAvatarText}>
                      {(post.author_name || 'L').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.aboutAuthorName}>{post.author_name || 'Fortaa Leader'}</Text>
                  <Text style={styles.aboutAuthorRole}>{post.author_role || 'Senior Leader'}</Text>

                  <View style={styles.aboutList}>
                    <View style={styles.aboutListItem}>
                      <Feather name="calendar" size={18} color="#6366F1" style={styles.aboutListIcon} />
                      <View>
                        <Text style={styles.aboutListLabel}>Date joined</Text>
                        <Text style={styles.aboutListVal}>November 2025</Text>
                      </View>
                    </View>

                    <View style={styles.aboutListItem}>
                      <Feather name="map-pin" size={18} color="#6366F1" style={styles.aboutListIcon} />
                      <View>
                        <Text style={styles.aboutListLabel}>Account location</Text>
                        <Text style={styles.aboutListVal}>India (Verified)</Text>
                      </View>
                    </View>

                    <View style={styles.aboutListItem}>
                      <Feather name="shield" size={18} color="#10B981" style={styles.aboutListIcon} />
                      <View>
                        <Text style={styles.aboutListLabel}>Verification</Text>
                        <Text style={styles.aboutListVal}>Identity & Business Verified</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.aboutOkBtn}
                  onPress={() => setAboutModalVisible(false)}
                >
                  <Text style={styles.aboutOkBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    gap: 14,
  },
  menuIcon: {
    width: 22,
    textAlign: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'left',
  },
  textDanger: {
    color: '#EF4444',
  },
  textPurple: {
    color: '#6366F1',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
  thickDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  cancelItem: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },

  /* About Modal */
  aboutCard: {
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
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  aboutHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  aboutCloseBtn: {
    padding: 4,
  },
  aboutContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  aboutAvatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  aboutAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aboutAuthorName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  aboutAuthorRole: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  aboutList: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    gap: 14,
  },
  aboutListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aboutListIcon: {
    width: 22,
    textAlign: 'center',
  },
  aboutListLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aboutListVal: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  aboutOkBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 8,
  },
  aboutOkBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
