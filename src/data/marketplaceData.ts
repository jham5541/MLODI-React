import { Product, SongProduct, AlbumProduct, VideoProduct, MerchProduct } from '../types/marketplace';

export const sampleSongs: SongProduct[] = [
  {
    id: 'song-1',
    title: 'Electric Dreams',
    artist: 'Luna Nova',
    artistId: 'artist-1',
    coverUrl: 'https://picsum.photos/300/300?random=1',
    price: 1.99,
    currency: 'USD',
    type: 'song',
    duration: 214,
    audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    album: 'Midnight Echoes',
    albumId: 'album-1',
    genre: 'Electronic',
    explicit: false,
    description: 'A captivating electronic track that takes you on a journey through digital landscapes.',
    categories: ['Electronic', 'Dance'],
    tags: ['synthwave', 'ambient', 'dreamy'],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    previewUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
  },
  {
    id: 'song-2',
    title: 'Neon Nights',
    artist: 'Cyber Punk',
    artistId: 'artist-2',
    coverUrl: 'https://picsum.photos/300/300?random=2',
    price: 2.49,
    currency: 'USD',
    type: 'song',
    duration: 198,
    audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    genre: 'Synthwave',
    explicit: true,
    description: 'High-energy synthwave anthem perfect for late-night drives.',
    categories: ['Synthwave', 'Retro'],
    tags: ['80s', 'cyberpunk', 'energetic'],
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    featured: true,
    onSale: true,
    originalPrice: 2.99
  },
  {
    id: 'song-3',
    title: 'Coffee Shop Blues',
    artist: 'Acoustic Soul',
    artistId: 'artist-3',
    coverUrl: 'https://picsum.photos/300/300?random=3',
    price: 1.49,
    currency: 'USD',
    type: 'song',
    duration: 267,
    audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    genre: 'Blues',
    explicit: false,
    description: 'Smooth acoustic blues with soulful lyrics about everyday life.',
    categories: ['Blues', 'Acoustic'],
    tags: ['chill', 'acoustic', 'soulful'],
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z'
  }
];

export const sampleAlbums: AlbumProduct[] = [
  {
    id: 'album-1',
    title: 'Midnight Echoes',
    artist: 'Luna Nova',
    artistId: 'artist-1',
    coverUrl: 'https://picsum.photos/400/400?random=10',
    price: 12.99,
    currency: 'USD',
    type: 'album',
    releaseDate: '2024-01-15',
    trackCount: 10,
    totalDuration: 2840, // in seconds
    songs: [sampleSongs[0]],
    genre: 'Electronic',
    explicit: false,
    description: 'A complete journey through electronic soundscapes and ambient textures.',
    categories: ['Electronic', 'Ambient'],
    tags: ['full-album', 'electronic', 'atmospheric'],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    featured: true
  },
  {
    id: 'album-2',
    title: 'Retro Future',
    artist: 'Cyber Punk',
    artistId: 'artist-2',
    coverUrl: 'https://picsum.photos/400/400?random=11',
    price: 15.99,
    currency: 'USD',
    type: 'album',
    releaseDate: '2024-01-10',
    trackCount: 12,
    totalDuration: 3120,
    songs: [sampleSongs[1]],
    genre: 'Synthwave',
    explicit: true,
    description: 'The definitive synthwave album that captures the essence of the 80s future.',
    categories: ['Synthwave', 'Retro'],
    tags: ['synthwave', '80s', 'cyberpunk'],
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z'
  }
];

export const sampleVideos: VideoProduct[] = [
  {
    id: 'video-1',
    title: 'Electric Dreams - Official Music Video',
    artist: 'Luna Nova',
    artistId: 'artist-1',
    coverUrl: 'https://picsum.photos/640/360?random=20',
    price: 3.99,
    currency: 'USD',
    type: 'video',
    duration: 214,
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    thumbnailUrl: 'https://picsum.photos/640/360?random=20',
    quality: 'FHD',
    genre: 'Electronic',
    explicit: false,
    description: 'Official music video featuring stunning visual effects and neon aesthetics.',
    categories: ['Music Video', 'Electronic'],
    tags: ['official', 'hd', 'visual-effects'],
    createdAt: '2024-01-16T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z'
  },
  {
    id: 'video-2',
    title: 'Behind the Scenes: Making of Retro Future',
    artist: 'Cyber Punk',
    artistId: 'artist-2',
    coverUrl: 'https://picsum.photos/640/360?random=21',
    price: 4.99,
    currency: 'USD',
    type: 'video',
    duration: 1820, // 30 minutes
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    thumbnailUrl: 'https://picsum.photos/640/360?random=21',
    quality: 'HD',
    genre: 'Documentary',
    explicit: false,
    description: 'Exclusive behind-the-scenes footage of the album creation process.',
    categories: ['Documentary', 'Behind the Scenes'],
    tags: ['exclusive', 'documentary', 'album-making'],
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z',
    featured: true
  }
];

