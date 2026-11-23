import React from 'react';
import {
  FiUser,
  FiBriefcase,
  FiUsers,
  FiAward,
  FiTrendingUp,
  FiStar,
  FiShoppingBag,
  FiGlobe,
  FiShield,
  FiTarget,
  FiPackage,
  FiLayers,
} from 'react-icons/fi';

export default function AccountTypeIcon({ name, size = 22, color, className = '' }) {
  const cleanKey = (name || '').toLowerCase().trim();

  switch (cleanKey) {
    case 'building':
    case 'company':
    case 'business':
      return <FiBriefcase size={size} color={color} className={className} />;

    case 'briefcase':
    case 'distributor':
    case 'partner':
    case 'award':
      return <FiAward size={size} color={color} className={className} />;

    case 'users':
    case 'team':
    case 'leader':
    case 'group':
      return <FiUsers size={size} color={color} className={className} />;

    case 'trending':
    case 'growth':
      return <FiTrendingUp size={size} color={color} className={className} />;

    case 'star':
    case 'vip':
      return <FiStar size={size} color={color} className={className} />;

    case 'shopping':
    case 'store':
      return <FiShoppingBag size={size} color={color} className={className} />;

    case 'globe':
    case 'franchise':
      return <FiGlobe size={size} color={color} className={className} />;

    case 'shield':
    case 'verified':
      return <FiShield size={size} color={color} className={className} />;

    case 'target':
      return <FiTarget size={size} color={color} className={className} />;

    case 'package':
      return <FiPackage size={size} color={color} className={className} />;

    case 'layers':
      return <FiLayers size={size} color={color} className={className} />;

    case 'user':
    case 'individual':
    default:
      return <FiUser size={size} color={color} className={className} />;
  }
}
