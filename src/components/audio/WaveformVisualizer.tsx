import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  PanGestureHandler,
  Dimensions,
  LayoutChangeEvent
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface WaveformData {
  peaks: number[];
  duration: number;
  sampleRate: number;
}

interface WaveformVisualizerProps {
  audioUrl: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  backgroundColor?: string;
  showPlayButton?: boolean;
  interactive?: boolean;
  style?: any;
}

export default function WaveformVisualizer({
  audioUrl,
  isPlaying,
  currentTime,
  duration,
  onSeek,
  onPlay,
  onPause,
  height = 80,
  waveColor,
  progressColor,
  backgroundColor,
  showPlayButton = true,
  interactive = true,
  style,
}: WaveformVisualizerProps) {
  const { colors } = useTheme();
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width - 32);
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const panGestureRef = useRef<any>();

  const finalWaveColor = waveColor || colors.textSecondary;
  const finalProgressColor = progressColor || colors.primary;
  const finalBackgroundColor = backgroundColor || colors.surface;

  useEffect(() => {
    loadWaveformData();
  }, [audioUrl]);

  useEffect(() => {
    // Animate progress based on current time
    if (duration > 0) {
      const progress = currentTime / duration;
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [currentTime, duration]);

  const loadWaveformData = async () => {
    setIsLoading(true);
    try {
      // Simulate loading waveform data
      // In a real implementation, you would:
      // 1. Load audio file
      // 2. Decode audio data
      // 3. Generate peaks array
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock waveform data
      const peaks = generateMockWaveform(200);
      setWaveformData({
        peaks,
        duration: duration || 180,
        sampleRate: 44100,
      });
    } catch (error) {
      console.error('Failed to load waveform:', error);
      // Generate fallback waveform
      const peaks = generateMockWaveform(200);
      setWaveformData({
        peaks,
        duration: duration || 180,
        sampleRate: 44100,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockWaveform = (samples: number): number[] => {
    const peaks: number[] = [];
    for (let i = 0; i < samples; i++) {
      // Generate realistic waveform pattern
      const base = Math.sin(i * 0.1) * 0.5;
      const noise = (Math.random() - 0.5) * 0.3;
      const envelope = Math.sin((i / samples) * Math.PI) * 0.8;
      const peak = Math.abs(base + noise) * envelope;
      peaks.push(Math.min(peak, 1));
    }
    return peaks;
  };

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width - (showPlayButton ? 60 : 0));
  };

  const handleWaveformPress = (event: any) => {
    if (!interactive || !waveformData || !onSeek) return;
    
    const { locationX } = event.nativeEvent;
    const progress = locationX / containerWidth;
    const seekTime = Math.max(0, Math.min(progress * duration, duration));
    onSeek(seekTime);
  };

  const renderWaveform = () => {
    if (!waveformData || containerWidth <= 0) return null;

    const barWidth = Math.max(1, containerWidth / waveformData.peaks.length);
    const progressWidth = (currentTime / duration) * containerWidth;

    return (
      <View style={[styles.waveformContainer, { height }]}>
        <Svg width={containerWidth} height={height} style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={finalWaveColor} stopOpacity="0.8" />
              <Stop offset="50%" stopColor={finalWaveColor} stopOpacity="0.6" />
              <Stop offset="100%" stopColor={finalWaveColor} stopOpacity="0.3" />
            </LinearGradient>
            <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={finalProgressColor} stopOpacity="1" />
              <Stop offset="50%" stopColor={finalProgressColor} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={finalProgressColor} stopOpacity="0.6" />
            </LinearGradient>
          </Defs>

          {/* Background bars */}
          {waveformData.peaks.map((peak, index) => {
            const x = index * barWidth;
            const barHeight = Math.max(2, peak * height * 0.8);
            const y = (height - barHeight) / 2;
            
            return (
              <Rect
                key={`bg-${index}`}
                x={x}
                y={y}
                width={Math.max(1, barWidth - 0.5)}
                height={barHeight}
                fill="url(#waveGradient)"
                rx={barWidth / 4}
              />
            );
          })}

          {/* Progress overlay */}
          <Rect
            x={0}
            y={0}
            width={progressWidth}
            height={height}
            fill="url(#progressGradient)"
            opacity={0.9}
          />

          {/* Progress indicator line */}
          <Rect
            x={progressWidth - 1}
            y={0}
            width={2}
            height={height}
            fill={finalProgressColor}
          />

          {/* Playhead circle */}
          {isPlaying && (
            <Circle
              cx={progressWidth}
              cy={height / 2}
              r={4}
              fill={finalProgressColor}
              opacity={0.8}
            />
          )}
        </Svg>

        {/* Loading overlay */}
        {isLoading && (
          <View style={[styles.loadingOverlay, { backgroundColor: finalBackgroundColor }]}>
            <View style={styles.loadingBars}>
              {Array.from({ length: 20 }).map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.loadingBar,
                    {
                      backgroundColor: finalWaveColor,
                      animationDelay: `${index * 100}ms`,
                      transform: [{
                        scaleY: animatedProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        })
                      }]
                    }
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading waveform...
            </Text>
          </View>
        )}
      </View>
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: finalBackgroundColor,
      borderRadius: 8,
      padding: 12,
      ...style,
    },
    playButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: finalProgressColor,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    waveformWrapper: {
      flex: 1,
      flexDirection: 'column',
    },
    waveformContainer: {
      position: 'relative',
      backgroundColor: 'transparent',
      borderRadius: 4,
      overflow: 'hidden',
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    timeText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'monospace',
    },
    currentTime: {
      color: finalProgressColor,
      fontWeight: '600',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 4,
    },
    loadingBars: {
      flexDirection: 'row',
      alignItems: 'center',
      height: '60%',
      gap: 2,
    },
    loadingBar: {
      width: 3,
      height: '100%',
      borderRadius: 1.5,
      opacity: 0.6,
    },
    loadingText: {
      fontSize: 11,
      marginTop: 8,
      fontWeight: '500',
    },
    interactiveArea: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  });

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      {showPlayButton && (
        <TouchableOpacity
          style={styles.playButton}
          onPress={isPlaying ? onPause : onPlay}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={18}
            color={colors.background}
          />
        </TouchableOpacity>
      )}

      <View style={styles.waveformWrapper}>
        <TouchableOpacity
          style={styles.waveformContainer}
          onPress={handleWaveformPress}
          disabled={!interactive}
          activeOpacity={interactive ? 0.8 : 1}
        >
          {renderWaveform()}
        </TouchableOpacity>

        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, styles.currentTime]}>
            {formatTime(currentTime)}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
}