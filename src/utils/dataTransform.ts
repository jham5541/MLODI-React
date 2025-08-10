import { Song as DBSong, Artist as DBArtist } from '../services/musicService';
import { Song, Artist } from '../types/music';

/**
 * Transform database song object to component-expected format
 */
export function transformSong(dbSong: DBSong): Song {
  return {
    id: dbSong.id,
    title: dbSong.title,
    artist: dbSong.artist?.name || 'Unknown Artist',
    artistId: dbSong.artist_id,
    album: dbSong.album?.title || 'Unknown Album',
    coverUrl: dbSong.cover_url || dbSong.album?.cover_url || 'https://via.placeholder.com/300x300?text=♪',
    duration: Math.floor((dbSong.duration_ms || 0) / 1000), // Convert ms to seconds
    audioUrl: dbSong.audio_url,
    tokenMetadata: dbSong.nft_token_address ? {
      name: dbSong.title,
      description: `NFT for ${dbSong.title}`,
      image: dbSong.cover_url || '',
      attributes: []
    } : undefined,
    supply: dbSong.nft_token_address ? {
      total: dbSong.nft_total_supply || 0,
      available: dbSong.nft_available_supply || 0
    } : undefined,
    popularity: dbSong.play_count || 0,
    isRadio: false
  };
}

/**
 * Transform database artist object to component-expected format
 */
export function transformArtist(dbArtist: DBArtist): Artist {
  return {
    id: dbArtist.id,
    name: dbArtist.name,
    coverUrl: dbArtist.cover_url || dbArtist.avatar_url || 'https://via.placeholder.com/300x300?text=♪',
    bio: dbArtist.bio,
    genres: dbArtist.genres || [],
    followers: dbArtist.followers_count || 0,
    isVerified: dbArtist.is_verified || false
  };
}

/**
 * Transform array of database songs to component format
 */
export function transformSongs(dbSongs: DBSong[]): Song[] {
  return dbSongs.map(transformSong);
}

/**
 * Transform array of database artists to component format
 */
export function transformArtists(dbArtists: DBArtist[]): Artist[] {
  return dbArtists.map(transformArtist);
}
