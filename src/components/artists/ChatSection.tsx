import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { chatService, Message } from '../../services/chatService';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../services/databaseService';

interface ChatSectionProps {
  artistId: string;
  artistName: string;
}

export default function ChatSection({ artistId, artistName }: ChatSectionProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      unsubscribe = await initializeChat();
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [artistId]);

  const initializeChat = async () => {
    try {
      if (!user) return null;
      
      // Get or create conversation with the artist
      const convId = await chatService.getOrCreateDirectConversation(artistId);
      setConversationId(convId);

      // Load initial messages
      const messageHistory = await chatService.getMessages(convId, { limit: 50 });
      setMessages(messageHistory);
      setHasMore(messageHistory.length === 50);

      // Subscribe to new messages
      const unsubscribe = chatService.subscribeToMessages(convId, (newMsg) => {
        setMessages(prev => [newMsg, ...prev]);
      });

      setIsLoading(false);
      return unsubscribe;
    } catch (error) {
      console.error('Error initializing chat:', error);
      setIsLoading(false);
      return null;
    }
  };

  const handleSend = async () => {
    if (!conversationId || !newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      await chatService.sendMessage(conversationId, content);
      // scroll to latest
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop();
        const ext = uri.split('.').pop();
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('chat-images')
          .upload(`${Date.now()}-${filename}`, {
            uri,
            type: `image/${ext}`,
            name: filename ?? 'image.jpg',
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('chat-images')
          .getPublicUrl(data.path);

        // Send message with image
        if (conversationId) {
          await chatService.sendMessage(
            conversationId,
            publicUrl,
            'image',
            { originalName: filename }
          );
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === user?.id;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}>
        {!isOwnMessage && item.sender?.avatar_url && (
          <Image
            source={{ uri: item.sender.avatar_url }}
            style={styles.avatar}
          />
        )}
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
          { backgroundColor: isOwnMessage ? themeColors.primary : themeColors.surface }
        ]}>
          <View
            style={[
              styles.bubbleTail,
              isOwnMessage ? styles.tailRight : styles.tailLeft,
              { backgroundColor: isOwnMessage ? themeColors.primary : themeColors.surface }
            ]}
          />
          {item.type === 'image' ? (
            <Image
              source={{ uri: item.content }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={[
              styles.messageText,
              { color: isOwnMessage ? '#fff' : themeColors.text }
            ]}>
              {item.content}
            </Text>
          )}
          <Text style={[
            styles.timestamp,
            { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : themeColors.textSecondary }
          ]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          Please log in to chat with {artistName}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={[styles.header, { backgroundColor: themeColors.surface }]}>
        <Ionicons name="chatbubble-ellipses" size={18} color={themeColors.primary} />
        <Text style={[styles.title, { color: themeColors.text, marginLeft: 8 }]}>
          Chat with {artistName}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onEndReachedThreshold={0.2}
        onEndReached={async () => {
          if (isLoadingMore || !hasMore || messages.length === 0 || !conversationId) return;
          setIsLoadingMore(true);
          try {
            const oldest = messages[messages.length - 1];
            const older = await chatService.getMessages(conversationId, {
              limit: 50,
              before: oldest.created_at,
            });
            setMessages(prev => [...prev, ...older]);
            setHasMore(older.length === 50);
          } finally {
            setIsLoadingMore(false);
          }
        }}
        ListFooterComponent={isLoadingMore ? (
          <View style={{ paddingVertical: 12 }}>
            <ActivityIndicator size="small" color={themeColors.primary} />
          </View>
        ) : null}
      />

      <View style={[styles.inputContainer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border, borderTopWidth: 1 }]}>
        <TouchableOpacity
          onPress={handleImageUpload}
          disabled={isUploading}
          style={styles.attachButton}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={themeColors.primary} />
          ) : (
            <Ionicons name="image" size={24} color={themeColors.primary} />
          )}
        </TouchableOpacity>
        
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: themeColors.background,
              color: themeColors.text,
              borderColor: themeColors.border,
            }
          ]}
          value={newMessage}
          onChangeText={(t) => {
            setNewMessage(t);
            setIsTyping(t.length > 0);
          }}
          onBlur={() => setIsTyping(false)}
          placeholder="Type a message..."
          placeholderTextColor={themeColors.textSecondary}
          multiline
        />
        
        <TouchableOpacity
          onPress={handleSend}
          disabled={!newMessage.trim()}
          style={[
            styles.sendButton,
            {
              backgroundColor: newMessage.trim()
                ? themeColors.primary
                : themeColors.textSecondary
            }
          ]}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
        {isTyping && (
          <View style={{ paddingHorizontal: 8 }}>
            <Text style={{ color: themeColors.textSecondary, fontSize: 12 }}>Typing…</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    // Android elevation
    elevation: 3,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    maxWidth: '80%',
    alignItems: 'flex-end',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  bubbleTail: {
    position: 'absolute',
    width: 10,
    height: 10,
    bottom: 2,
    transform: [{ rotate: '45deg' }],
  },
  tailLeft: {
    left: -4,
  },
  tailRight: {
    right: -4,
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 110,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
