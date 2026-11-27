import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
  Animated,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  fetchStoriesApi,
  createStoryApi,
  recordStoryViewApi,
  toggleStoryLikeApi,
  uploadMediaApi,
  deleteStoryApi,
  fetchStoryViewersApi,
  replyStoryApi,
  getConversationsApi,
  sendMessageApi,
} from '../services/api';

const { width, height } = Dimensions.get('window');
const STORY_SIZE = 68;

const GRADIENT_PRESETS = [
  ['#DC3AEE', '#5321E8'],
  ['#FF512F', '#DD2476'],
  ['#8E2DE2', '#4A00E0'],
  ['#11998E', '#38EF7D'],
  ['#F7971E', '#FFD200'],
  ['#00C9FF', '#92FE9D'],
];

function NativeStoryVideo({ uri }) {
  let player = null;
  try {
    player = useVideoPlayer(uri, (p) => {
      if (p) {
        p.loop = true;
        try {
          p.play();
        } catch (e) {}
      }
    });
  } catch (err) {}

  if (!player) return null;
  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export default function StoriesBar({ user, onStoryModalOpenChange }) {
  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  // Active Story Viewer State
  const [activeGroupIndex, setActiveGroupIndex] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  // Share Sheet States (Web Parity)
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareContacts, setShareContacts] = useState([]);
  const [loadingShareContacts, setLoadingShareContacts] = useState(false);
  const [sharedStatus, setSharedStatus] = useState({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Owner Story Options & Viewers Sheet States (Screenshot 1 parity)
  const [showDeletePopover, setShowDeletePopover] = useState(false);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [viewersLikesCount, setViewersLikesCount] = useState(0);

  // Add Story Modal State
  const [addStoryModalVisible, setAddStoryModalVisible] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [pickedMedia, setPickedMedia] = useState(null);
  const [pickedMediaType, setPickedMediaType] = useState('photo'); // 'photo' | 'video'
  const [selectedGradientIndex, setSelectedGradientIndex] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const isPausedRef = useRef(false);
  const currentProgressRef = useRef(0);

  // Load real stories from backend
  const loadStories = async () => {
    try {
      setLoading(true);
      const groups = await fetchStoriesApi(user?.id || 0);
      setStoryGroups(groups);
    } catch (err) {
      console.warn('Load stories error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, [user]);

  // Sync story viewer state to pause any background feed videos
  useEffect(() => {
    const isModalOpen = activeGroupIndex !== null;
    if (onStoryModalOpenChange) {
      onStoryModalOpenChange(isModalOpen);
    }
    if (isModalOpen && Platform.OS === 'web' && typeof document !== 'undefined') {
      try {
        document.querySelectorAll('video').forEach((v) => {
          if (!v.closest('[data-story-viewer="true"]')) {
            v.pause();
          }
        });
      } catch (e) {}
    }
  }, [activeGroupIndex, onStoryModalOpenChange]);

  // Handle Opening a Story Group
  const handleOpenGroup = (index) => {
    setActiveGroupIndex(index);
    setActiveStoryIndex(0);
    startStoryProgress(index, 0);
  };

  const startStoryProgress = (grpIdx, stIdx, startFrom = 0) => {
    progressAnim.setValue(startFrom);
    currentProgressRef.current = startFrom;
    isPausedRef.current = false;
    const grp = storyGroups[grpIdx];
    const currentStory = grp?.stories[stIdx];

    if (currentStory && user?.id && startFrom === 0) {
      recordStoryViewApi(currentStory.id, user.id);
      setIsLiked(!!currentStory.is_liked);
    }

    const duration = Math.max(600, (1 - startFrom) * 5000);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isPausedRef.current) {
        handleNextStory(grpIdx, stIdx);
      }
    });
  };

  const handleReplyFocus = () => {
    isPausedRef.current = true;
    progressAnim.stopAnimation((value) => {
      currentProgressRef.current = typeof value === 'number' ? value : 0;
    });
  };

  const handleReplyBlur = () => {
    if (replyText.trim().length === 0 && activeGroupIndex !== null) {
      isPausedRef.current = false;
      const resumeFrom = currentProgressRef.current || 0;
      startStoryProgress(activeGroupIndex, activeStoryIndex, resumeFrom);
    }
  };

  const handleNextStory = (grpIdx = activeGroupIndex, stIdx = activeStoryIndex) => {
    progressAnim.stopAnimation();
    const grp = storyGroups[grpIdx];
    if (stIdx + 1 < (grp?.stories?.length || 0)) {
      setActiveStoryIndex(stIdx + 1);
      startStoryProgress(grpIdx, stIdx + 1);
    } else if (grpIdx + 1 < storyGroups.length) {
      setActiveGroupIndex(grpIdx + 1);
      setActiveStoryIndex(0);
      startStoryProgress(grpIdx + 1, 0);
    } else {
      handleCloseViewer();
    }
  };

  const handlePrevStory = () => {
    progressAnim.stopAnimation();
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
      startStoryProgress(activeGroupIndex, activeStoryIndex - 1);
    } else if (activeGroupIndex > 0) {
      const prevGrp = storyGroups[activeGroupIndex - 1];
      const lastIdx = (prevGrp?.stories?.length || 1) - 1;
      setActiveGroupIndex(activeGroupIndex - 1);
      setActiveStoryIndex(lastIdx);
      startStoryProgress(activeGroupIndex - 1, lastIdx);
    } else {
      startStoryProgress(activeGroupIndex, 0);
    }
  };

  const handleCloseViewer = () => {
    progressAnim.stopAnimation();
    setActiveGroupIndex(null);
    setActiveStoryIndex(0);
    setShowDeletePopover(false);
    setShowViewersSheet(false);
    if (onStoryModalOpenChange) {
      onStoryModalOpenChange(false);
    }
  };

  // Direct gallery picker on + tap (Instagram-style: instant publish)
  const handleDirectGalleryStory = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow gallery access to upload stories.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo =
          asset.type === 'video' ||
          (asset.uri && (asset.uri.endsWith('.mp4') || asset.uri.endsWith('.webm') || asset.uri.endsWith('.mov')));

        setIsPublishing(true);
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert('Uploading Story ⏳\nYour story is publishing...');
        } else {
          Alert.alert('Uploading Story ⏳', 'Your story is publishing...');
        }

        const uploadedUrl = await uploadMediaApi(asset.uri, isVideo);

        await createStoryApi({
          userId: user?.id || null,
          mediaType: isVideo ? 'video' : 'photo',
          mediaUrl: uploadedUrl,
          textContent: null,
          backgroundStyle: null,
        });

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert('Story Live! ✨\nYour story is live for 24 hours.');
        } else {
          Alert.alert('Story Live! ✨', 'Your story is live for 24 hours.');
        }

        await loadStories();
      }
    } catch (err) {
      console.warn('Gallery picker error:', err);
      Alert.alert('Upload Failed', 'Unable to upload story. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Open Story Viewers Bottom Sheet (Screenshot 1)
  const handleOpenStoryViews = async () => {
    progressAnim.stopAnimation();
    setShowViewersSheet(true);
    setViewersLoading(true);
    const grp = storyGroups[activeGroupIndex];
    const curStory = grp?.stories[activeStoryIndex];
    if (!curStory?.id) {
      setViewersLoading(false);
      return;
    }
    try {
      const viewers = await fetchStoryViewersApi(curStory.id);
      setViewersList(Array.isArray(viewers) ? viewers : []);
      setViewersLikesCount(viewers.likesCount || (Array.isArray(viewers) ? viewers.filter((v) => v.has_liked).length : 0));
    } catch (err) {
      console.warn('Load story viewers error:', err);
      setViewersList([]);
    } finally {
      setViewersLoading(false);
    }
  };

  // Delete Story Handler (Screenshot 1)
  const handleDeleteCurrentStory = () => {
    setShowDeletePopover(false);
    const grp = storyGroups[activeGroupIndex];
    const curStory = grp?.stories[activeStoryIndex];
    if (!curStory?.id || !user?.id) return;

    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStoryApi(curStory.id, user.id);
              handleCloseViewer();
              loadStories();
              Alert.alert('Story Deleted', 'Your story has been deleted successfully.');
            } catch (err) {
              console.warn('Delete story error:', err);
            }
          },
        },
      ]
    );
  };

  const handleToggleLike = async () => {
    const grp = storyGroups[activeGroupIndex];
    const currentStory = grp?.stories[activeStoryIndex];
    if (!currentStory) return;

    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to like this story.');
      return;
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);

    if (nextLiked) {
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    }

    try {
      await toggleStoryLikeApi(currentStory.id, user.id);
    } catch (err) {
      console.warn('Like story error:', err);
    }
  };

  const handleOpenShareSheet = async () => {
    progressAnim.stopAnimation();
    setShowShareSheet(true);
    setLoadingShareContacts(true);
    setCopiedLink(false);

    try {
      if (user?.id) {
        const convs = await getConversationsApi(user.id);
        setShareContacts(Array.isArray(convs) ? convs.slice(0, 10) : []);
      }
    } catch (err) {
      console.warn('Failed to load share contacts:', err);
    } finally {
      setLoadingShareContacts(false);
    }
  };

  const handleCloseShareSheet = () => {
    setShowShareSheet(false);
    startStoryProgress(activeGroupIndex, activeStoryIndex);
  };

  const handleNativeAppShare = async () => {
    const grp = storyGroups[activeGroupIndex];
    const authorName = grp?.userName || 'Leader';

    try {
      await Share.share({
        title: `${authorName}'s Story on Fortaa`,
        message: `Check out ${authorName}'s story on Fortaa!\nhttps://fortaa.com/dashboard`,
      });
    } catch (err) {
      console.warn('Native share error:', err);
    }
  };

  const handleCopyStoryLink = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('https://fortaa.com/dashboard');
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareToContact = async (contact) => {
    const contactId = contact.user_id || contact.id;
    if (!contactId || sharedStatus[contactId] || !user?.id) return;

    const grp = storyGroups[activeGroupIndex];
    const currentStory = grp?.stories[activeStoryIndex];

    try {
      const msgText = `Shared ${grp?.userName || 'Leader'}'s story with you! 🌟`;
      const attachment = {
        type: 'story_share',
        storyId: currentStory.id,
        mediaType: currentStory.media_type,
        mediaUrl: currentStory.media_url,
        authorName: grp?.userName,
        authorAvatar: grp?.userAvatar,
      };

      await sendMessageApi({
        senderId: user.id,
        receiverId: contactId,
        text: msgText,
        attachment,
      });

      setSharedStatus((prev) => ({ ...prev, [contactId]: true }));
    } catch (err) {
      console.warn('Failed to share to contact:', err);
    }
  };

  const handleSendReply = async () => {
    const textToSend = replyText.trim();
    const grp = storyGroups[activeGroupIndex];
    const currentStory = grp?.stories[activeStoryIndex];
    const targetUserId = currentStory?.user_id || grp?.userId;

    if (!textToSend || !user?.id || !targetUserId || isSendingReply) return;

    setIsSendingReply(true);
    try {
      await replyStoryApi(currentStory.id, {
        senderId: user.id,
        receiverId: targetUserId,
        text: textToSend,
      });
      setReplyText('');
      Keyboard.dismiss();
      isPausedRef.current = false;
      Alert.alert('Reply Sent 💬', `Sent to ${grp?.userName || 'Leader'}!`);
      handleNextStory(activeGroupIndex, activeStoryIndex);
    } catch (err) {
      console.warn('Send story reply error:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Add Story - Pick photo or video from phone
  const handlePickMediaForStory = async (type) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow gallery access to upload stories.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'video' ? ['videos'] : ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPickedMedia(result.assets[0].uri);
        setPickedMediaType(type);
      }
    } catch (err) {
      console.warn('Picker error:', err);
    }
  };

  // Publish Story to Backend
  const handlePublishStory = async () => {
    if (!storyText.trim() && !pickedMedia) {
      Alert.alert('Empty Story', 'Please type something or pick a photo/video.');
      return;
    }

    try {
      setIsPublishing(true);

      let mediaUrl = null;
      if (pickedMedia) {
        mediaUrl = await uploadMediaApi(pickedMedia, pickedMediaType === 'video');
      }

      const grad = GRADIENT_PRESETS[selectedGradientIndex];
      const backgroundStyle = `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`;

      await createStoryApi({
        userId: user?.id || null,
        mediaType: pickedMedia ? pickedMediaType : 'text',
        mediaUrl: mediaUrl || pickedMedia || null,
        textContent: storyText.trim() || null,
        backgroundStyle,
      });

      Alert.alert('Story Published! ✨', 'Your story is live for 24 hours.');
      setAddStoryModalVisible(false);
      setStoryText('');
      setPickedMedia(null);
      loadStories();
    } catch (err) {
      console.warn('Publish story error:', err);
      Alert.alert('Failed to publish story', err.message || 'Server error');
    } finally {
      setIsPublishing(false);
    }
  };

  const userInitial = (user?.name || 'Y')[0].toUpperCase();
  const myAvatar = user?.avatarUrl || user?.avatar_url;
  const myGroupIndex = storyGroups.findIndex((g) => Number(g.userId) === Number(user?.id));

  // Active Story Group and current story item
  const currentGroup = activeGroupIndex !== null ? storyGroups[activeGroupIndex] : null;
  const currentStory = currentGroup?.stories[activeStoryIndex];

  return (
    <>
      <FlatList
        horizontal
        data={[{ isAdd: true, id: 'add_btn' }, ...storyGroups]}
        keyExtractor={(item, index) => item.id || String(index)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContainer}
        style={styles.storiesList}
        renderItem={({ item, index }) => {
          if (item.isAdd) {
            return (
              <TouchableOpacity
                style={styles.storyCard}
                onPress={() => {
                  if (myGroupIndex !== -1) {
                    handleOpenGroup(myGroupIndex);
                  } else {
                    handleDirectGalleryStory();
                  }
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#181A4E', '#101239']}
                  style={styles.storyCardGrad}
                >
                  <View style={styles.storyAvatarWrap}>
                    {myAvatar ? (
                      <Image source={{ uri: myAvatar }} style={styles.storyCardAvatarImg} />
                    ) : (
                      <LinearGradient colors={['#DC3AEE', '#5321E8']} style={styles.storyCardAvatarFallback}>
                        <Text style={styles.storyCardInitial}>{userInitial}</Text>
                      </LinearGradient>
                    )}
                    <TouchableOpacity
                      style={styles.storyAddBadge}
                      onPress={handleDirectGalleryStory}
                      activeOpacity={0.8}
                    >
                      <Feather name="plus" size={11} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.storyCardLabel} numberOfLines={1}>Your Story</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          const realIndex = index - 1;
          if (user?.id && Number(item.userId) === Number(user.id)) return null;

          const hasUnviewed = item.hasUnviewed;

          return (
            <TouchableOpacity
              style={styles.storyCard}
              onPress={() => handleOpenGroup(realIndex)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#181A4E', '#101239']}
                style={styles.storyCardGrad}
              >
                <View style={styles.storyAvatarWrap}>
                  <LinearGradient
                    colors={hasUnviewed ? ['#F59E0B', '#EC4899', '#8B5CF6'] : ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.25)']}
                    style={styles.storyRainbowRing}
                  >
                    {item.userAvatar ? (
                      <Image source={{ uri: item.userAvatar }} style={styles.storyCardAvatarImgRinged} />
                    ) : (
                      <View style={styles.storyCardAvatarFallbackRinged}>
                        <Text style={styles.storyCardInitialRinged}>
                          {(item.userName || 'U')[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </View>
                <Text style={styles.storyCardLabel} numberOfLines={1}>
                  {item.userName ? item.userName.split(' ')[0] : 'Leader'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        }}
      />

      {/* ─── INSTAGRAM-LIKE STORY VIEWER MODAL ─── */}
      <Modal
        visible={activeGroupIndex !== null}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCloseViewer}
      >
        {currentGroup && currentStory && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.viewerContainer}
          >
            {/* Story Background / Media */}
            {currentStory.media_url ? (
              currentStory.media_type === 'video' ||
              currentStory.media_url.endsWith('.mp4') ||
              currentStory.media_url.endsWith('.webm') ||
              currentStory.media_url.endsWith('.mov') ||
              currentStory.media_url.includes('/video/') ? (
                Platform.OS === 'web' ? (
                  <video
                    src={currentStory.media_url}
                    autoPlay
                    playsInline
                    loop
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />
                ) : (
                  <NativeStoryVideo uri={currentStory.media_url} />
                )
              ) : (
                <Image
                  source={{ uri: currentStory.media_url }}
                  style={styles.viewerMediaBg}
                  resizeMode="cover"
                />
              )
            ) : (
              <LinearGradient
                colors={GRADIENT_PRESETS[activeGroupIndex % GRADIENT_PRESETS.length]}
                style={styles.viewerMediaBg}
              >
                {currentStory.text_content && (
                  <View style={styles.viewerTextCenter}>
                    <Text style={styles.viewerBigText}>{currentStory.text_content}</Text>
                  </View>
                )}
              </LinearGradient>
            )}

            {/* Dark gradient overlay on top for contrast */}
            <LinearGradient
              colors={['rgba(0,0,0,0.65)', 'transparent']}
              style={styles.topVignette}
            />

            {/* Tap areas for Prev / Next */}
            <TouchableOpacity
              style={styles.tapAreaLeft}
              onPress={handlePrevStory}
              activeOpacity={1}
            />
            <TouchableOpacity
              style={styles.tapAreaRight}
              onPress={() => handleNextStory()}
              activeOpacity={1}
            />

            {/* Top Progress Bars (1 per story in group) */}
            <View style={styles.progressRow}>
              {currentGroup.stories.map((st, i) => {
                let fillStyle = {};
                if (i < activeStoryIndex) fillStyle = { width: '100%' };
                else if (i === activeStoryIndex) {
                  fillStyle = {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  };
                } else fillStyle = { width: '0%' };

                return (
                  <View key={st.id || i} style={styles.progressBarBg}>
                    <Animated.View style={[styles.progressBarFill, fillStyle]} />
                  </View>
                );
              })}
            </View>

            {/* Author Header */}
            <View style={styles.viewerHeader}>
              <View style={styles.authorRow}>
                <View style={styles.authorAvatar}>
                  {currentGroup.userAvatar ? (
                    <Image source={{ uri: currentGroup.userAvatar }} style={styles.authorAvatarImg} />
                  ) : (
                    <Text style={styles.authorInitial}>
                      {(currentGroup.userName || 'U')[0].toUpperCase()}
                    </Text>
                  )}
                </View>
                <View>
                  <Text style={styles.authorName}>{currentGroup.userName}</Text>
                  <Text style={styles.authorTime}>
                    {currentStory.created_at ? new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </Text>
                </View>
              </View>

              <View style={styles.viewerHeaderRight}>
                {!(user?.id && Number(currentGroup.userId) === Number(user.id)) && (
                  <TouchableOpacity
                    onPress={handleOpenShareSheet}
                    style={styles.viewerHeaderIconBtn}
                    activeOpacity={0.8}
                  >
                    <Feather name="share-2" size={20} color="#fff" />
                  </TouchableOpacity>
                )}

                {user?.id && Number(currentGroup.userId) === Number(user.id) && (
                  <TouchableOpacity
                    onPress={() => setShowDeletePopover((prev) => !prev)}
                    style={styles.viewerHeaderIconBtn}
                    activeOpacity={0.8}
                  >
                    <Feather name="more-horizontal" size={22} color="#fff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleCloseViewer} style={styles.viewerHeaderIconBtn}>
                  <Feather name="x" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Heart Burst Center Overlay on Like (Web Parity) */}
            {showHeartBurst && (
              <View style={styles.heartBurstOverlay} pointerEvents="none">
                <Ionicons name="heart" size={96} color="#FF0055" />
              </View>
            )}

            {/* White Delete Story Popover Pill (Screenshot 1) */}
            {showDeletePopover && user?.id && Number(currentGroup.userId) === Number(user.id) && (
              <TouchableOpacity
                style={styles.deleteStoryPopover}
                onPress={handleDeleteCurrentStory}
                activeOpacity={0.9}
              >
                <Feather name="trash-2" size={14} color="#EF4444" />
                <Text style={styles.deleteStoryPopoverText}>Delete Story</Text>
              </TouchableOpacity>
            )}

            {/* If story has overlay text on top of media */}
            {currentStory.media_url && currentStory.text_content && (
              <View style={styles.captionBox}>
                <Text style={styles.captionText}>{currentStory.text_content}</Text>
              </View>
            )}

            {/* Bottom Bar: Owner views badge (Image 2 Parity) vs Viewer reply & like */}
            {user?.id && Number(currentGroup.userId) === Number(user.id) ? (
              <View style={styles.ownerBottomBar}>
                <TouchableOpacity
                  style={styles.viewsBadgePill}
                  onPress={handleOpenStoryViews}
                  activeOpacity={0.85}
                >
                  <Feather name="eye" size={13} color="#FFFFFF" />
                  <Text style={styles.viewsBadgeText}>
                    {currentStory.views_count || currentStory.viewers_count || 0} views
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.bottomBar}>
                <View style={styles.replyInputWrap}>
                  <TextInput
                    style={styles.replyInput}
                    placeholder={`Reply to ${currentGroup.userName.split(' ')[0]}...`}
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    value={replyText}
                    onChangeText={setReplyText}
                    onFocus={handleReplyFocus}
                    onBlur={handleReplyBlur}
                    onSubmitEditing={handleSendReply}
                  />
                  {replyText.trim().length > 0 && (
                    <TouchableOpacity onPress={handleSendReply} disabled={isSendingReply}>
                      {isSendingReply ? (
                        <ActivityIndicator size="small" color="#5321E8" />
                      ) : (
                        <Feather name="send" size={18} color="#5321E8" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={handleToggleLike}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={26}
                    color={isLiked ? '#FF0055' : '#FFFFFF'}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={handleOpenShareSheet}
                  activeOpacity={0.8}
                >
                  <Feather name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        )}
      </Modal>

      {/* ─── STORY VIEWS BOTTOM SHEET MODAL (Screenshot 1) ─── */}
      <Modal
        visible={showViewersSheet}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowViewersSheet(false);
          startStoryProgress(activeGroupIndex, activeStoryIndex);
        }}
      >
        <TouchableOpacity
          style={styles.viewersBackdrop}
          activeOpacity={1}
          onPress={() => {
            setShowViewersSheet(false);
            startStoryProgress(activeGroupIndex, activeStoryIndex);
          }}
        />
        <View style={styles.viewersSheetContainer}>
          <View style={styles.viewersDragHandle} />

          <View style={styles.viewersHeader}>
            <View style={styles.viewersHeaderLeft}>
              <Feather name="eye" size={16} color="#5321E8" />
              <Text style={styles.viewersTitle}>Story Views</Text>
              <View style={styles.viewersCountPill}>
                <Text style={styles.viewersCountText}>{viewersList.length}</Text>
              </View>
              {viewersLikesCount > 0 && (
                <View style={[styles.viewersCountPill, { backgroundColor: '#FEE2E2', marginLeft: 4 }]}>
                  <Ionicons name="heart" size={11} color="#EF4444" />
                  <Text style={[styles.viewersCountText, { color: '#EF4444', marginLeft: 3 }]}>{viewersLikesCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowViewersSheet(false);
                startStoryProgress(activeGroupIndex, activeStoryIndex);
              }}
              style={{ padding: 4 }}
            >
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {viewersLoading ? (
            <View style={styles.viewersLoadingBox}>
              <ActivityIndicator size="small" color="#5321E8" />
              <Text style={styles.viewersLoadingText}>Loading viewers...</Text>
            </View>
          ) : viewersList.length === 0 ? (
            <View style={styles.noViewersBox}>
              <Feather name="users" size={32} color="#CBD5E1" />
              <Text style={styles.noViewersTitle}>No views yet</Text>
              <Text style={styles.noViewersSub}>
                When leaders view your story, they will appear here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={viewersList}
              keyExtractor={(item, index) => item.id || item.viewer_id || String(index)}
              style={styles.viewersList}
              renderItem={({ item }) => (
                <View style={styles.viewerItemRow}>
                  <View style={styles.viewerItemLeft}>
                    {item.viewer_avatar || item.avatar_url ? (
                      <Image
                        source={{ uri: item.viewer_avatar || item.avatar_url }}
                        style={styles.viewerItemAvatar}
                      />
                    ) : (
                      <LinearGradient
                        colors={['#DC3AEE', '#5321E8']}
                        style={styles.viewerItemFallbackAvatar}
                      >
                        <Text style={styles.viewerItemInitial}>
                          {(item.viewer_name || item.name || 'U')[0].toUpperCase()}
                        </Text>
                      </LinearGradient>
                    )}
                    <View style={styles.viewerItemMeta}>
                      <Text style={styles.viewerItemName}>{item.viewer_name || item.name || 'Fortaa Leader'}</Text>
                      <Text style={styles.viewerItemRole}>
                        {item.viewer_role || item.role || item.designation || 'Leader'}
                      </Text>
                    </View>
                  </View>

                  {/* Red Heart if viewer liked this story */}
                  {item.has_liked && (
                    <Ionicons name="heart" size={18} color="#FF2D55" />
                  )}
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      {/* ─── STORY SHARE BOTTOM SHEET MODAL (Web Parity) ─── */}
      <Modal
        visible={showShareSheet}
        animationType="slide"
        transparent
        onRequestClose={handleCloseShareSheet}
      >
        <TouchableOpacity
          style={styles.viewersBackdrop}
          activeOpacity={1}
          onPress={handleCloseShareSheet}
        />
        <View style={styles.shareSheetContainer}>
          <View style={styles.viewersDragHandle} />

          <View style={styles.shareHeader}>
            <View style={styles.shareHeaderTitleRow}>
              <Feather name="send" size={18} color="#5321E8" />
              <Text style={styles.shareHeaderTitle}>Share Story</Text>
            </View>
            <TouchableOpacity onPress={handleCloseShareSheet} style={styles.shareCloseBtn}>
              <Feather name="x" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Quick Action Buttons: Share via Apps & Copy Link */}
          <View style={styles.shareQuickRow}>
            <TouchableOpacity
              style={styles.shareQuickBtn}
              onPress={handleNativeAppShare}
              activeOpacity={0.8}
            >
              <View style={styles.shareQuickIconCircle}>
                <Feather name="share-2" size={18} color="#5321E8" />
              </View>
              <Text style={styles.shareQuickLabel}>Share via Apps</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareQuickBtn}
              onPress={handleCopyStoryLink}
              activeOpacity={0.8}
            >
              <View style={[styles.shareQuickIconCircle, copiedLink && styles.shareQuickIconCircleSuccess]}>
                <Feather name={copiedLink ? 'check' : 'copy'} size={18} color={copiedLink ? '#10B981' : '#5321E8'} />
              </View>
              <Text style={[styles.shareQuickLabel, copiedLink && styles.shareQuickLabelSuccess]}>
                {copiedLink ? 'Link Copied! ✓' : 'Copy Link'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Send in Chat to Leaders Heading */}
          <View style={styles.shareSectionHeader}>
            <Text style={styles.shareSectionTitle}>Send in Chat</Text>
            <Text style={styles.shareSectionSub}>Send directly to connections</Text>
          </View>

          {/* Contacts List */}
          <ScrollView style={styles.shareContactsScroll} showsVerticalScrollIndicator={false}>
            {loadingShareContacts ? (
              <View style={styles.shareLoadingBox}>
                <ActivityIndicator size="small" color="#5321E8" />
                <Text style={styles.shareLoadingText}>Loading contacts...</Text>
              </View>
            ) : shareContacts.length === 0 ? (
              <View style={styles.shareEmptyBox}>
                <Text style={styles.shareEmptyText}>Use "Share via Apps" to share anywhere!</Text>
              </View>
            ) : (
              shareContacts.map((contact) => {
                const contactId = contact.user_id || contact.id;
                const isSent = Boolean(sharedStatus[contactId]);
                return (
                  <View key={contactId} style={styles.shareContactRow}>
                    <View style={styles.shareContactAvatar}>
                      {contact.avatar || contact.avatar_url ? (
                        <Image source={{ uri: contact.avatar || contact.avatar_url }} style={styles.shareContactAvatarImg} />
                      ) : (
                        <Text style={styles.shareContactInitial}>
                          {(contact.name || 'U')[0].toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.shareContactInfo}>
                      <Text style={styles.shareContactName} numberOfLines={1}>{contact.name}</Text>
                      <Text style={styles.shareContactRole} numberOfLines={1}>
                        {contact.role || contact.company || 'Leader'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.shareSendBtn, isSent && styles.shareSendBtnSent]}
                      onPress={() => !isSent && handleShareToContact(contact)}
                      disabled={isSent}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.shareSendBtnText, isSent && styles.shareSendBtnTextSent]}>
                        {isSent ? 'Sent ✓' : 'Send'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ─── ADD STORY CREATOR MODAL ─── */}
      <Modal
        visible={addStoryModalVisible}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setAddStoryModalVisible(false)}
      >
        <LinearGradient
          colors={GRADIENT_PRESETS[selectedGradientIndex]}
          style={styles.addStoryModalContainer}
        >
          {/* Header */}
          <View style={styles.addStoryHeader}>
            <TouchableOpacity onPress={() => setAddStoryModalVisible(false)}>
              <Feather name="x" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.addStoryHeaderTitle}>Add to Story</Text>
            <TouchableOpacity
              onPress={handlePublishStory}
              disabled={isPublishing}
              style={styles.shareStoryPill}
            >
              {isPublishing ? (
                <ActivityIndicator size="small" color="#5321E8" />
              ) : (
                <Text style={styles.shareStoryPillText}>Share →</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Media Preview or Text Editor */}
          <View style={styles.addStoryCanvas}>
            {pickedMedia ? (
              <View style={styles.storyMediaWrapper}>
                <Image source={{ uri: pickedMedia }} style={styles.storyMediaCanvas} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.clearMediaBtn}
                  onPress={() => setPickedMedia(null)}
                >
                  <Feather name="x" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TextInput
                style={styles.storyTextInput}
                placeholder="Type your story update, leadership quote, or announcement..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                multiline
                value={storyText}
                onChangeText={setStoryText}
                textAlignVertical="center"
              />
            )}
          </View>

          {/* Bottom Controls */}
          <View style={styles.addStoryBottomControls}>
            {/* Color Palette Selector */}
            {!pickedMedia && (
              <View style={styles.paletteRow}>
                {GRADIENT_PRESETS.map((grad, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedGradientIndex(idx)}
                    style={[
                      styles.paletteDot,
                      selectedGradientIndex === idx && styles.paletteDotActive,
                    ]}
                  >
                    <LinearGradient colors={grad} style={styles.paletteDotInner} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Media Pickers: Photo, Video */}
            <View style={styles.addStoryActionsRow}>
              <TouchableOpacity
                style={styles.storyMediaBtn}
                onPress={() => handlePickMediaForStory('photo')}
              >
                <Feather name="image" size={20} color="#fff" />
                <Text style={styles.storyMediaBtnText}>Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.storyMediaBtn}
                onPress={() => handlePickMediaForStory('video')}
              >
                <Feather name="video" size={20} color="#fff" />
                <Text style={styles.storyMediaBtnText}>Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  storiesList: { backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  storiesContainer: { paddingHorizontal: 12, paddingVertical: 10, gap: 10, flexDirection: 'row' },
  storyCard: {
    width: 76,
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  storyCardGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  storyAvatarWrap: {
    position: 'relative',
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  storyCardAvatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#334155',
  },
  storyCardAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storyCardInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  storyAddBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#5A2CE4',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRainbowRing: {
    padding: 2,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCardAvatarImgRinged: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#101239',
    backgroundColor: '#334155',
  },
  storyCardAvatarFallbackRinged: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5321E8',
    borderWidth: 1.5,
    borderColor: '#101239',
  },
  storyCardInitialRinged: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  storyCardLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 2,
  },

  // ─── INSTAGRAM STORY VIEWER ───
  viewerContainer: { flex: 1, backgroundColor: '#000' },
  viewerMediaBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width, height },
  viewerTextCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  viewerBigText: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 36 },
  topVignette: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },

  tapAreaLeft: { position: 'absolute', top: 100, bottom: 90, left: 0, width: width * 0.35, zIndex: 10 },
  tapAreaRight: { position: 'absolute', top: 100, bottom: 90, right: 0, width: width * 0.65, zIndex: 10 },

  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingTop: 50,
    zIndex: 20,
  },
  progressBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: { height: 3, backgroundColor: '#fff', borderRadius: 2 },

  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 20,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  authorAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  authorInitial: { fontSize: 16, fontWeight: '800', color: '#fff' },
  authorName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  authorTime: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  viewerCloseBtn: { padding: 4 },

  viewerHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewerHeaderIconBtn: {
    padding: 6,
  },
  deleteStoryPopover: {
    position: 'absolute',
    top: 92,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 99,
  },
  deleteStoryPopoverText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },

  ownerBottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    zIndex: 20,
  },
  viewsBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  viewsBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── STORY VIEWERS BOTTOM SHEET ───
  viewersBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  viewersSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  viewersDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  viewersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  viewersHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewersCountPill: {
    backgroundColor: '#F3E8FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  viewersCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5321E8',
  },
  viewersLoadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  viewersLoadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  noViewersBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
    gap: 8,
  },
  noViewersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  noViewersSub: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  viewersList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  viewerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  viewerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  viewerItemAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#334155',
  },
  viewerItemFallbackAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerItemInitial: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewerItemMeta: {
    flex: 1,
  },
  viewerItemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewerItemRole: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },

  captionBox: {
    position: 'absolute',
    bottom: 85,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 10,
    zIndex: 15,
  },
  captionText: { fontSize: 14, color: '#fff', fontWeight: '500' },

  bottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 20,
  },
  replyInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  replyInput: { flex: 1, color: '#fff', fontSize: 13 },
  heartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBurstOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },

  // ─── STORY SHARE BOTTOM SHEET ───
  shareSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.75,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 999,
  },
  shareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  shareHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  shareCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareQuickRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  shareQuickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  shareQuickIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareQuickIconCircleSuccess: {
    backgroundColor: '#D1FAE5',
  },
  shareQuickLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  shareQuickLabelSuccess: {
    color: '#10B981',
  },
  shareSectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  shareSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  shareSectionSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  shareContactsScroll: {
    maxHeight: 260,
    paddingHorizontal: 20,
  },
  shareLoadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  shareLoadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  shareEmptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  shareEmptyText: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
  },
  shareContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 12,
  },
  shareContactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shareContactAvatarImg: {
    width: '100%',
    height: '100%',
  },
  shareContactInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5321E8',
  },
  shareContactInfo: {
    flex: 1,
  },
  shareContactName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  shareContactRole: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  shareSendBtn: {
    backgroundColor: '#5321E8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  shareSendBtnSent: {
    backgroundColor: '#10B981',
  },
  shareSendBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  shareSendBtnTextSent: {
    color: '#FFFFFF',
  },

  // ─── ADD STORY CREATOR ───
  addStoryModalContainer: { flex: 1, paddingTop: 50, paddingHorizontal: 16 },
  addStoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addStoryHeaderTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  shareStoryPill: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  shareStoryPillText: { fontSize: 13, fontWeight: '800', color: '#5321E8' },

  addStoryCanvas: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  storyTextInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    paddingHorizontal: 20,
  },
  storyMediaWrapper: { width: '100%', height: '80%', borderRadius: 16, overflow: 'hidden', position: 'relative' },
  storyMediaCanvas: { width: '100%', height: '100%' },
  clearMediaBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addStoryBottomControls: { paddingBottom: 30, gap: 14 },
  paletteRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  paletteDot: { width: 28, height: 28, borderRadius: 14, padding: 2 },
  paletteDotActive: { borderWidth: 2, borderColor: '#fff' },
  paletteDotInner: { width: '100%', height: '100%', borderRadius: 12 },

  addStoryActionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  storyMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
  },
  storyMediaBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
