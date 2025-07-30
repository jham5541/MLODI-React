import { Song as UISong, Artist as UIArtist, Album as UIAlbum } from '../types/music';
import { Song as DBSong, Artist as DBArtist, Album as DBAlbum } from '../services/musicService';

export function mapDBSongToUI(dbSong: DBSong): UISong {
  return {
    id: dbSong.id,
    title: dbSong.title,
    artist: dbSong.artist?.name || 'Unknown Artist',
    artistId: dbSong.artist_id,
    album: dbSong.album?.title || 'Unknown Album',
    coverUrl: dbSong.cover_url || dbSong.album?.cover_url || '',
    duration: Math.floor(dbSong.duration_ms / 1000), // Convert ms to seconds
    audioUrl: dbSong.audio_url,
    popularity: dbSong.play_count,
    isRadio: false,
    tokenMetadata: dbSong.nft_token_address ? {
      name: dbSong.title,
      description: `NFT for ${dbSong.title}`,
      image: dbSong.cover_url || '',
      attributes: [
        { trait_type: 'Artist', value: dbSong.artist?.name || 'Unknown' },
        { trait_type: 'Genre', value: dbSong.genre || 'Unknown' },
      ]
    } : undefined,
    supply: dbSong.nft_token_address ? {
      total: dbSong.nft_total_supply,
      available: dbSong.nft_available_supply,
    } : undefined,
  };
}

export function mapDBArtistToUI(dbArtist: DBArtist): UIArtist {
  return {
    id: dbArtist.id,
    name: dbArtist.name,
    coverUrl: dbArtist.avatar_url || dbArtist.cover_url || '',
    bio: dbArtist.bio,
    genres: dbArtist.genres,
    followers: dbArtist.followers_count,
    isVerified: dbArtist.is_verified,
  };
}

export function mapDBAlbumToUI(dbAlbum: DBAlbum, songs: DBSong[] = []): UIAlbum {
  return {
    id: dbAlbum.id,
    title: dbAlbum.title,
    artist: dbAlbum.artist?.name || 'Unknown Artist',
    artistId: dbAlbum.artist_id,
    coverUrl: dbAlbum.cover_url || '',
    releaseDate: dbAlbum.release_date || new Date().toISOString(),
    songs: songs.map(mapDBSongToUI),
  };
}

// Batch mappers
export function mapDBSongsToUI(dbSongs: DBSong[]): UISong[] {
  return dbSongs.map(mapDBSongToUI);
}

export function mapDBArtistsToUI(dbArtists: DBArtist[]): UIArtist[] {
  return dbArtists.map(mapDBArtistToUI);
}

export function mapDBAlbumsToUI(dbAlbums: DBAlbum[]): UIAlbum[] {
  return dbAlbums.map(album => mapDBAlbumToUI(album));
}
