import { supabase } from '../lib/supabase';

export interface PublicTour {
  tour_id: string;
  tour_name: string;
  tour_status: 'planned' | 'active' | 'completed' | 'cancelled';
  tour_start_date: string;
  tour_end_date: string;
  artist_id: string;
  artist_name: string;
  artist_avatar: string | null;
  artist_verified: boolean;
  total_shows: number;
  upcoming_shows: number;
  completed_shows: number;
  min_ticket_price: number | null;
  max_ticket_price: number | null;
}

export interface EventView {
  id: string;
  venue_name: string;
  city: string;
  state: string | null;
  event_date: string; // timestamptz
  start_time: string; // timestamptz
  total_capacity: number;
  tickets_sold: number;
  min_ticket_price: number | string | null;
}

export interface UpcomingShow extends PublicShow {
  // Inherits all fields from PublicShow
  // This view is pre-filtered for upcoming shows only
}

class ToursService {
  /**
   * Get all tours for a specific artist
   */
  async getArtistTours(artistId: string): Promise<PublicTour[]> {
    try {
      const { data, error } = await supabase
        .from('public_tours')
        .select('*')
        .eq('artist_id', artistId)
        .order('tour_start_date', { ascending: false });

      if (error) {
        console.error('Error fetching artist tours:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getArtistTours:', error);
      return [];
    }
  }

  /**
   * Get active tours for an artist
   */
  async getActiveArtistTours(artistId: string): Promise<PublicTour[]> {
    try {
      const { data, error } = await supabase
        .from('public_tours')
        .select('*')
        .eq('artist_id', artistId)
        .eq('tour_status', 'active')
        .order('tour_start_date', { ascending: true });

      if (error) {
        console.error('Error fetching active tours:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveArtistTours:', error);
      return [];
    }
  }

  /**
   * Get all shows for a specific tour
   */
  async getTourShows(tourId: string): Promise<PublicShow[]> {
    try {
      const { data, error } = await supabase
        .from('public_shows')
        .select('*')
        .eq('tour_id', tourId)
        .order('show_date', { ascending: true });

      if (error) {
        console.error('Error fetching tour shows:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTourShows:', error);
      return [];
    }
  }

  /**
   * Get all shows for a specific artist
   */
  async getArtistShows(artistId: string): Promise<PublicShow[]> {
    try {
      const { data, error } = await supabase
        .from('public_shows')
        .select('*')
        .eq('artist_id', artistId)
        .order('show_date', { ascending: true });

      if (error) {
        console.error('Error fetching artist shows:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getArtistShows:', error);
      return [];
    }
  }

  /**
   * Get upcoming shows for an artist
   */
  async getArtistUpcomingShows(artistId: string): Promise<EventView[]> {
    try {
      const { data, error } = await supabase
        .from('events_public_view')
        .select('id, venue_name, city, state, event_date, start_time, total_capacity, tickets_sold, min_ticket_price')
        .eq('artist_id', artistId)
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming shows:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getArtistUpcomingShows:', error);
      return [];
    }
  }

  /**
   * Get upcoming shows across all artists (for discovery)
   */
  async getAllUpcomingShows(limit: number = 20): Promise<UpcomingShow[]> {
    try {
      const { data, error } = await supabase
        .from('public_upcoming_shows')
        .select('*')
        .order('show_date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching all upcoming shows:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllUpcomingShows:', error);
      return [];
    }
  }

  /**
   * Get shows happening today
   */
  async getTodayShows(): Promise<PublicShow[]> {
    try {
      const { data, error } = await supabase
        .from('public_shows')
        .select('*')
        .eq('is_today', true)
        .eq('show_status', 'scheduled')
        .order('show_time', { ascending: true });

      if (error) {
        console.error('Error fetching today shows:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTodayShows:', error);
      return [];
    }
  }

  /**
   * Get shows happening this week
   */
  async getThisWeekShows(): Promise<PublicShow[]> {
    try {
      const { data, error } = await supabase
        .from('public_shows')
        .select('*')
        .eq('is_this_week', true)
        .eq('show_status', 'scheduled')
        .order('show_date', { ascending: true });

      if (error) {
        console.error('Error fetching this week shows:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getThisWeekShows:', error);
      return [];
    }
  }

  /**
   * Get a single show by ID
   */
  async getShow(showId: string): Promise<PublicShow | null> {
    try {
      const { data, error } = await supabase
        .from('public_shows')
        .select('*')
        .eq('show_id', showId)
        .single();

      if (error) {
        console.error('Error fetching show:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getShow:', error);
      return null;
    }
  }

  /**
   * Search shows by venue or city
   */
  async searchShows(query: string): Promise<PublicShow[]> {
    try {
      const { data, error } = await supabase
        .from('public_upcoming_shows')
        .select('*')
        .or(`venue_name.ilike.%${query}%,venue_location.ilike.%${query}%`)
        .order('show_date', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Error searching shows:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchShows:', error);
      return [];
    }
  }

  /**
   * Get shows by price range
   */
  async getShowsByPriceRange(minPrice: number, maxPrice: number): Promise<UpcomingShow[]> {
    try {
      const { data, error } = await supabase
        .from('public_upcoming_shows')
        .select('*')
        .gte('ticket_price', minPrice)
        .lte('ticket_price', maxPrice)
        .order('show_date', { ascending: true });

      if (error) {
        console.error('Error fetching shows by price:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getShowsByPriceRange:', error);
      return [];
    }
  }

  /**
   * Transform show data to component format
   */
  transformShowToDisplay(event: EventView): {
    id: string;
    venue: string;
    city: string;
    date: string;
    time: string;
    price: number;
    availableTickets: number;
  } {
    const dateSource = event.start_time ?? event.event_date;
    const dateStr = new Date(dateSource).toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric'
    });
    const timeStr = new Date(event.start_time ?? event.event_date).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit'
    });
    const priceNum = typeof event.min_ticket_price === 'string'
      ? parseFloat(event.min_ticket_price)
      : (event.min_ticket_price ?? 0);

    return {
      id: event.id,
      venue: event.venue_name,
      city: event.state ? `${event.city}, ${event.state}` : event.city,
      date: dateStr,
      time: timeStr,
      price: isNaN(priceNum) ? 0 : priceNum,
      availableTickets: Math.max((event.total_capacity ?? 0) - (event.tickets_sold ?? 0), 0)
    };
  }

  /**
   * Subscribe to real-time updates for shows
   */
  subscribeToShowUpdates(showId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`show:${showId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shows',
        filter: `id=eq.${showId}`
      }, callback)
      .subscribe();
  }

  /**
   * Subscribe to tour updates
   */
  subscribeToTourUpdates(tourId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`tour:${tourId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tours',
        filter: `id=eq.${tourId}`
      }, callback)
      .subscribe();
  }
}

export const toursService = new ToursService();
export default toursService;
