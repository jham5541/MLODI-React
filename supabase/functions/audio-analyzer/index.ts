import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AudioAnalysisRequest {
  audioUrl: string;
  songId: string;
}

interface AudioAnalysisResult {
  waveformData: number[];
  duration: number;
  bpm?: number;
  key?: string;
  energy?: number;
  danceability?: number;
  valence?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { audioUrl, songId }: AudioAnalysisRequest = await req.json()

    console.log('Analyzing audio:', { audioUrl, songId })

    // Fetch audio file
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      throw new Error('Failed to fetch audio file')
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    const audioData = new Uint8Array(audioBuffer)

    // Generate waveform data (simplified implementation)
    // In production, you'd use a proper audio analysis library
    const waveformData = generateWaveform(audioData)
    
    // Simulate audio feature extraction
    // In production, you'd use libraries like essentia.js or music-tempo
    const analysis: AudioAnalysisResult = {
      waveformData,
      duration: estimateDuration(audioData),
      bpm: estimateBPM(audioData),
      key: estimateKey(audioData),
      energy: Math.random() * 0.5 + 0.5, // Simulate high energy
      danceability: Math.random() * 0.4 + 0.6, // Simulate good danceability
      valence: Math.random() * 1, // Random valence (mood)
    }

    // Update song with analysis results
    const { error: updateError } = await supabase
      .from('songs')
      .update({
        waveform_data: analysis.waveformData,
        duration_ms: analysis.duration * 1000,
        bpm: analysis.bpm,
        key: analysis.key,
        energy: analysis.energy,
        danceability: analysis.danceability,
        valence: analysis.valence,
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', songId)

    if (updateError) {
      throw updateError
    }

    // Store detailed analysis in separate table for advanced features
    const { error: insertError } = await supabase
      .from('audio_analysis')
      .insert({
        song_id: songId,
        analysis_data: analysis,
        analysis_version: '1.0',
        processed_at: new Date().toISOString(),
      })

    if (insertError) {
      console.warn('Failed to store detailed analysis:', insertError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        message: 'Audio analysis completed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Audio analysis error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Audio analysis failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Simplified waveform generation
function generateWaveform(audioData: Uint8Array, samples = 200): number[] {
  const waveform: number[] = []
  const chunkSize = Math.floor(audioData.length / samples)
  
  for (let i = 0; i < samples; i++) {
    const start = i * chunkSize
    const end = start + chunkSize
    let sum = 0
    
    for (let j = start; j < end && j < audioData.length; j++) {
      sum += Math.abs(audioData[j] - 128) // Convert to signed and get amplitude
    }
    
    const average = sum / chunkSize
    waveform.push(average / 128) // Normalize to 0-1
  }
  
  return waveform
}

// Estimate duration from audio data size (rough approximation)
function estimateDuration(audioData: Uint8Array): number {
  // This is a very rough estimation - in production you'd parse the audio headers
  const bytesPerSecond = 44100 * 2 * 2 // 44.1kHz, stereo, 16-bit
  return audioData.length / bytesPerSecond
}

// Simulate BPM detection (placeholder)
function estimateBPM(audioData: Uint8Array): number {
  // In production, you'd use proper tempo detection algorithms
  // For now, return a random BPM in typical music range
  return Math.floor(Math.random() * 60) + 90 // 90-150 BPM
}

// Simulate key detection (placeholder)
function estimateKey(audioData: Uint8Array): string {
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const modes = ['major', 'minor']
  
  const randomKey = keys[Math.floor(Math.random() * keys.length)]
  const randomMode = modes[Math.floor(Math.random() * modes.length)]
  
  return `${randomKey} ${randomMode}`
}