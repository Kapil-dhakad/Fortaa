import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserHeader from '../../components/layout/UserHeader';
import UserSidebar from '../../components/layout/UserSidebar';
import {
  fetchFollowing,
  sendFollowRequest,
  cancelFollowRequest,
  unfollowUser,
} from '../../services/follow.service';
import { joinChat, subscribeToFollowEvents } from '../../services/socket.service';
import './FollowingPage.css';

// Default initial leader dataset matching user's Figma reference screenshot
const INITIAL_DEMO_LEADERS = [
  { id: 101, name: 'Albert Flores', designation: 'Business Leader', follow_status: 'accepted' },
  { id: 102, name: 'Darlene Robertson', designation: 'Silver Leader', follow_status: 'pending' },
  { id: 103, name: 'Floyd Miles', designation: 'Team Leader', follow_status: 'accepted' },
  { id: 104, name: 'Brooklyn Simmons', designation: 'Business Leader', follow_status: 'pending' },
  { id: 105, name: 'Esther Howard', designation: 'Silver Leader', follow_status: 'accepted' },
  { id: 106, name: 'Dianne Russell', designation: 'Team Leader', follow_status: 'pending' },
  { id: 107, name: 'Devon Lane', designation: 'Business Leader', follow_status: 'accepted' },
  { id: 108, name: 'Cameron Williamson', designation: 'Business Leader', follow_status: 'pending' },
  { id: 109, name: 'Savannah Nguyen', designation: 'Silver Leader', follow_status: 'accepted' },
  { id: 110, name: 'Leslie Alexander', designation: 'Team Leader', follow_status: 'accepted' },
  { id: 111, name: 'Eleanor Pena', designation: 'Business Leader', follow_status: 'pending' },
];