export const sampleMerch: MerchProduct[] = [
  {
    id: 'merch-1',
    title: 'Luna Nova Tour T-Shirt',
    artist: 'Luna Nova',
    artistId: 'artist-1',
    coverUrl: 'https://picsum.photos/400/400?random=30',
    price: 24.99,
    currency: 'USD',
    type: 'merch',
    category: 'clothing',
    variants: [
      {
        id: 'variant-1',
        name: 'Small Black',
        price: 24.99,
        stock: 15,
        attributes: { size: 'S', color: 'Black' },
        sku: 'LN-TOUR-S-BK'
      },
      {
        id: 'variant-2',
        name: 'Medium Black',
        price: 24.99,
        stock: 22,
        attributes: { size: 'M', color: 'Black' },
        sku: 'LN-TOUR-M-BK'
      },
      {
        id: 'variant-3',
        name: 'Large White',
        price: 24.99,
        stock: 18,
        attributes: { size: 'L', color: 'White' },
        sku: 'LN-TOUR-L-WH'
      }
    ],
    images: [
      'https://picsum.photos/400/400?random=30',
      'https://picsum.photos/400/400?random=31',
      'https://picsum.photos/400/400?random=32'
    ],
    description: 'Official tour merchandise featuring the iconic Luna Nova logo.',
    categories: ['Clothing', 'Tour Merch'],
    tags: ['t-shirt', 'tour', 'official'],
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
    shipping: {
      weight: 0.2,
      dimensions: { length: 25, width: 20, height: 2 },
      freeShipping: false,
      estimatedDays: 5
    }
  },
  {
    id: 'merch-2',
    title: 'Cyber Punk Vinyl Collection',
    artist: 'Cyber Punk',
    artistId: 'artist-2',
    coverUrl: 'https://picsum.photos/400/400?random=40',
    price: 34.99,
    currency: 'USD',
    type: 'merch',
    category: 'vinyl',
    variants: [
      {
        id: 'variant-4',
        name: 'Limited Edition Purple',
        price: 39.99,
        stock: 5,
        attributes: { color: 'Purple', edition: 'Limited' },
        sku: 'CP-VINYL-LTD-PUR'
      },
      {
        id: 'variant-5',
        name: 'Standard Black',
        price: 34.99,
        stock: 50,
        attributes: { color: 'Black', edition: 'Standard' },
        sku: 'CP-VINYL-STD-BK'
      }
    ],
    images: [
      'https://picsum.photos/400/400?random=40',
      'https://picsum.photos/400/400?random=41'
    ],
    description: 'High-quality vinyl pressing of the complete Retro Future album.',
    categories: ['Vinyl', 'Collectibles'],
    tags: ['vinyl', 'collectible', 'album'],
    createdAt: '2024-01-18T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z',
    featured: true,
    shipping: {
      weight: 0.5,
      dimensions: { length: 32, width: 32, height: 3 },
      freeShipping: true,
      estimatedDays: 3
    }
  },
  {
    id: 'merch-3',
    title: 'Acoustic Soul Coffee Mug',
    artist: 'Acoustic Soul',
    artistId: 'artist-3',
    coverUrl: 'https://picsum.photos/400/400?random=50',
    price: 14.99,
    currency: 'USD',
    type: 'merch',
    category: 'accessories',
    variants: [
      {
        id: 'variant-6',
        name: 'White Ceramic',
        price: 14.99,
        stock: 30,
        attributes: { material: 'Ceramic', color: 'White' },
        sku: 'AS-MUG-CER-WH'
      }
    ],
    images: ['https://picsum.photos/400/400?random=50'],
    description: 'Perfect mug for enjoying your morning coffee while listening to blues.',
    categories: ['Accessories', 'Drinkware'],
    tags: ['mug', 'coffee', 'ceramic'],
    createdAt: '2024-01-22T00:00:00Z',
    updatedAt: '2024-01-22T00:00:00Z',
    onSale: true,
    originalPrice: 17.99,
    shipping: {
      weight: 0.4,
      dimensions: { length: 12, width: 12, height: 10 },
      freeShipping: false,
      estimatedDays: 7
    }
  }
];

export const allProducts: Product[] = [
  ...sampleSongs,
  ...sampleAlbums,
  ...sampleVideos,
  ...sampleMerch
];

export const featuredProducts = allProducts.filter(product => product.featured);

export const onSaleProducts = allProducts.filter(product => product.onSale);

export const productCategories = [
  'Electronic',
  'Synthwave',
  'Blues',
  'Acoustic',
  'Ambient',
  'Retro',
  'Dance',
  'Music Video',
  'Documentary',
  'Behind the Scenes',
  'Clothing',
  'Tour Merch',
  'Vinyl',
  'Collectibles',
  'Accessories',
  'Drinkware'
];