import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';

interface Comment {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  content: string;
  timestamp: number;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

interface CommentSectionProps {
  comments?: Comment[];
  onAddComment?: (content: string, parentId?: string) => void;
  onLikeComment?: (commentId: string) => void;
  onDeleteComment?: (commentId: string) => void;
  placeholder?: string;
  maxLength?: number;
  artistId?: string;
}

export default function CommentSection({
  comments,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  placeholder = "Add a comment...",
  maxLength = 500,
}: CommentSectionProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { isConnected, user } = useAuthStore();
  
  // Default comments with sample data
  const defaultComments: Comment[] = [
    {
      id: '1',
      userId: 'user1',
      username: 'MusicFan23',
      content: 'Amazing artist! Love the new tracks 🔥',
      timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      likes: 12,
      isLiked: false,
    },
    {
      id: '2',
      userId: 'user2',
      username: 'VinylCollector',
      content: 'Been following since the early days. Still killing it!',
      timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      likes: 8,
      isLiked: true,
      replies: [
        {
          id: '2-1',
          userId: 'user3',
          username: 'RetroVibes',
          content: 'Same here! The evolution has been incredible.',
          timestamp: Date.now() - 1000 * 60 * 45, // 45 minutes ago
          likes: 3,
          isLiked: false,
        },
      ],
    },
  ];
  
  const commentsData = comments || defaultComments;
  
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSubmitComment = () => {
    if (!isConnected) {
      Alert.alert('Authentication Required', 'Please connect your wallet to comment');
      return;
    }

    if (!newComment.trim()) return;

    onAddComment(newComment.trim());
    setNewComment('');
  };

  const handleSubmitReply = (parentId: string) => {
    if (!isConnected) {
      Alert.alert('Authentication Required', 'Please connect your wallet to comment');
      return;
    }

    if (!replyContent.trim()) return;

    onAddComment(replyContent.trim(), parentId);
    setReplyContent('');
    setReplyingTo(null);
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <View key={comment.id} style={[styles.comment, isReply && styles.replyComment]}>
      <View style={styles.commentHeader}>
        <View style={styles.commentUser}>
          {comment.avatarUrl ? (
            <Image source={{ uri: comment.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {comment.username.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.username}>{comment.username}</Text>
            <Text style={styles.timestamp}>{formatTimestamp(comment.timestamp)}</Text>
          </View>
        </View>
        
        {onDeleteComment && user?.address === comment.userId && (
          <TouchableOpacity
            onPress={() => onDeleteComment(comment.id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={16} color={themeColors.error} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.commentContent}>{comment.content}</Text>

      <View style={styles.commentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLikeComment?.(comment.id)}
        >
          <Ionicons
            name={comment.isLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={comment.isLiked ? themeColors.error : themeColors.textSecondary}
          />
          <Text style={[
            styles.actionText,
            comment.isLiked && { color: themeColors.error }
          ]}>
            {comment.likes}
          </Text>
        </TouchableOpacity>

        {!isReply && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setReplyingTo(comment.id)}
          >
            <Ionicons name="chatbubble-outline" size={16} color={themeColors.textSecondary} />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
        )}
      </View>

      {replyingTo === comment.id && (
        <View style={styles.replyInput}>
          <TextInput
            style={styles.input}
            placeholder="Write a reply..."
            placeholderTextColor={themeColors.textSecondary}
            value={replyContent}
            onChangeText={setReplyContent}
            maxLength={maxLength}
            multiline
            autoFocus
          />
          <View style={styles.replyActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setReplyingTo(null);
                setReplyContent('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                !replyContent.trim() && styles.submitButtonDisabled
              ]}
              onPress={() => handleSubmitReply(comment.id)}
              disabled={!replyContent.trim()}
            >
              <Text style={styles.submitButtonText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.replies}>
          {comment.replies.map(reply => renderComment(reply, true))}
        </View>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    commentsContainer: {
      flex: 1,
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
    comment: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    replyComment: {
      backgroundColor: themeColors.background,
      marginLeft: 16,
      marginTop: 8,
      borderLeftWidth: 3,
      borderLeftColor: themeColors.primary,
      paddingLeft: 12,
    },
    commentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    commentUser: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 8,
    },
    avatarPlaceholder: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    avatarText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    userInfo: {
      flex: 1,
    },
    username: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
    },
    timestamp: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    deleteButton: {
      padding: 4,
    },
    commentContent: {
      fontSize: 14,
      color: themeColors.text,
      lineHeight: 18,
      marginBottom: 8,
    },
    commentActions: {
      flexDirection: 'row',
      gap: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionText: {
      fontSize: 12,
      color: themeColors.textSecondary,
      fontWeight: '500',
    },
    replies: {
      marginTop: 8,
    },
    replyInput: {
      marginTop: 12,
      padding: 12,
      backgroundColor: themeColors.background,
      borderRadius: 8,
    },
    replyActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 8,
    },
    cancelButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    cancelButtonText: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    submitButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: themeColors.primary,
      borderRadius: 6,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      fontSize: 14,
      color: 'white',
      fontWeight: '500',
    },
    inputContainer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      backgroundColor: themeColors.surface,
    },
    input: {
      backgroundColor: themeColors.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 16,
      color: themeColors.text,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    inputActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    characterCount: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    characterCountWarning: {
      color: themeColors.warning,
    },
    sendButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    sendButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 14,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Comments ({commentsData.reduce((total, comment) => 
            total + 1 + (comment.replies?.length || 0), 0
          )})
        </Text>
      </View>

      <ScrollView style={styles.commentsContainer} showsVerticalScrollIndicator={false}>
        {commentsData.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={themeColors.textSecondary} />
            <Text style={styles.emptyStateText}>
              No comments yet{'\n'}Be the first to share your thoughts!
            </Text>
          </View>
        ) : (
          commentsData.map(comment => renderComment(comment))
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={themeColors.textSecondary}
          value={newComment}
          onChangeText={setNewComment}
          maxLength={maxLength}
          multiline
        />
        <View style={styles.inputActions}>
          <Text style={[
            styles.characterCount,
            newComment.length > maxLength * 0.9 && styles.characterCountWarning
          ]}>
            {newComment.length}/{maxLength}
          </Text>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newComment.trim() || !isConnected) && styles.sendButtonDisabled
            ]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || !isConnected}
          >
            <Text style={styles.sendButtonText}>
              {isConnected ? 'Send' : 'Connect Wallet'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}