export default function FollowingPage() {
  const navigate = useNavigate();
  const [followingList, setFollowingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Read stored user
  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
  } catch {
    storedUser = {};
  }
  const [resolvedUserId, setResolvedUserId] = useState(() => storedUser.id || storedUser._id || null);
  const currentUserId = resolvedUserId || storedUser.id || 1;

  useEffect(() => {
    if (storedUser.id || storedUser._id) {
      setResolvedUserId(storedUser.id || storedUser._id);
      return;
    }
    if (storedUser.email) {
      fetch(`/api/dashboard/overview?email=${encodeURIComponent(storedUser.email)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.success && data?.user?.id) {
            setResolvedUserId(data.user.id);
            try {
              const cur = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
              localStorage.setItem('fortaa_user', JSON.stringify({ ...cur, id: data.user.id, ...data.user }));
              window.dispatchEvent(new CustomEvent('fortaa_user_synced', { detail: data.user }));
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, [storedUser.id, storedUser._id, storedUser.email]);

  // Load Following data from DB & connect live events
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = () => {
      fetchFollowing(currentUserId)
        .then((data) => {
          if (!isMounted) return;
          if (data && data.length > 0) {
            setFollowingList(data);
          } else {
            setFollowingList(INITIAL_DEMO_LEADERS);
          }
        })
        .catch((err) => {
          console.error('Fetch following error:', err);
          if (isMounted) setFollowingList(INITIAL_DEMO_LEADERS);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    };

    loadData();

    // Socket real-time room join & listener
    joinChat(currentUserId);
    const unsubFollow = subscribeToFollowEvents({
      onFollowAccepted: ({ targetUserId }) => {
        const numId = Number(targetUserId);
        setFollowingList((prev) =>
          prev.map((u) => (Number(u.id) === numId ? { ...u, follow_status: 'accepted' } : u))
        );
      },
      onFollowUpdated: () => {
        loadData();
      },
    });

    // 4s polling sync
    const interval = setInterval(loadData, 4000);

    return () => {
      isMounted = false;
      unsubFollow?.();
      clearInterval(interval);
    };
  }, [currentUserId]);

  // Handle Unfollow
  const handleUnfollow = async (targetUserId, targetName) => {
    const confirm = window.confirm(`Are you sure you want to unfollow ${targetName}?`);
    if (!confirm) return;

    // Optimistic UI update
    setFollowingList((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, follow_status: 'none' } : u))
    );
    toast(`Unfollowed ${targetName}`);

    try {
      await unfollowUser(targetUserId, currentUserId);
    } catch (err) {
      console.error('Unfollow error:', err);
    }
  };

  // Handle Cancel Pending Request
  const handleCancelRequest = async (targetUserId, targetName) => {
    const confirm = window.confirm(`Cancel follow request to ${targetName}?`);
    if (!confirm) return;

    // Optimistic UI update
    setFollowingList((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, follow_status: 'none' } : u))
    );
    toast('Follow request cancelled', { icon: 'ℹ️' });

    try {
      await cancelFollowRequest(targetUserId, currentUserId);
    } catch (err) {
      console.error('Cancel request error:', err);
    }
  };

  // Handle Send Request (if user was unfollowed / none)
  const handleSendRequest = async (targetUserId, targetName) => {
    try {
      const res = await sendFollowRequest(targetUserId, currentUserId);
      const newStatus = res?.status || 'pending';
      setFollowingList((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, follow_status: newStatus } : u))
      );
      if (newStatus === 'accepted') {
        toast.success(`You are now following ${targetName}!`);
      } else {
        toast.success(`Follow request sent to ${targetName}!`);
      }
    } catch (err) {
      console.error('Send request error:', err);
    }
  };

  return (
    <div className="fol-page-root">
      {/* Unified Global Header */}
      <UserHeader
        user={storedUser}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="fol-main-layout">
        {/* Unified Sidebar */}
        <UserSidebar
          activeTab="Following"
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Main Content Area */}
        <main className="fol-content-container">
          <div className="fol-card-box">
            {/* Header matching Figma: [Icon] Following */}
            <div className="fol-header-row">
              <span className="fol-header-icon" role="img" aria-label="Following">
                👥
              </span>
              <h1 className="fol-header-title">Following</h1>
              <span className="fol-header-count">
                ({followingList.filter((u) => u.follow_status === 'accepted' || u.follow_status === 'pending').length})
              </span>
            </div>

            {/* List Body */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#8C87A2' }}>
                Loading following leaders...
              </div>
            ) : (
              <div className="fol-list">
                {followingList.map((person) => {
                  const status = person.follow_status || 'accepted';

                  return (
                    <div key={person.id} className="fol-item-card">
                      {/* Left: Avatar + Info */}
                      <div className="fol-item-left">
                        <div className="fol-avatar-wrap">
                          {person.avatar_url ? (
                            <img
                              src={person.avatar_url}
                              alt={person.name}
                              className="fol-avatar-img"
                            />
                          ) : (
                            <span className="fol-avatar-initials">
                              {person.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="fol-meta-info">
                          <h4 className="fol-name">{person.name}</h4>
                          <p className="fol-role">
                            {person.designation || 'Business Leader'}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="fol-item-actions">
                        <button
                          type="button"
                          className="fol-btn-msg"
                          onClick={() => navigate(`/messages?userId=${person.id}`)}
                        >
                          Message
                        </button>

                        {status === 'pending' ? (
                          <button
                            type="button"
                            className="fol-btn-status fol-btn-pending"
                            title="Click to cancel request"
                            onClick={() => handleCancelRequest(person.id, person.name)}
                          >
                            Pending
                          </button>
                        ) : status === 'accepted' ? (
                          <button
                            type="button"
                            className="fol-btn-status fol-btn-following"
                            title="Click to unfollow"
                            onClick={() => handleUnfollow(person.id, person.name)}
                          >
                            Following
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="fol-btn-status fol-btn-connect"
                            onClick={() => handleSendRequest(person.id, person.name)}
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
