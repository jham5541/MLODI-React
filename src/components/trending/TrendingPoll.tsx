import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useTheme, colors } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import votingService, { PollWithOptions, PollOption } from '../../services/votingService';

interface TrendingPollProps {
  pollId?: string; // Optional poll ID - if not provided, will fetch featured poll
  poll?: PollWithOptions; // Optional poll data - if provided, won't fetch
  onVoteComplete?: (poll: PollWithOptions) => void;
}

export default function TrendingPoll({ pollId, poll: initialPoll, onVoteComplete }: TrendingPollProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  
  const [poll, setPoll] = useState<PollWithOptions | null>(initialPoll || null);
  const [loading, setLoading] = useState(!initialPoll);
  const [voting, setVoting] = useState<string | null>(null); // Track which option is being voted on

  useEffect(() => {
    if (!initialPoll) {
      loadPoll();
    }
  }, [pollId]);

  const loadPoll = async () => {
    try {
      setLoading(true);
      let pollData: PollWithOptions | null = null;
      
      if (pollId) {
        pollData = await votingService.getPollById(pollId);
      } else {
        // Get first featured poll
        const featuredPolls = await votingService.getFeaturedPolls();
        pollData = featuredPolls[0] || null;
      }
      
      setPoll(pollData);
    } catch (error) {
      console.error('Failed to load poll:', error);
      Alert.alert('Error', 'Failed to load poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (optionId: string) => {
    if (!poll || !poll.can_vote || voting) {
      return;
    }

    try {
      setVoting(optionId);
      
      // Check if this is a sample poll (for testing without database)
      if (poll.id === 'sample-poll-1') {
        // Handle sample poll voting locally
        handleSampleVote(optionId);
        return;
      }

      await votingService.vote(poll.id, optionId);
      
      // Reload poll to get updated vote counts
      const updatedPoll = await votingService.getPollById(poll.id);
      if (updatedPoll) {
        setPoll(updatedPoll);
        onVoteComplete?.(updatedPoll);
      }
      
      Alert.alert('Success', 'Your vote has been recorded!');
    } catch (error) {
      console.error('Failed to vote:', error);
      Alert.alert('Error', 'Failed to record your vote. Please try again.');
    } finally {
      setVoting(null);
    }
  };

  const handleSampleVote = (optionId: string) => {
    if (!poll) return;

    // Create updated poll with vote
    const updatedPoll = {
      ...poll,
      can_vote: false,
      user_vote: {
        id: 'sample-vote-1',
        poll_id: poll.id,
        option_id: optionId,
        user_id: undefined,
        anonymous_id: 'sample-user',
        voted_at: new Date().toISOString(),
      },
      total_votes: poll.total_votes + 1,
      options: poll.options.map(option => ({
        ...option,
        vote_count: option.id === optionId ? option.vote_count + 1 : option.vote_count,
      })),
    };

    setPoll(updatedPoll);
    onVoteComplete?.(updatedPoll);
    setVoting(null);
    Alert.alert('Success', 'Your vote has been recorded! (Sample Poll)');
  };

  const handleRemoveVote = async () => {
    if (!poll || !poll.user_vote) {
      return;
    }

    try {
      Alert.alert(
        'Remove Vote',
        'Are you sure you want to remove your vote?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await votingService.removeVote(poll.id);
                
                // Reload poll to get updated vote counts
                const updatedPoll = await votingService.getPollById(poll.id);
                if (updatedPoll) {
                  setPoll(updatedPoll);
                  onVoteComplete?.(updatedPoll);
                }
                
                Alert.alert('Success', 'Your vote has been removed.');
              } catch (error) {
                console.error('Failed to remove vote:', error);
                Alert.alert('Error', 'Failed to remove your vote. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error removing vote:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 8,
    },
    description: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 12,
      lineHeight: 18,
    },
    pollInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: themeColors.background,
      borderRadius: 8,
    },
    pollInfoText: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    removeVoteButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: themeColors.error,
      borderRadius: 16,
    },
    removeVoteText: {
      fontSize: 12,
      color: 'white',
      fontWeight: '600',
    },
    loadingText: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginTop: 8,
    },
    optionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    optionContent: {
      flex: 1,
      marginRight: 12,
    },
    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    optionText: {
      fontSize: 14,
      fontWeight: '500',
      color: themeColors.text,
    },
    optionDescription: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    progressSection: {
      flex: 2,
      marginRight: 16,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: themeColors.background,
      marginBottom: 4,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: themeColors.primary,
    },
    progressText: {
      fontSize: 11,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    voteSection: {
      alignItems: 'center',
      minWidth: 80,
    },
    voteButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      minWidth: 60,
      alignItems: 'center',
    },
    voteButtonEnabled: {
      backgroundColor: themeColors.primary,
    },
    voteButtonDisabled: {
      backgroundColor: themeColors.textSecondary,
    },
    voteButtonVoted: {
      backgroundColor: themeColors.success,
    },
    voteButtonText: {
      fontSize: 12,
      color: 'white',
      fontWeight: '600',
    },
    votedIndicator: {
      marginLeft: 8,
    },
  });

  if (loading || !poll) {
    return (
      <View style={styles.container}>
        <View style={{ justifyContent: 'center', alignItems: 'center', minHeight: 100 }}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.loadingText}>Loading poll...</Text>
        </View>
      </View>
    );
  }


  const renderOption = ({ item }: { item: PollOption }) => {
    const votePercentage = poll.total_votes > 0 ? ((item.vote_count / poll.total_votes) * 100).toFixed(1) : '0.0';
    const isUserVote = poll.user_vote?.option_id === item.id;
    const canVote = poll.can_vote && !poll.user_vote;
    const isVoting = voting === item.id;

    const getButtonStyle = () => {
      if (isUserVote) return [styles.voteButton, styles.voteButtonVoted];
      if (!canVote) return [styles.voteButton, styles.voteButtonDisabled];
      return [styles.voteButton, styles.voteButtonEnabled];
    };

    const getButtonText = () => {
      if (isVoting) return 'Voting...';
      if (isUserVote) return 'Voted';
      if (!canVote && poll.user_vote) return 'Voted';
      return 'Vote';
    };

    return (
      <View style={styles.optionContainer}>
        <View style={styles.optionContent}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionText}>{item.text}</Text>
            {isUserVote && (
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color={themeColors.success} 
                style={styles.votedIndicator}
              />
            )}
          </View>
          {item.description && (
            <Text style={styles.optionDescription}>{item.description}</Text>
          )}
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${votePercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {votePercentage}% ({item.vote_count} votes)
          </Text>
        </View>
        
        <View style={styles.voteSection}>
          <TouchableOpacity 
            style={getButtonStyle()}
            onPress={() => handleVote(item.id)}
            disabled={!canVote || isVoting}
          >
            {isVoting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.voteButtonText}>{getButtonText()}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{poll.title}</Text>
      {poll.description && (
        <Text style={styles.description}>{poll.description}</Text>
      )}
      
      <View style={styles.pollInfo}>
        <Text style={styles.pollInfoText}>
          {poll.total_votes} total votes • {poll.category} • {poll.poll_type.replace('_', ' ')}
        </Text>
        {poll.user_vote && (
          <TouchableOpacity style={styles.removeVoteButton} onPress={handleRemoveVote}>
            <Text style={styles.removeVoteText}>Remove Vote</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={poll.options}
        renderItem={renderOption}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
    </View>
  );
}
