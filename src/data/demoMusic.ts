import { Song } from '../types/music';

export const demoSongs: Song[] = [
  {
    id: 'demo-1',
    title: 'Jerz Girl',
    artist: 'Demo Artist',
    artistId: 'demo-artist-1',
    album: 'Demo Album',
    coverUrl: 'https://picsum.photos/seed/song1/300/300', // Unique placeholder for each song
    duration: 180,
    audioUrl: require('../assets/demo-music/jerz grl.wav'),
    isRadio: false,
    popularity: 95, // High popularity for demo
  },
  {
    id: 'demo-2',
    title: 'Summer Vibes',
    artist: 'Demo Artist',
    artistId: 'demo-artist-1',
    album: 'Demo Album',
    coverUrl: 'https://picsum.photos/seed/song2/300/300',
    duration: 210,
    audioUrl: require('../assets/demo-music/jerz grl.wav'), // Using same audio for demo
    isRadio: false,
    popularity: 88,
  },
  {
    id: 'demo-3',
    title: 'Late Night Drive',
    artist: 'Demo Artist',
    artistId: 'demo-artist-1',
    album: 'Night Vibes',
    coverUrl: 'https://picsum.photos/seed/song3/300/300',
    duration: 195,
    audioUrl: require('../assets/demo-music/jerz grl.wav'),
    isRadio: false,
    popularity: 82,
  },
  {
    id: 'demo-4',
    title: 'City Lights',
    artist: 'Demo Artist',
    artistId: 'demo-artist-1',
    album: 'Night Vibes',
    coverUrl: 'https://picsum.photos/seed/song4/300/300',
    duration: 225,
    audioUrl: require('../assets/demo-music/jerz grl.wav'),
    isRadio: false,
    popularity: 78,
  },
  {
    id: 'demo-5',
    title: 'Ocean Breeze',
    artist: 'Demo Artist',
    artistId: 'demo-artist-1',
    album: 'Summer Collection',
    coverUrl: 'https://picsum.photos/seed/song5/300/300',
    duration: 190,
    audioUrl: require('../assets/demo-music/jerz grl.wav'),
    isRadio: false,
    popularity: 75,
  },
];

export const demoArtists = [
  {
    id: 'demo-artist-1',
    name: 'Demo Artist',
    profilePicture: 'https://picsum.photos/seed/artist1/300/300',
    coverUrl: 'https://picsum.photos/seed/artist1cover/1200/400',
    bio: 'Rising star in the music industry, known for blending modern pop with R&B influences. With chart-topping hits and a unique sound, Demo Artist has quickly become one of the most streamed artists of the year.',
    genres: ['Pop', 'R&B', 'Alternative'],
    monthlyListeners: 1500000,
    followers: 850000,
    totalPlays: 25000000,
    popularSongs: ['demo-1', 'demo-2', 'demo-3', 'demo-4', 'demo-5'],
    albums: [
      {
        id: 'album-1',
        title: 'Demo Album',
        coverUrl: 'https://picsum.photos/seed/album1/300/300',
        releaseDate: '2025-01-15',
        songCount: 12,
      },
      {
        id: 'album-2',
        title: 'Night Vibes',
        coverUrl: 'https://picsum.photos/seed/album2/300/300',
        releaseDate: '2024-08-30',
        songCount: 8,
      },
      {
        id: 'album-3',
        title: 'Summer Collection',
        coverUrl: 'https://picsum.photos/seed/album3/300/300',
        releaseDate: '2024-06-01',
        songCount: 10,
      },
    ],
    isVerified: true,
  },
];
