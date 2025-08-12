import { supabase } from './databaseService';
import { Song } from './musicService';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  owner_id: string;
  owner?: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  is_private: boolean;
  is_collaborative: boolean;
  tags: string[];
  mood?: string;
  genre?: string;
  total_tracks: number;
  total_duration_ms: number;
  play_count: number;
  like_count: number;
  share_count: number;
  created_at: string;
  updated_at: string;
}

export interface PlaylistCollaborator {
  id: string;
  playlist_id: string;
  user_id: string;
  user?: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions: {
    can_add: boolean;
    can_remove: boolean;
    can_reorder: boolean;
  };
  invited_by?: string;
  joined_at: string;
}

export interface PlaylistSong {
  id: string;
  playlist_id: string;
  song_id: string;
  song?: Song;
  position: number;
  added_by: string;
  added_by_user?: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  added_at: string;
}

export interface CreatePlaylistData {
  name: string;
  description?: string;
  cover_url?: string;
  is_private?: boolean;
  is_collaborative?: boolean;
  tags?: string[];
  mood?: string;
  genre?: string;
}

export interface UpdatePlaylistData {
  name?: string;
  description?: string;
  cover_url?: string;
  is_private?: boolean;
  is_collaborative?: boolean;
  tags?: string[];
  mood?: string;
  genre?: string;
}

class PlaylistService {
  // Playlist CRUD
  async createPlaylist(data: CreatePlaylistData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: playlist, error } = await supabase
      .from('playlists')
      .insert({
        ...data,
        owner_id: user.id,
        is_private: data.is_private ?? false,
        is_collaborative: data.is_collaborative ?? false,
        tags: data.tags ?? [],
      })
      .select()
      .single();

    if (error) throw error;

    // If collaborative, add owner as admin collaborator
    if (data.is_collaborative) {
      await supabase
        .from('playlist_collaborators')
        .insert({
          playlist_id: playlist.id,
          user_id: user.id,
          role: 'owner',
          permissions: {
            can_add: true,
            can_remove: true,
            can_reorder: true,
          },
        });
    }

