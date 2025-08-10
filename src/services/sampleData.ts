import { Tour, Show, Venue } from './tourService';

// Sample venues
export const sampleVenues: Venue[] = [
  {
    id: 'v1',
    name: 'Arena Stadium',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    capacity: 20000,
    latitude: 34.0522,
    longitude: -118.2437
  },
  {
    id: 'v2',
    name: 'Music Hall',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    capacity: 15000,
    latitude: 40.7128,
    longitude: -74.0060
  },
  {
    id: 'v3',
    name: 'Concert Palace',
    city: 'Miami',
    state: 'FL',
    country: 'USA',
    capacity: 18000,
    latitude: 25.7617,
    longitude: -80.1918
  },
  {
    id: 'v4',
    name: 'Mega Dome',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    capacity: 25000,
    latitude: 41.8781,
    longitude: -87.6298
  }
];

// Sample shows
export const sampleShows: Show[] = [
  {
    id: 's1',
    tour_id: 't1',
    venue_id: 'v1',
    date: '2025-09-15',
    doors_time: '18:00',
    start_time: '19:30',
    end_time: '23:00',
    status: 'scheduled',
    ticket_price: 89.99,
    tickets_sold: 15000,
    venue: sampleVenues[0]
  },
  {
    id: 's2',
    tour_id: 't1',
    venue_id: 'v2',
    date: '2025-09-18',
    doors_time: '18:30',
    start_time: '20:00',
    end_time: '23:30',
    status: 'scheduled',
    ticket_price: 99.99,
    tickets_sold: 12000,
    venue: sampleVenues[1]
  },
  {
    id: 's3',
    tour_id: 't1',
    venue_id: 'v3',
    date: '2025-09-21',
    doors_time: '18:00',
    start_time: '19:30',
    end_time: '23:00',
    status: 'scheduled',
    ticket_price: 79.99,
    tickets_sold: 14000,
    venue: sampleVenues[2]
  },
  {
    id: 's4',
    tour_id: 't1',
    venue_id: 'v4',
    date: '2025-09-24',
    doors_time: '18:30',
    start_time: '20:00',
    end_time: '23:30',
    status: 'scheduled',
    ticket_price: 94.99,
    tickets_sold: 20000,
    venue: sampleVenues[3]
  }
];

// Sample tours
export const sampleTours: Tour[] = [
  {
    id: 't1',
    artist_id: 'e1',
    name: 'World Tour 2025',
    description: 'A spectacular journey through music and light',
    start_date: '2025-09-15',
    end_date: '2025-09-24',
    status: 'upcoming',
    shows: sampleShows,
    total_shows: 4,
    total_tickets_sold: 61000,
    total_revenue: 5459400
  }
];
