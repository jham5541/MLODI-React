import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import commentService, { Comment } from '../../services/commentService';
import { supabase } from '../../lib/supabase/client';

interface CommentSectionProps {
  trackId: string; // target id (track or artist)
  scope?: 'track' | 'artist';
  placeholder?: string;
  maxLength?: number;
}

export default function CommentSection({
  trackId,
  scope = 'track',
  placeholder = "Add a comment...",
  maxLength = 500,
}: CommentSectionProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { user, profile } = useAuthStore();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate that the provided target id is a UUID (to avoid 22P02 errors)
  const isUuid = (v: string) => /^(?:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/.test(v);
  const isValidTargetId = scope === 'artist' ? true : isUuid(trackId);

  useEffect(() => {
    const loadComments = async () => {
      if (!isValidTargetId) {
        setComments([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const fetchedComments = await commentService.fetchComments(trackId, user?.id, scope);
      setComments(fetchedComments);
      setLoading(false);
    };
    loadComments();
  }, [trackId, user?.id, isValidTargetId, scope]);

  // Realtime updates to feel like chat: refetch on new inserts
  useEffect(() => {
    if (!isValidTargetId) return;
    const table = scope === 'artist' ? 'artist_comments' : 'track_comments';
    const foreignIdColumn = scope === 'artist' ? 'artist_id' : 'track_id';

    const channel = supabase
      .channel(`comments-${scope}-${trackId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter: `${foreignIdColumn}=eq.${trackId}` }, () => {
        // Simple approach: refetch comments on every new insert
        commentService.fetchComments(trackId, user?.id, scope).then(setComments);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackId, scope, isValidTargetId, user?.id]);


  const handleToggleLike = async (commentId: string) => {
    if (!user) return;

    const success = await commentService.toggleCommentLike(commentId, user.id, scope);
    if (success) {
      setComments(prev => {
        const updateCommentLike = (comments: Comment[]): Comment[] => {
          return comments.map(comment => comment.id === commentId
            ? { ...comment, isLiked: !comment.isLiked, likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1 }
            : { ...comment, replies: comment.replies ? updateCommentLike(comment.replies) : [] });
        };
        return updateCommentLike(prev);
      });
    }
  };
  const inputRef = useRef<TextInput>(null);

  const handleSubmitComment = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to comment');
      return;
    }
    if (!isValidTargetId) {
      Alert.alert('Comments unavailable', 'Comments are not available for this item yet.');
      return;
    }
    if (!newComment.trim() || isSubmitting) return;

    const content = newComment.trim();
    // Build optimistic (temporary) comment
    const tempId = `temp-${Date.now()}`;
    const tempComment: Comment = {
      id: tempId,
      userId: user.id,
      username: profile?.display_name || profile?.username || user.email || 'You',
      avatarUrl: (profile as any)?.avatar_url,
      content,
      timestamp: Date.now(),
      likes: 0,
      isLiked: false,
      trackId,
    };

    // Optimistically update UI
    setComments(prev => [tempComment, ...prev]);
    setNewComment('');
    setIsSubmitting(true);

    try {
      const created = await commentService.addComment(trackId, user.id, content, undefined, scope);
      if (created) {
        // Replace temp with server comment
        setComments(prev => prev.map(c => (c.id === tempId ? created : c)));
      } else {
        // Rollback on failure
        setComments(prev => prev.filter(c => c.id !== tempId));
        Alert.alert('Comment failed', 'Could not post your comment. Please try again.');
      }
    } catch (e) {
      setComments(prev => prev.filter(c => c.id !== tempId));
      Alert.alert('Comment failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await commentService.deleteComment(commentId, user.id, scope);
            if (success) {
              setComments(prev => prev.filter(c => c.id !== commentId));
            }
          },
        },
      ]
    );
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

  const renderComment = (comment: Comment) => (
    <View key={comment.id} style={styles.comment}>
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
        
        {user?.id === comment.userId && (
          <TouchableOpacity
            onPress={() => handleDeleteComment(comment.id)}
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
          onPress={() => handleToggleLike(comment.id)}
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

      </View>

    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    commentsContainer: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 12,
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    /* Removed reply styles */
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
    /* Removed reply styles */
    _unused2: {
      marginTop: 8,
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
      borderRadius: 22,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 16,
      color: themeColors.text,
      maxHeight: 100,
      borderWidth: 1,
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
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 40,
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    sendButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 14,
    },
    badge: {
      marginLeft: 8,
      backgroundColor: themeColors.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.text,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="chatbubbles" size={18} color={themeColors.primary} />
          <Text style={styles.headerTitle}>
            Comments
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {comments.length}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.commentsContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={[styles.emptyStateText, { marginTop: 16 }]}>Loading comments...</Text>
          </View>
        ) : !isValidTargetId ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={48} color={themeColors.warning || themeColors.textSecondary} />
            <Text style={styles.emptyStateText}>
              Comments are unavailable for this item.
            </Text>
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={themeColors.textSecondary} />
            <Text style={styles.emptyStateText}>
              No comments yet{'\n'}Be the first to share your thoughts!
            </Text>
          </View>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { borderColor: themeColors.border }]}
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
              (!newComment.trim() || isSubmitting || !isValidTargetId) && styles.sendButtonDisabled
            ]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting || !isValidTargetId}
          >
            <Ionicons name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
