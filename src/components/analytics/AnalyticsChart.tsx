import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface AnalyticsChartProps {
  title: string;
  data: DataPoint[];
  type: 'bar' | 'line' | 'pie';
  timeframe?: string;
  showTrend?: boolean;
  trendPercentage?: number;
}

export default function AnalyticsChart({
  title,
  data,
  type,
  timeframe,
  showTrend = false,
  trendPercentage = 0,
}: AnalyticsChartProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const maxValue = Math.max(...data.map(d => d.value));
  const chartWidth = screenWidth - 32 - 40; // Account for padding and margins

  const renderBarChart = () => (
    <View style={styles.barChart}>
      {data.map((item, index) => {
        const barHeight = (item.value / maxValue) * 120; // Max height of 120
        const barColor = item.color || themeColors.primary;
        
        return (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: barColor,
                  },
                ]}
              />
              <Text style={styles.barValue}>
                {item.value > 999 ? `${(item.value / 1000).toFixed(1)}k` : item.value}
              </Text>
            </View>
            <Text style={styles.barLabel} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const renderLineChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * chartWidth;
      const y = 120 - (item.value / maxValue) * 120; // Invert Y axis
      return { x, y, value: item.value };
    });

    return (
      <View style={styles.lineChart}>
        <View style={[styles.lineChartContainer, { width: chartWidth, height: 120 }]}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(percentage => (
            <View
              key={percentage}
              style={[
                styles.gridLine,
                {
                  top: (120 * percentage) / 100,
                  width: chartWidth,
                },
              ]}
            />
          ))}
          
          {/* Data points */}
          {points.map((point, index) => (
            <View key={index}>
              <View
                style={[
                  styles.dataPoint,
                  {
                    left: point.x - 4,
                    top: point.y - 4,
                  },
                ]}
              />
              {index < points.length - 1 && (
                <View
                  style={[
                    styles.lineSegment,
                    {
                      left: point.x,
                      top: point.y,
                      width: points[index + 1].x - point.x,
                      transform: [
                        {
                          rotate: `${Math.atan2(
                            points[index + 1].y - point.y,
                            points[index + 1].x - point.x
                          )}rad`,
                        },
                      ],
                    },
                  ]}
                />
              )}
            </View>
          ))}
        </View>
        
        <View style={styles.lineChartLabels}>
          {data.map((item, index) => (
            <Text key={index} style={styles.lineLabel}>
              {item.label}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let startAngle = 0;

    return (
      <View style={styles.pieChart}>
        <View style={styles.pieContainer}>
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (item.value / total) * 360;
            const color = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
            
            const slice = (
              <View
                key={index}
                style={[
                  styles.pieSlice,
                  {
                    backgroundColor: color,
                    transform: [{ rotate: `${startAngle}deg` }],
                  },
                ]}
              />
            );
            
            startAngle += angle;
            return slice;
          })}
          
          <View style={styles.pieCenter}>
            <Text style={styles.pieCenterText}>{total}</Text>
            <Text style={styles.pieCenterLabel}>Total</Text>
          </View>
        </View>
        
        <View style={styles.pieLegend}>
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            const color = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
            
            return (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
                <Text style={styles.legendValue}>{percentage}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      default:
        return renderBarChart();
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    timeframe: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    trendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    trendText: {
      fontSize: 14,
      fontWeight: '600',
    },
    trendPositive: {
      color: themeColors.success,
    },
    trendNegative: {
      color: themeColors.error,
    },
    chartContainer: {
      minHeight: 150,
    },
    barChart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
      height: 150,
      paddingHorizontal: 8,
    },
    barContainer: {
      alignItems: 'center',
      flex: 1,
      maxWidth: 60,
    },
    barWrapper: {
      alignItems: 'center',
      justifyContent: 'flex-end',
      height: 130,
      marginBottom: 8,
    },
    bar: {
      width: 24,
      borderRadius: 4,
      minHeight: 4,
    },
    barValue: {
      fontSize: 10,
      color: themeColors.text,
      marginTop: 4,
      fontWeight: '600',
    },
    barLabel: {
      fontSize: 10,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    lineChart: {
      height: 150,
    },
    lineChartContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    gridLine: {
      position: 'absolute',
      height: 1,
      backgroundColor: `${themeColors.border}50`,
    },
    dataPoint: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: themeColors.primary,
    },
    lineSegment: {
      position: 'absolute',
      height: 2,
      backgroundColor: themeColors.primary,
      transformOrigin: '0 50%',
    },
    lineChartLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    lineLabel: {
      fontSize: 10,
      color: themeColors.textSecondary,
      textAlign: 'center',
      flex: 1,
    },
    pieChart: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    pieContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      position: 'relative',
      overflow: 'hidden',
    },
    pieSlice: {
      position: 'absolute',
      width: 50,
      height: 100,
      left: 50,
      transformOrigin: '0 50%',
    },
    pieCenter: {
      position: 'absolute',
      top: 25,
      left: 25,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: themeColors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pieCenterText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    pieCenterLabel: {
      fontSize: 10,
      color: themeColors.textSecondary,
    },
    pieLegend: {
      flex: 1,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendLabel: {
      flex: 1,
      fontSize: 12,
      color: themeColors.text,
    },
    legendValue: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{title}</Text>
          {timeframe && (
            <Text style={styles.timeframe}>{timeframe}</Text>
          )}
        </View>
        
        {showTrend && (
          <View style={styles.trendContainer}>
            <Ionicons
              name={trendPercentage >= 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color={trendPercentage >= 0 ? themeColors.success : themeColors.error}
            />
            <Text style={[
              styles.trendText,
              trendPercentage >= 0 ? styles.trendPositive : styles.trendNegative
            ]}>
              {trendPercentage >= 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.chartContainer}>
        {renderChart()}
      </View>
    </View>
  );
}