import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface Ticket {
  id: string;
  qrCode: string;
  seatInfo?: string;
}

interface TicketViewModalProps {
  visible: boolean;
  onClose: () => void;
  venue: string;
  city: string;
  date: string;
  time: string;
  tickets: Ticket[];
}

export default function TicketViewModal({
  visible,
  onClose,
  venue,
  city,
  date,
  time,
  tickets,
}: TicketViewModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentTicketIndex(viewableItems[0].index || 0);
    }
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 200,
  };

  const ITEM_WIDTH = screenWidth; // Full width for each ticket page

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  };

  // Generate a sophisticated QR-like pattern for display
  const generateQRPattern = (seed: string) => {
    const gridSize = 21; // Standard QR code size
    const pattern = [];
    let hash = 0;
    
    // Create a more complex hash from the seed
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Generate pattern with finder patterns (corner squares)
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const index = row * gridSize + col;
        
        // Add finder patterns in corners (7x7 squares)
        const isFinderPattern = 
          (row < 7 && col < 7) || // Top-left
          (row < 7 && col >= gridSize - 7) || // Top-right
          (row >= gridSize - 7 && col < 7); // Bottom-left
        
        if (isFinderPattern) {
          const relRow = row < 7 ? row : row - (gridSize - 7);
          const relCol = col < 7 ? col : col >= gridSize - 7 ? col - (gridSize - 7) : col;
          
          // Create finder pattern (hollow square with center dot)
          const isOuterRing = relRow === 0 || relRow === 6 || relCol === 0 || relCol === 6;
          const isInnerRing = relRow === 1 || relRow === 5 || relCol === 1 || relCol === 5;
          const isCenterBlock = relRow >= 2 && relRow <= 4 && relCol >= 2 && relCol <= 4;
          
          pattern.push(isOuterRing || isCenterBlock);
        } else {
          // Generate data pattern for other areas
          const value = (hash + index * 17 + row * 31 + col * 13) % 5;
          pattern.push(value > 2);
        }
      }
    }
    
    return pattern;
  };

  const renderQRCode = (qrCode: string) => {
    const pattern = generateQRPattern(qrCode);
    const gridSize = 21;
    const cellSize = 5;
    const totalSize = gridSize * cellSize;
    
    return (
      <View style={styles.qrCodeWrapper}>
        {/* Subtle glow effect */}
        <View style={[styles.qrGlow, { 
          width: totalSize + 24, 
          height: totalSize + 24,
        }]} />
        
        {/* Main QR code */}
        <View style={[styles.qrGrid, { 
          width: totalSize, 
          height: totalSize 
        }]}>
          {pattern.map((filled, index) => {
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;
            
            return (
              <View
                key={`qr-${qrCode}-${index}`}
                style={[
                  styles.qrCell,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: filled ? '#000000' : 'transparent',
                    position: 'absolute',
                    left: col * cellSize,
                    top: row * cellSize,
                  }
                ]}
              />
            );
          })}
        </View>
        
        {/* Corner decorations */}
        <View style={[styles.cornerDecoration, styles.topLeft]} />
        <View style={[styles.cornerDecoration, styles.topRight]} />
        <View style={[styles.cornerDecoration, styles.bottomLeft]} />
        <View style={[styles.cornerDecoration, styles.bottomRight]} />
      </View>
    );
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: themeColors.surface,
      borderRadius: 20,
      width: '95%',
      maxWidth: 420,
      maxHeight: '90%',
      overflow: 'hidden',
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: themeColors.text,
    },
    closeButton: {
      padding: 4,
    },
    eventInfo: {
      paddingVertical: 15,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      marginBottom: 15,
      width: '100%',
    },
    venue: {
      fontSize: 18,
      fontWeight: '700',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    eventDetails: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    ticketPage: {
      width: ITEM_WIDTH,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ticketScrollContent: {
      flexGrow: 1,
      height: '100%',
    },
    ticketScrollContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 10,
      paddingHorizontal: 20,
      paddingBottom: 20,
      minHeight: '100%',
      flexGrow: 1,
    },
    ticketCard: {
      backgroundColor: themeColors.background,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      width: '90%',
      maxWidth: 320,
      alignSelf: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
      borderWidth: 0,
      borderTopWidth: 1,
      borderTopColor: themeColors.surface + '80',
      borderBottomWidth: 2,
      borderBottomColor: themeColors.border + '20',
    },
    ticketNumber: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.primary,
      marginBottom: 16,
      textAlign: 'center',
    },
    qrCodeContainer: {
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      alignItems: 'center',
      justifyContent: 'center',
      width: 160,
      height: 160,
      alignSelf: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 6,
      borderWidth: 0,
      borderTopWidth: 1,
      borderTopColor: '#f8f9fa',
      borderBottomWidth: 1,
      borderBottomColor: '#e9ecef',
    },
    qrCodeWrapper: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    qrGlow: {
      position: 'absolute',
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
      borderRadius: 8,
      zIndex: 0,
      alignSelf: 'center',
    },
    qrGrid: {
      borderRadius: 6,
      backgroundColor: '#ffffff',
      padding: 8,
      zIndex: 1,
      alignSelf: 'center',
    },
    qrCell: {
      borderRadius: 0.8,
    },
    cornerDecoration: {
      position: 'absolute',
      width: 12,
      height: 12,
      borderWidth: 2,
      borderColor: themeColors.primary + '30',
      zIndex: 2,
    },
    topLeft: {
      top: -6,
      left: -6,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderTopLeftRadius: 6,
    },
    topRight: {
      top: -6,
      right: -6,
      borderLeftWidth: 0,
      borderBottomWidth: 0,
      borderTopRightRadius: 6,
    },
    bottomLeft: {
      bottom: -6,
      left: -6,
      borderRightWidth: 0,
      borderTopWidth: 0,
      borderBottomLeftRadius: 6,
    },
    bottomRight: {
      bottom: -6,
      right: -6,
      borderLeftWidth: 0,
      borderTopWidth: 0,
      borderBottomRightRadius: 6,
    },
    scanInstructionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      backgroundColor: themeColors.primary + '10',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      alignSelf: 'center',
    },
    scanIcon: {
      marginRight: 8,
    },
    qrCodeText: {
      fontSize: 14,
      color: themeColors.primary,
      textAlign: 'center',
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    ticketId: {
      fontSize: 12,
      fontFamily: 'monospace',
      color: themeColors.textSecondary,
      marginBottom: 8,
      textAlign: 'center',
      backgroundColor: themeColors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      overflow: 'hidden',
      alignSelf: 'center',
    },
    seatInfo: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.primary,
      marginBottom: 16,
      textAlign: 'center',
      backgroundColor: themeColors.primary + '20',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      overflow: 'hidden',
      alignSelf: 'center',
    },
    validationNote: {
      fontSize: 12,
      color: themeColors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
      lineHeight: 18,
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      marginTop: 20,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: themeColors.textSecondary + '40',
      marginHorizontal: 4,
    },
    paginationDotActive: {
      backgroundColor: themeColors.primary,
      width: 12,
      height: 8,
      borderRadius: 4,
    },
    paginationText: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginLeft: 16,
    },
    instructionContainer: {
      backgroundColor: themeColors.primary + '15',
      borderRadius: 16,
      padding: 15,
      marginTop: 15,
      marginBottom: 10,
      borderLeftWidth: 4,
      borderLeftColor: themeColors.primary,
      width: '100%',
    },
    instructionText: {
      fontSize: 14,
      color: themeColors.text,
      textAlign: 'center',
      lineHeight: 20,
      fontWeight: '500',
    },
    swipeHint: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      marginBottom: 12,
    },
    swipeHintText: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginLeft: 8,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Tickets</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={flatListRef}
            data={tickets}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            keyExtractor={(item) => item.id}
            snapToInterval={ITEM_WIDTH}
            snapToAlignment="center"
            decelerationRate={0}
            overScrollMode="never"
            disableIntervalMomentum
            contentContainerStyle={{ 
              alignItems: 'center'
            }}
            getItemLayout={(data, index) => ({
              length: ITEM_WIDTH,
              offset: ITEM_WIDTH * index,
              index,
            })}
            renderItem={({ item: ticket, index }) => (
              <View style={styles.ticketPage}>
                <ScrollView 
                  style={styles.ticketScrollContent}
                  contentContainerStyle={styles.ticketScrollContainer}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  alwaysBounceVertical={false}
                  decelerationRate={0.85}
                  scrollEventThrottle={16}
                  overScrollMode="never"
                  fadingEdgeLength={5}
                >
                  <View style={styles.eventInfo}>
                    <Text style={styles.venue} numberOfLines={2}>
                      {venue}
                    </Text>
                    <Text style={styles.eventDetails}>
                      {city}{'\n'}
                      {formatDate(date)} at {time}
                    </Text>
                  </View>

                  <View style={styles.ticketCard}>
                    <Text style={styles.ticketNumber}>
                      Ticket {index + 1} of {tickets.length}
                    </Text>

                    <View style={styles.qrCodeContainer}>
                      {renderQRCode(ticket.qrCode)}
                    </View>

                    <View style={styles.scanInstructionContainer}>
                      <View style={styles.scanIcon}>
                        <Ionicons name="scan" size={20} color={themeColors.primary} />
                      </View>
                      <Text style={styles.qrCodeText}>
                        Scan at venue entrance
                      </Text>
                    </View>

                    <Text style={styles.ticketId}>
                      ID: {ticket.id}
                    </Text>

                    {ticket.seatInfo && (
                      <Text style={styles.seatInfo}>
                        {ticket.seatInfo}
                      </Text>
                    )}

                    <Text style={styles.validationNote}>
                      Keep this ticket ready for scanning
                    </Text>
                  </View>

                  {tickets.length > 1 && (
                    <>
                      <View style={styles.swipeHint}>
                        <Ionicons 
                          name="swap-horizontal" 
                          size={16} 
                          color={themeColors.textSecondary} 
                        />
                        <Text style={styles.swipeHintText}>
                          Swipe to view other tickets
                        </Text>
                      </View>

                      <View style={styles.paginationContainer}>
                        <View style={{ flexDirection: 'row' }}>
                          {tickets.map((_, dotIndex) => (
                            <View
                              key={dotIndex}
                              style={[
                                styles.paginationDot,
                                dotIndex === currentTicketIndex && styles.paginationDotActive,
                              ]}
                            />
                          ))}
                        </View>
                        <Text style={styles.paginationText}>
                          {currentTicketIndex + 1} / {tickets.length}
                        </Text>
                      </View>
                    </>
                  )}

                  <View style={styles.instructionContainer}>
                    <Text style={styles.instructionText}>
                      Save screenshots of each QR code as backup. Each ticket has a unique code that must be scanned separately at the venue.
                    </Text>
                  </View>
                </ScrollView>
              </View>
            )}
          />

        </View>
      </View>
    </Modal>
  );
}
