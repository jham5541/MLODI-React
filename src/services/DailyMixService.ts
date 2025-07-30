import { supabase } from '../lib/supabase/client';
import MLServiceLite from './ml/MLServiceLite';
import { TrackRecommendation, UserClusterType, EmergingArtist, RecommendationReason, UserListeningProfile } from './ml/types';

interface DailyMix {
    mix_id: string;
    tracks: TrackRecommendation[];
    metadata: any;
}

export class DailyMixService {
    private static instance: DailyMixService;
    private mlService = MLServiceLite.getInstance();

    private constructor() {}

    static getInstance(): DailyMixService {
        if (!DailyMixService.instance) {
            DailyMixService.instance = new DailyMixService();
        }
        return DailyMixService.instance;
    }

    // Generate a daily mix for the user
    async generateDailyMix(userId: string, mixType: string, limit: number = 30): Promise<DailyMix> {
        try {
            switch (mixType) {
                case 'tempo':
                    return this.generateTempoMix(userId, limit);
                case 'key_harmony':
                    return this.generateKeyHarmonyMix(userId, limit);
                default:
                    throw new Error('Unsupported mix type');
            }
        } catch (error) {
            console.error('Error generating daily mix:', error);
            throw error;
        }
    }

    // Generate a tempo-based mix
    private async generateTempoMix(userId: string, limit: number): Promise<DailyMix> {
        const tracks = await supabase
            .rpc('generate_tempo_flow_mix', {
                p_user_id: userId,
                p_mix_length: limit,
            });

        return {
            mix_id: 'tempo-mix',
            tracks: tracks.data || [],
            metadata: { type: 'tempo', length: limit },
        };
    }

    // Generate a key harmony-based mix
    private async generateKeyHarmonyMix(userId: string, limit: number): Promise<DailyMix> {
        const userProfile = await this.getUserProfile(userId);

        // Select random key from user's preferences
        const preferredKeys = userProfile.preferred_keys || [];
        const targetKey = preferredKeys[Math.floor(Math.random() * preferredKeys.length)] || 0;

        const tracks = await supabase
            .rpc('get_key_compatible_tracks', {
                target_key: targetKey,
                mode: 1,
                limit_count: limit,
            });

        return {
            mix_id: 'key-harmony-mix',
            tracks: tracks.data || [],
            metadata: { type: 'key_harmony', key: targetKey, length: limit },
        };
    }

    private async getUserProfile(userId: string): Promise<UserListeningProfile> {
        const { data: profile } = await supabase
            .from('user_music_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (profile) {
            return {
                userId,
                topGenres: [],
                topArtists: [],
                avgTempo: 120,
                avgEnergy: 0.7,
                avgValence: 0.6,
                listeningTimeDistribution: {},
                totalListeningTime: 0,
                uniqueTracks: 0,
                repeatListens: {},
                preferred_keys: profile.preferred_keys || []
            };
        }
        return this.createDefaultProfile(userId);
    }

    private createDefaultProfile(userId: string): UserListeningProfile {
        return {
            userId,
            topGenres: ['pop', 'rock', 'hip-hop'],
            topArtists: [],
            avgTempo: 120,
            avgEnergy: 0.7,
            avgValence: 0.6,
            listeningTimeDistribution: {},
            totalListeningTime: 0,
            uniqueTracks: 0,
            repeatListens: {},
            preferred_keys: [0, 2, 4, 5, 7, 9, 11]
        };
    }
}

export default DailyMixService.getInstance();

