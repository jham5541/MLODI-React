export interface TokenMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  coverUrl: string;
  duration: number;
  audioUrl: string;
  tokenMetadata?: TokenMetadata;
  supply?: {
    total: number;
    available: number;
  };
  popularity?: number;
  isRadio?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  coverUrl: string;
  releaseDate: string;
  songs: Song[];
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl: string;
  songs: Song[];
  isPrivate?: boolean;
  collaborators?: Array<{
    address: string;
    isOwner: boolean;
    joinedAt: string;
  }>;
  analytics?: {
    totalPlays: number;
    uniqueListeners: number;
    averageListenTime: number;
    trend: number;
  };
}

export interface Artist {
  id: string;
  name: string;
  coverUrl: string;
  bio?: string;
  genres: string[];
  followers: number;
  isVerified: boolean;
}
