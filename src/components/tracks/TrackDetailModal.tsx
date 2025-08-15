import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase/client';
import { trackReactionService } from '../../services/trackReactionService';
import { commentService } from '../../services/commentService';
import { likesService } from '../../services/likesService';
import { formatDuration } from '../../utils/uiHelpers';
import { Song } from '../../types/music';

interface TrackDetailModalProps {
  visible: boolean;
  track: Song | null;
  onClose: () => void;
  onPlay: () => void;
}

interface TrackMetrics {
  playCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  duration: number;
  releaseDate: string | null;
  genre: string | null;
  mood: string | null;
  reactions: {
    fire: number;
    love: number;
    thumbsUp: number;
    mindBlown: number;
  };
}

const { width: screenWidth } = Dimensions.get('window');

export default function TrackDetailModal({
  visible,
  track,
  onClose,
  onPlay,
}: TrackDetailModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<TrackMetrics>({
    playCount: 0,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    duration: 0,
    releaseDate: null,
    genre: null,
    mood: null,
    reactions: {
      fire: 0,
      love: 0,
      thumbsUp: 0,
      mindBlown: 0,
    },
  });
  const [isLiked, setIsLiked] = useState(false);
  const [userReactions, setUserReactions] = useState<string[]>([]);

  useEffect(() => {
    if (visible && track) {
      fetchTrackMetrics();
    }
  }, [visible, track]);

  const fetchTrackMetrics = async () => {
    if (!track) return;
    
    setLoading(true);
    try {
      // Fetch track details from tracks table
      const { data: trackData, error: trackError } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          artist_id,
          duration,
          play_count,
          created_at,
          genre,
          mood,
          audio_url,
          cover_url
        `)
        .eq('id', track.id)
        .single();

      if (trackError) {
        console.error('Error fetching track data:', trackError);
      }

      // Fetch like count
      const { count: likeCount } = await supabase
        .from('user_likes')
        .select('*', { count: 'exact', head: true })
        .eq('liked_type', 'song')
        .eq('liked_id', track.id);

      // Fetch comment count
      const { count: commentCount } = await supabase
        .from('track_comments')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', track.id);

      // Fetch reactions
      let reactions = { fire: 0, love: 0, thumbsUp: 0, mindBlown: 0 };
      try {
        const reactionCounts = await trackReactionService.getReactions(track.id);
        reactionCounts.forEach(r => {
          switch (r.reaction_type) {
            case 'fire':
              reactions.fire = r.count;
              break;
            case 'love':
              reactions.love = r.count;
              break;
            case 'thumbs_up':
              reactions.thumbsUp = r.count;
              break;
            case 'mind_blown':
              reactions.mindBlown = r.count;
              break;
          }
        });
      } catch (error) {
        console.error('Error fetching reactions:', error);
      }

      // Check if user has liked this track
      if (user) {
        const liked = await likesService.isLiked(track.id, 'song');
        setIsLiked(liked);
        
        // Get user reactions
        try {
          const userReacts = await trackReactionService.getUserReactions(track.id, user.id);
          setUserReactions(userReacts);
        } catch (error) {
          console.error('Error fetching user reactions:', error);
        }
      }

      // Calculate share count (mock for now - could be from a shares table)
      const shareCount = Math.floor((trackData?.play_count || 0) * 0.05);

      setMetrics({
        playCount: trackData?.play_count || 0,
        likeCount: likeCount || 0,
        commentCount: commentCount || 0,
        shareCount: shareCount,
        duration: trackData?.duration || track.duration || 0,
        releaseDate: trackData?.created_at || null,
        genre: trackData?.genre || null,
        mood: trackData?.mood || null,
        reactions,
      });
    } catch (error) {
      console.error('Error fetching track metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || !track) return;
    
    try {
      const newLikeStatus = await likesService.toggleLike(track.id, 'song');
      setIsLiked(newLikeStatus);
      
      // Update like count
      setMetrics(prev => ({
        ...prev,
        likeCount: newLikeStatus ? prev.likeCount + 1 : prev.likeCount - 1,
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (!user || !track) return;
    
    try {
      const hasReaction = userReactions.includes(reactionType);
      
      if (hasReaction) {
        await trackReactionService.removeReaction(track.id, user.id, reactionType as any);
        setUserReactions(prev => prev.filter(r => r !== reactionType));
        
        // Update reaction count
        setMetrics(prev => ({
          ...prev,
          reactions: {
            ...prev.reactions,
            [reactionType === 'thumbs_up' ? 'thumbsUp' : reactionType === 'mind_blown' ? 'mindBlown' : reactionType]: 
              prev.reactions[reactionType === 'thumbs_up' ? 'thumbsUp' : reactionType === 'mind_blown' ? 'mindBlown' : reactionType] - 1,
          },
        }));
      } else {
        await trackReactionService.addReaction(track.id, user.id, reactionType as any);
        setUserReactions(prev => [...prev, reactionType]);
        
        // Update reaction count
        setMetrics(prev => ({
          ...prev,
          reactions: {
            ...prev.reactions,
            [reactionType === 'thumbs_up' ? 'thumbsUp' : reactionType === 'mind_blown' ? 'mindBlown' : reactionType]: 
              prev.reactions[reactionType === 'thumbs_up' ? 'thumbsUp' : reactionType === 'mind_blown' ? 'mindBlown' : reactionType] + 1,
          },
        }));
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      flex: 1,
      backgroundColor: themeColors.background,
      marginTop: 100,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
    },
    closeButton: {
      padding: 4,
    },
    scrollContent: {
      padding: 20,
    },
    coverSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    coverImage: {
      width: screenWidth * 0.6,
      height: screenWidth * 0.6,
      borderRadius: 12,
      marginBottom: 16,
    },
    trackTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    artistName: {
      fontSize: 18,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    playButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    playButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    metricsSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 16,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    metricCard: {
      width: (screenWidth - 52) / 2,
      backgroundColor: themeColors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    metricValue: {
      fontSize: 24,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    detailsSection: {
      marginBottom: 24,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    detailLabel: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    detailValue: {
      fontSize: 14,
      color: themeColors.text,
      fontWeight: '500',
    },
    reactionsSection: {
      marginBottom: 24,
    },
    reactionsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    reactionButton: {
      alignItems: 'center',
      padding: 12,
    },
    reactionButtonActive: {
      backgroundColor: themeColors.primary + '20',
      borderRadius: 12,
    },
    reactionEmoji: {
      fontSize: 28,
      marginBottom: 4,
    },
    reactionCount: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    actionsSection: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      marginTop: 'auto',
    },
    actionButton: {
      alignItems: 'center',
      padding: 12,
    },
    actionLabel: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginTop: 4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (!track) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Track Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
          ) : (
            <ScrollView style={styles.scrollContent}>
              <View style={styles.coverSection}>
                <Image
                  source={{ uri: track.coverUrl }}
                  style={styles.coverImage}
                />
                <Text style={styles.trackTitle}>{track.title}</Text>
                <Text style={styles.artistName}>{track.artist}</Text>
                <TouchableOpacity style={styles.playButton} onPress={onPlay}>
                  <Ionicons name="play" size={20} color="white" />
                  <Text style={styles.playButtonText}>Play</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.metricsSection}>
                <Text style={styles.sectionTitle}>Metrics</Text>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{formatNumber(metrics.playCount)}</Text>
                    <Text style={styles.metricLabel}>Plays</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{formatNumber(metrics.likeCount)}</Text>
                    <Text style={styles.metricLabel}>Likes</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{formatNumber(metrics.commentCount)}</Text>
                    <Text style={styles.metricLabel}>Comments</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{formatNumber(metrics.shareCount)}</Text>
                    <Text style={styles.metricLabel}>Shares</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{formatDuration(metrics.duration)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Release Date</Text>
                  <Text style={styles.detailValue}>{formatDate(metrics.releaseDate)}</Text>
                </View>
                {metrics.genre && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Genre</Text>
                    <Text style={styles.detailValue}>{metrics.genre}</Text>
                  </View>
                )}
                {metrics.mood && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mood</Text>
                    <Text style={styles.detailValue}>{metrics.mood}</Text>
                  </View>
                )}
              </View>

              <View style={styles.reactionsSection}>
                <Text style={styles.sectionTitle}>Reactions</Text>
                <View style={styles.reactionsGrid}>
                  <TouchableOpacity
                    style={[
                      styles.reactionButton,
                      userReactions.includes('fire') && styles.reactionButtonActive,
                    ]}
                    onPress={() => handleReaction('fire')}
                  >
                    <Text style={styles.reactionEmoji}>🔥</Text>
                    <Text style={styles.reactionCount}>{formatNumber(metrics.reactions.fire)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.reactionButton,
                      userReactions.includes('love') && styles.reactionButtonActive,
                    ]}
                    onPress={() => handleReaction('love')}
                  >
                    <Text style={styles.reactionEmoji}>❤️</Text>
                    <Text style={styles.reactionCount}>{formatNumber(metrics.reactions.love)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.reactionButton,
                      userReactions.includes('thumbs_up') && styles.reactionButtonActive,
                    ]}
                    onPress={() => handleReaction('thumbs_up')}
                  >
                    <Text style={styles.reactionEmoji}>👍</Text>
                    <Text style={styles.reactionCount}>{formatNumber(metrics.reactions.thumbsUp)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.reactionButton,
                      userReactions.includes('mind_blown') && styles.reactionButtonActive,
                    ]}
                    onPress={() => handleReaction('mind_blown')}
                  >
                    <Text style={styles.reactionEmoji}>🤯</Text>
                    <Text style={styles.reactionCount}>{formatNumber(metrics.reactions.mindBlown)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}

          <SafeAreaView>
            <View style={styles.actionsSection}>
              <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isLiked ? '#FF3B30' : themeColors.text}
                />
                <Text style={styles.actionLabel}>Like</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={24} color={themeColors.text} />
                <Text style={styles.actionLabel}>Comment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={24} color={themeColors.text} />
                <Text style={styles.actionLabel}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="add-circle-outline" size={24} color={themeColors.text} />
                <Text style={styles.actionLabel}>Add to Playlist</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}
