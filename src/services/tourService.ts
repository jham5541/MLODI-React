import { supabase } from '../lib/supabase';

export interface Venue {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  capacity: number;
  latitude?: number;
  longitude?: number;
}

export interface Show {
  id: string;
  tour_id: string;
  venue_id: string;
  date: string;
  doors_time: string;
  start_time: string;
  end_time?: string;
  status: 'scheduled' | 'cancelled' | 'postponed' | 'completed';
  ticket_price: number;
  tickets_sold: number;
  venue: Venue;
}

export interface Tour {
  id: string;
  artist_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  shows: Show[];
  total_shows: number;
  total_tickets_sold: number;
  total_revenue: number;
}

import { sampleTours } from './sampleData';

export const tourService = {
  async getTours(artistId: string): Promise<Tour[]> {
    try {
      const { data, error } = await supabase
        .from('tours')
        .select(`
          *,
          shows:shows(
            *,
            venue:venues(*)
          )
        `)
        .eq('artist_id', artistId)
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      
      return data?.map(tour => ({
        ...tour,
        shows: tour.shows.map(show => ({
          ...show,
          venue: show.venue
        })),
        total_shows: tour.shows.length,
        total_tickets_sold: tour.shows.reduce((acc, show) => acc + show.tickets_sold, 0),
        total_revenue: tour.shows.reduce((acc, show) => acc + (show.tickets_sold * show.ticket_price), 0)
      })) || [];
    } catch (error) {
      console.log('Using sample tour data for artist:', artistId);
      return sampleTours.filter(tour => tour.artist_id === artistId);
    }
  },

  async createTour(tour: Omit<Tour, 'id' | 'shows' | 'total_shows' | 'total_tickets_sold' | 'total_revenue'>): Promise<Tour> {
    const { data, error } = await supabase
      .from('tours')
      .insert(tour)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      shows: [],
      total_shows: 0,
      total_tickets_sold: 0,
      total_revenue: 0
    };
  },

  async updateTour(tourId: string, updates: Partial<Tour>): Promise<void> {
    const { error } = await supabase
      .from('tours')
      .update(updates)
      .eq('id', tourId);
    
    if (error) throw error;
  },

  async deleteTour(tourId: string): Promise<void> {
    const { error } = await supabase
      .from('tours')
      .delete()
      .eq('id', tourId);
    
    if (error) throw error;
  },

  async addShow(show: Omit<Show, 'id' | 'venue'>): Promise<Show> {
    const { data, error } = await supabase
      .from('shows')
      .insert(show)
      .select(`
        *,
        venue:venues(*)
      `)
      .single();
    
    if (error) throw error;
    return {
      ...data,
      venue: data.venue
    };
  },

  async updateShow(showId: string, updates: Partial<Show>): Promise<void> {
    const { error } = await supabase
      .from('shows')
      .update(updates)
      .eq('id', showId);
    
    if (error) throw error;
  },

  async deleteShow(showId: string): Promise<void> {
    const { error } = await supabase
      .from('shows')
      .delete()
      .eq('id', showId);
    
    if (error) throw error;
  },

  async getVenues(search?: string): Promise<Venue[]> {
    let query = supabase
      .from('venues')
      .select('*')
      .order('name');
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createVenue(venue: Omit<Venue, 'id'>): Promise<Venue> {
    const { data, error } = await supabase
      .from('venues')
      .insert(venue)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  subscribeToTourUpdates(tourId: string, callback: () => void) {
    return supabase
      .channel(`tour:${tourId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tours',
        filter: `id=eq.${tourId}`
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shows',
        filter: `tour_id=eq.${tourId}`
      }, callback)
      .subscribe();
  }
};

export default tourService;
