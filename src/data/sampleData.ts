import { Song, Album, Artist, Playlist } from '../types/music';

export const sampleArtists: Artist[] = [
  {
    id: '1',
    name: 'Digital Dreams',
    coverUrl: 'https://picsum.photos/400/400?random=1',
    bio: 'Electronic music producer exploring the intersection of AI and human creativity.',
    genres: ['Electronic', 'Ambient', 'Synthwave'],
    followers: 12500,
    isVerified: true,
  },
  {
    id: '2',
    name: 'Neon Nights',
    coverUrl: 'https://picsum.photos/400/400?random=2',
    bio: 'Retro-futuristic beats for the modern soul.',
    genres: ['Synthwave', 'Retrowave', 'Electronic'],
    followers: 8300,
    isVerified: false,
  },
  {
    id: '3',
    name: 'Crypto Collective',
    coverUrl: 'https://picsum.photos/400/400?random=3',
    bio: 'Decentralized music collective pushing the boundaries of Web3 audio.',
    genres: ['Hip Hop', 'Electronic', 'Experimental'],
    followers: 15200,
    isVerified: true,
  },
];

export const sampleSongs: Song[] = [
  {
    id: '1',
    title: 'Blockchain Blues',
    artist: 'Digital Dreams',
    artistId: '1',
    album: 'Decentralized Sounds',
    coverUrl: 'https://picsum.photos/300/300?random=11',
    duration: 245,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    popularity: 85,
    supply: { total: 1000, available: 234 },
    tokenMetadata: {
      name: 'Blockchain Blues NFT',
      description: 'Exclusive audio NFT with royalty sharing',
      image: 'https://picsum.photos/300/300?random=11',
      attributes: [
        { trait_type: 'Genre', value: 'Electronic' },
        { trait_type: 'Rarity', value: 'Rare' },
        { trait_type: 'Royalty', value: '5%' },
      ],
    },
  },
  {
    id: '2',
    title: 'Neon Highway',
    artist: 'Neon Nights',
    artistId: '2',
    album: 'Retro Future',
    coverUrl: 'https://picsum.photos/300/300?random=12',
    duration: 198,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    popularity: 72,
    supply: { total: 500, available: 89 },
  },
  {
    id: '3',
    title: 'Decentralized Dreams',
    artist: 'Crypto Collective',
    artistId: '3',
    album: 'Web3 Chronicles',
    coverUrl: 'https://picsum.photos/300/300?random=13',
    duration: 289,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    popularity: 91,
    supply: { total: 2000, available: 1456 },
  },
  {
    id: '4',
    title: 'Smart Contract Symphony',
    artist: 'Digital Dreams',
    artistId: '1',
    album: 'Decentralized Sounds',
    coverUrl: 'https://picsum.photos/300/300?random=14',
    duration: 324,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    popularity: 78,
    supply: { total: 750, available: 321 },
  },
  {
    id: '5',
    title: 'Midnight Protocol',
    artist: 'Neon Nights',
    artistId: '2',
    album: 'Retro Future',
    coverUrl: 'https://picsum.photos/300/300?random=15',
    duration: 267,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    popularity: 65,
    supply: { total: 300, available: 45 },
  },
];

export const sampleAlbums: Album[] = [
  {
    id: '1',
    title: 'Decentralized Sounds',
    artist: 'Digital Dreams',
    artistId: '1',
    coverUrl: 'https://picsum.photos/400/400?random=21',
    releaseDate: '2024-01-15',
    songs: sampleSongs.filter(song => song.album === 'Decentralized Sounds'),
  },
  {
    id: '2',
    title: 'Retro Future',
    artist: 'Neon Nights',
    artistId: '2',
    coverUrl: 'https://picsum.photos/400/400?random=22',
    releaseDate: '2024-02-20',
    songs: sampleSongs.filter(song => song.album === 'Retro Future'),
  },
  {
    id: '3',
    title: 'Web3 Chronicles',
    artist: 'Crypto Collective',
    artistId: '3',
    coverUrl: 'https://picsum.photos/400/400?random=23',
    releaseDate: '2024-03-10',
    songs: sampleSongs.filter(song => song.album === 'Web3 Chronicles'),
  },
];

export const samplePlaylists: Playlist[] = [
  {
    id: '1',
    name: 'Web3 Vibes',
    description: 'The best tracks from the decentralized music world',
    coverUrl: 'https://picsum.photos/300/300?random=31',
    songs: [sampleSongs[0], sampleSongs[2], sampleSongs[3]],
    isPrivate: false,
    analytics: {
      totalPlays: 1250,
      uniqueListeners: 890,
      averageListenTime: 180,
      trend: 15,
    },
  },
  {
    id: '2',
    name: 'Synthwave Classics',
    description: 'Retro-futuristic beats for your coding sessions',
    coverUrl: 'https://picsum.photos/300/300?random=32',
    songs: [sampleSongs[1], sampleSongs[4]],
    isPrivate: false,
    analytics: {
      totalPlays: 890,
      uniqueListeners: 567,
      averageListenTime: 210,
      trend: 8,
    },
  },
  {
    id: '3',
    name: 'Crypto Beats',
    description: 'Music that makes you want to hodl',
    coverUrl: 'https://picsum.photos/300/300?random=33',
    songs: [sampleSongs[2], sampleSongs[0], sampleSongs[3]],
    isPrivate: false,
    collaborators: [
      { address: '0x1234...5678', isOwner: true, joinedAt: '2024-01-01' },
      { address: '0x8765...4321', isOwner: false, joinedAt: '2024-01-15' },
    ],
    analytics: {
      totalPlays: 2100,
      uniqueListeners: 1456,
      averageListenTime: 195,
      trend: 22,
    },
  },
];

export const trendingSongs = [...sampleSongs].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
export const newReleases = [...sampleSongs].sort((a, b) => new Date(b.album).getTime() - new Date(a.album).getTime());
export const popularArtists = [...sampleArtists].sort((a, b) => b.followers - a.followers);