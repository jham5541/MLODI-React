import { supabase } from './databaseService';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'audio';
  metadata: any;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export interface Conversation {
  id: string;
  title: string | null;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  participants: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  }[];
  last_message?: Message;
}

class ChatService {
  async getConversations(): Promise<Conversation[]> {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_participants!inner (
          user_id,
          profiles (
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    // Transform the data to match our interface
    return conversations.map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      is_group: conv.is_group,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      participants: conv.conversation_participants.map((p: any) => ({
        user_id: p.user_id,
        username: p.profiles.username,
        display_name: p.profiles.display_name,
        avatar_url: p.profiles.avatar_url,
      })),
    }));
  }

  async getMessages(
    conversationId: string,
    options: { limit?: number; before?: string | null } = {}
  ): Promise<Message[]> {
    const { limit = 50, before = null } = options;

    let query = supabase
      .from('messages')
      .select(`
        *,
        profiles!sender_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    return (messages || []).map((msg: any) => ({
      ...msg,
      sender: {
        username: msg.profiles?.username,
        display_name: msg.profiles?.display_name,
        avatar_url: msg.profiles?.avatar_url,
      },
    }));
  }

  async sendMessage(conversationId: string, content: string, type: 'text' | 'image' | 'audio' = 'text', metadata = {}): Promise<Message> {
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content,
        type,
        metadata,
      })
      .select(`
        *,
        profiles!sender_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    return {
      ...message,
      sender: {
        username: message.profiles.username,
        display_name: message.profiles.display_name,
        avatar_url: message.profiles.avatar_url,
      },
    };
  }

  async getOrCreateDirectConversation(otherUserId: string): Promise<string> {
    const { data: conversationId, error } = await supabase
      .rpc('get_or_create_direct_conversation', {
        user2_id: otherUserId,
      });

    if (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }

    return conversationId;
  }

  async updateMessageStatus(messageId: string, isDeleted: boolean): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: isDeleted })
      .eq('id', messageId);

    if (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
  }

  async updateLastRead(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Error updating last read:', error);
      throw error;
    }
  }

  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data: message, error } = await supabase
            .from('messages')
            .select(`
              *,
              profiles!sender_id (
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && message) {
            callback({
              ...message,
              sender: {
                username: message.profiles?.username,
                display_name: message.profiles?.display_name,
                avatar_url: message.profiles?.avatar_url,
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // no-op
      }
    };
  }
}

export const chatService = new ChatService();