    return playlist as Playlist;
  }

  async getPlaylists(options?: {
    limit?: number;
    offset?: number;
    owner_id?: string;
    include_owner?: boolean;
    include_collaborators?: boolean;
    is_collaborative?: boolean;
    search?: string;
    tags?: string[];
    mood?: string;
    genre?: string;
  }) {
    let query = supabase
      .from('playlists')
      .select('*');

    // Public playlists or user's own playlists
    const { data: { user } } = await supabase.auth.getUser();
    if (options?.owner_id) {
      query = query.eq('owner_id', options.owner_id);
    } else if (user) {
      query = query.or(`is_private.eq.false,owner_id.eq.${user.id}`);
    } else {
      query = query.eq('is_private', false);
    }

    if (options?.is_collaborative !== undefined) {
      query = query.eq('is_collaborative', options.is_collaborative);
    }

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    if (options?.tags && options.tags.length > 0) {
      query = query.overlaps('tags', options.tags);
    }

    if (options?.mood) {
      query = query.eq('mood', options.mood);
    }

    if (options?.genre) {
      query = query.eq('genre', options.genre);
    }

    query = query.order('updated_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Fetch owner information if requested
    if (options?.include_owner && data && data.length > 0) {
      const ownerIds = [...new Set(data.map(p => p.owner_id))];
      const { data: owners } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', ownerIds);
      
      if (owners) {
        const ownerMap = new Map(owners.map(o => [o.id, o]));
        data.forEach(playlist => {
          playlist.owner = ownerMap.get(playlist.owner_id);
        });
      }
    }
    
    return data as Playlist[];
  }

  async getPlaylist(id: string, includeDetails = true) {
    const { data, error } = await supabase
      .from('playlists_public_view')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Fetch owner details if requested
    if (includeDetails && data) {
      const { data: owner } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', data.owner_id)
        .single();
      
      if (owner) {
        data.owner = owner;
      }
    }
    
    return data as Playlist;
  }

  async updatePlaylist(id: string, data: UpdatePlaylistData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user has permission to update
    const { data: playlist } = await supabase
      .from('playlists_public_view')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!playlist || playlist.owner_id !== user.id) {
      throw new Error('Not authorized to update this playlist');
    }

    const { data: updatedPlaylist, error } = await supabase
      .from('playlists')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updatedPlaylist as Playlist;
  }

  async deletePlaylist(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) throw error;
  }

  // Playlist songs management
  async getPlaylistSongs(playlistId: string) {
    const { data, error } = await supabase
      .from('playlist_songs')
      .select(`
        *,
        songs(*, artists(*)),
        user_profiles:added_by(id, username, display_name, avatar_url)
      `)
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data as PlaylistSong[];
  }

  async addSongToPlaylist(playlistId: string, songId: string, position?: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user has permission to add songs
    const hasPermission = await this.checkPlaylistPermission(playlistId, 'can_add');
    if (!hasPermission) {
      throw new Error('Not authorized to add songs to this playlist');
    }

    // Get next position if not specified
    if (position === undefined) {
      const { data: lastSong } = await supabase
        .from('playlist_songs')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      position = (lastSong?.position ?? -1) + 1;
    }

    // Insert song
    const { data, error } = await supabase
      .from('playlist_songs')
      .insert({
        playlist_id: playlistId,
        song_id: songId,
        position,
        added_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Update playlist totals
    await this.updatePlaylistTotals(playlistId);

    return data as PlaylistSong;
  }

  async removeSongFromPlaylist(playlistId: string, songId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user has permission or is the one who added the song
    const { data: playlistSong } = await supabase
      .from('playlist_songs')
      .select('added_by')
      .eq('playlist_id', playlistId)
      .eq('song_id', songId)
      .single();

    const hasPermission = await this.checkPlaylistPermission(playlistId, 'can_remove');
    const isAdder = playlistSong?.added_by === user.id;

    if (!hasPermission && !isAdder) {
      throw new Error('Not authorized to remove this song');
    }

    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('song_id', songId);

    if (error) throw error;

    // Update playlist totals
    await this.updatePlaylistTotals(playlistId);
  }

  async reorderPlaylistSongs(playlistId: string, songMoves: { songId: string; newPosition: number }[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user has permission to reorder
    const hasPermission = await this.checkPlaylistPermission(playlistId, 'can_reorder');
    if (!hasPermission) {
      throw new Error('Not authorized to reorder songs in this playlist');
    }

    // Update positions
    for (const move of songMoves) {
      await supabase
        .from('playlist_songs')
        .update({ position: move.newPosition })
        .eq('playlist_id', playlistId)
        .eq('song_id', move.songId);
    }
  }

  // Collaboration
  async getPlaylistCollaborators(playlistId: string) {
    const { data, error } = await supabase
      .from('playlist_collaborators')
      .select(`
        *,
        user_profiles:user_id(id, username, display_name, avatar_url)
      `)
      .eq('playlist_id', playlistId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data as PlaylistCollaborator[];
  }

  async inviteCollaborator(
    playlistId: string,
    userIdOrAddress: string,
    role: 'admin' | 'editor' | 'viewer' = 'editor',
    permissions?: Partial<PlaylistCollaborator['permissions']>
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user is owner or admin
    const { data: userRole } = await supabase
      .from('playlist_collaborators')
      .select('role')
      .eq('playlist_id', playlistId)
      .eq('user_id', user.id)
      .single();

    const { data: playlist } = await supabase
      .from('playlists')
      .select('owner_id')
      .eq('id', playlistId)
      .single();

    if (!playlist || (playlist.owner_id !== user.id && userRole?.role !== 'admin')) {
      throw new Error('Not authorized to invite collaborators');
    }

    // Default permissions based on role
    const defaultPermissions = {
      viewer: { can_add: false, can_remove: false, can_reorder: false },
      editor: { can_add: true, can_remove: false, can_reorder: true },
      admin: { can_add: true, can_remove: true, can_reorder: true },
    };

    const finalPermissions = {
      ...defaultPermissions[role],
      ...permissions,
    };

    // Try to find user by wallet address first, then by user ID
    let userId = userIdOrAddress;
    if (userIdOrAddress.startsWith('0x')) {
      // TODO: Implement wallet address to user ID mapping
      // For now, throw error if wallet address is provided
      throw new Error('Wallet address lookup not implemented yet');
    }

    const { data, error } = await supabase
      .from('playlist_collaborators')
      .insert({
        playlist_id: playlistId,
        user_id: userId,
        role,
        permissions: finalPermissions,
        invited_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PlaylistCollaborator;
  }

  async removeCollaborator(playlistId: string, userId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user is owner or admin, or removing themselves
    const { data: userRole } = await supabase
      .from('playlist_collaborators')
      .select('role')
      .eq('playlist_id', playlistId)
      .eq('user_id', user.id)
      .single();

    const { data: playlist } = await supabase
      .from('playlists_public_view')
      .select('owner_id')
      .eq('id', playlistId)
      .single();

    const isOwner = playlist?.owner_id === user.id;
    const isAdmin = userRole?.role === 'admin';
    const isRemovingSelf = userId === user.id;

    if (!isOwner && !isAdmin && !isRemovingSelf) {
      throw new Error('Not authorized to remove this collaborator');
    }

    const { error } = await supabase
      .from('playlist_collaborators')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async updateCollaboratorRole(
    playlistId: string,
    userId: string,
    role: 'admin' | 'editor' | 'viewer',
    permissions?: Partial<PlaylistCollaborator['permissions']>
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user is owner or admin
    const { data: userRole } = await supabase
      .from('playlist_collaborators')
      .select('role')
      .eq('playlist_id', playlistId)
      .eq('user_id', user.id)
      .single();

    const { data: playlist } = await supabase
      .from('playlists')
      .select('owner_id')
      .eq('id', playlistId)
      .single();

    if (!playlist || (playlist.owner_id !== user.id && userRole?.role !== 'admin')) {
      throw new Error('Not authorized to update collaborator roles');
    }

    const updateData: any = { role };
    if (permissions) {
      updateData.permissions = permissions;
    }

    const { error } = await supabase
      .from('playlist_collaborators')
      .update(updateData)
      .eq('playlist_id', playlistId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // User playlist interactions
  async likePlaylist(playlistId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_likes')
      .insert({
        user_id: user.id,
        liked_type: 'playlist',
        liked_id: playlistId,
      });

    if (error) throw error;
  }

  async unlikePlaylist(playlistId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('liked_type', 'playlist')
      .eq('liked_id', playlistId);

    if (error) throw error;
  }

  async getLikedPlaylists() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_likes')
      .select(`
        liked_id,
        playlists:liked_id (*, user_profiles:owner_id(id, username, display_name, avatar_url))
      `)
      .eq('user_id', user.id)
      .eq('liked_type', 'playlist')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(item => item.playlists) as Playlist[];
  }

  async getFeaturedPlaylists(options?: {
    limit?: number;
    offset?: number;
    timeWindow?: string; // e.g. '7 days', '30 days', etc.
  }) {
    const { data } = await this.queryFromFunction('get_featured_playlists', {
      p_limit: options?.limit || 10,
      p_offset: options?.offset || 0,
      p_time_window: options?.timeWindow || '7 days'
    });

    // If we want to include owner details, we need to fetch them separately
    if (data && data.length > 0) {
      const ownerIds = [...new Set(data.map(p => p.owner_id))];
      const { data: owners } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', ownerIds);
      
      if (owners) {
        const ownerMap = new Map(owners.map(o => [o.id, o]));
        data.forEach(playlist => {
          playlist.owner = ownerMap.get(playlist.owner_id);
        });
      }
    }

    return data as (Playlist & { feature_score: number })[]; 
  }

  async isPlaylistLiked(playlistId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('liked_type', 'playlist')
      .eq('liked_id', playlistId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  // Helper methods
  private async checkPlaylistPermission(playlistId: string, permission: keyof PlaylistCollaborator['permissions']) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if user is owner
    const { data: playlist } = await supabase
      .from('playlists')
      .select('owner_id')
      .eq('id', playlistId)
      .single();

    if (playlist?.owner_id === user.id) return true;

    // Check collaborator permissions
    const { data: collaborator } = await supabase
      .from('playlist_collaborators')
      .select('permissions')
      .eq('playlist_id', playlistId)
      .eq('user_id', user.id)
      .single();

    return collaborator?.permissions?.[permission] ?? false;
  }

  private async updatePlaylistTotals(playlistId: string) {
    // Get all songs in playlist
    const { data: songs } = await supabase
      .from('playlist_songs')
      .select('songs(duration_ms)')
      .eq('playlist_id', playlistId);

    if (!songs) return;

    const totalTracks = songs.length;
    const totalDuration = songs.reduce((sum, item) => sum + (item.songs?.duration_ms || 0), 0);

    await supabase
      .from('playlists')
      .update({
        total_tracks: totalTracks,
        total_duration_ms: totalDuration,
      })
      .eq('id', playlistId);
  }

  // Real-time subscriptions
  subscribeToPlaylist(playlistId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`playlist:${playlistId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'playlist_songs',
          filter: `playlist_id=eq.${playlistId}`,
        },
        callback
      )
      .subscribe();
  }

  async queryFromFunction(functionName: string, params: any) {
    try {
      const { data, error } = await supabase
        .rpc(functionName, params);

      if (error) {
        console.error(`Error querying function ${functionName}:`, error);
        throw error;
      }

      return { data };
    } catch (err) {
      console.error(`Error querying function ${functionName}:`, err);
      throw err;
    }
  }

  subscribeToCollaborators(playlistId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`collaborators:${playlistId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'playlist_collaborators',
          filter: `playlist_id=eq.${playlistId}`,
        },
        callback
      )
      .subscribe();
  }
}

export const playlistService = new PlaylistService();