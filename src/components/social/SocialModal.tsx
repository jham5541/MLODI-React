import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import CommentSection from './CommentSection';
import ReactionBar from './ReactionBar';

interface SocialModalProps {
  isVisible: boolean;
  onClose: () => void;
  contentTitle: string;
  contentSubtitle?: string;
  reactions: Array<{
    type: 'like' | 'love' | 'fire' | 'wow' | 'sad' | 'angry';
    count: number;
    isActive: boolean;
  }>;
  comments: Array<{
    id: string;
    userId: string;
    username: string;
    avatarUrl?: string;
    content: string;
    timestamp: number;
    likes: number;
    isLiked: boolean;
    replies?: any[];
  }>;
  onReaction: (type: 'like' | 'love' | 'fire' | 'wow' | 'sad' | 'angry') => void;
  onAddComment: (content: string, parentId?: string) => void;
  onLikeComment: (commentId: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export default function SocialModal({
  isVisible,
  onClose,
  contentTitle,
  contentSubtitle,
  reactions,
  comments,
  onReaction,
  onAddComment,
  onLikeComment,
  onDeleteComment,
}: SocialModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [activeTab, setActiveTab] = useState<'reactions' | 'comments'>('reactions');

  const styles = StyleSheet.create({
    modalContainer: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    modalContent: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '85%',
      minHeight: '50%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerContent: {
      flex: 1,
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      padding: 4,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: themeColors.surface,
      margin: 16,
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: themeColors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.textSecondary,
    },
    activeTabText: {
      color: 'white',
    },
    content: {
      flex: 1,
    },
    reactionsContainer: {
      padding: 20,
    },
    reactionsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 16,
    },
    reactionBarContainer: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 16,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
  });

  const renderReactionsTab = () => (
    <ScrollView style={styles.reactionsContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.reactionsTitle}>Reactions</Text>
      <View style={styles.reactionBarContainer}>
        <ReactionBar
          reactions={reactions}
          onReaction={onReaction}
          showLabels={true}
          size="large"
          orientation="vertical"
        />
      </View>
      
      {reactions.every(r => r.count === 0) && (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={48} color={themeColors.textSecondary} />
          <Text style={styles.emptyStateText}>
            No reactions yet{'\n'}Be the first to react!
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderCommentsTab = () => (
    <CommentSection
      comments={comments}
      onAddComment={onAddComment}
      onLikeComment={onLikeComment}
      onDeleteComment={onDeleteComment}
    />
  );

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={styles.modalContainer}
      avoidKeyboard
    >
      <View style={styles.modalContent}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {contentTitle}
            </Text>
            {contentSubtitle && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {contentSubtitle}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reactions' && styles.activeTab]}
            onPress={() => setActiveTab('reactions')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'reactions' && styles.activeTabText
            ]}>
              Reactions ({reactions.reduce((sum, r) => sum + r.count, 0)})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'comments' && styles.activeTab]}
            onPress={() => setActiveTab('comments')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'comments' && styles.activeTabText
            ]}>
              Comments ({comments.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeTab === 'reactions' ? renderReactionsTab() : renderCommentsTab()}
        </View>
      </View>
    </Modal>
  );
}