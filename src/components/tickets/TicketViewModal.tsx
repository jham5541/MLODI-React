import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  tickets = [],
}: TicketViewModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);

  // Early return if no tickets
  if (!tickets || tickets.length === 0) {
    return null;
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const currentTicket = tickets[currentTicketIndex] || tickets[0];

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
    container: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 20,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: 'white',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
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
    scrollContent: {
      paddingBottom: 40,
    },
    eventCard: {
      backgroundColor: themeColors.surface,
      marginHorizontal: 20,
      marginTop: 20,
      padding: 20,
      borderRadius: 16,
      alignItems: 'center',
    },
    venueName: {
      fontSize: 22,
      fontWeight: '700',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    eventDate: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 4,
    },
    eventLocation: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    qrSection: {
      alignItems: 'center',
      marginTop: 30,
      marginBottom: 20,
    },
    qrContainer: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    ticketId: {
      fontSize: 12,
      fontFamily: 'monospace',
      color: themeColors.textSecondary,
      marginTop: 12,
      textAlign: 'center',
    },
    seatSection: {
      backgroundColor: themeColors.surface,
      marginHorizontal: 20,
      padding: 16,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    seatLabel: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    seatInfo: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
    },
    instructionCard: {
      backgroundColor: themeColors.primary + '10',
      marginHorizontal: 20,
      padding: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    instructionText: {
      fontSize: 14,
      color: themeColors.text,
      marginLeft: 10,
      flex: 1,
    },
    navigationSection: {
      marginHorizontal: 20,
      marginTop: 20,
    },
    ticketCounter: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginBottom: 12,
    },
    navigationButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    navButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.surface,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      gap: 8,
    },
    navButtonDisabled: {
      opacity: 0.5,
    },
    navButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: themeColors.text,
    },
    navButtonTextDisabled: {
      color: themeColors.textSecondary,
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
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ticket</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Event Info Card */}
          <View style={styles.eventCard}>
            <Text style={styles.venueName}>{venue}</Text>
            <Text style={styles.eventDate}>{formatDate(date)} • {time}</Text>
            <Text style={styles.eventLocation}>{city}</Text>
          </View>

          {/* QR Code Section */}
          {currentTicket && (
            <View style={styles.qrSection}>
              <View style={styles.qrContainer}>
                {renderQRCode(currentTicket.qrCode)}
              </View>
              <Text style={styles.ticketId}>{currentTicket.id}</Text>
            </View>
          )}

          {/* Seat Info if available */}
          {currentTicket && currentTicket.seatInfo && (
            <View style={styles.seatSection}>
              <Text style={styles.seatLabel}>Seat</Text>
              <Text style={styles.seatInfo}>{currentTicket.seatInfo}</Text>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructionCard}>
            <Ionicons name="information-circle" size={20} color={themeColors.primary} />
            <Text style={styles.instructionText}>
              Present this QR code at the venue entrance for scanning
            </Text>
          </View>

          {/* Multiple Tickets Navigation */}
          {tickets.length > 1 && (
            <View style={styles.navigationSection}>
              <Text style={styles.ticketCounter}>
                Ticket {currentTicketIndex + 1} of {tickets.length}
              </Text>
              <View style={styles.navigationButtons}>
                <TouchableOpacity 
                  style={[styles.navButton, currentTicketIndex === 0 && styles.navButtonDisabled]}
                  onPress={() => setCurrentTicketIndex(Math.max(0, currentTicketIndex - 1))}
                  disabled={currentTicketIndex === 0}
                >
                  <Ionicons name="chevron-back" size={20} color={currentTicketIndex === 0 ? themeColors.textSecondary : themeColors.text} />
                  <Text style={[styles.navButtonText, currentTicketIndex === 0 && styles.navButtonTextDisabled]}>Previous</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.navButton, currentTicketIndex === tickets.length - 1 && styles.navButtonDisabled]}
                  onPress={() => setCurrentTicketIndex(Math.min(tickets.length - 1, currentTicketIndex + 1))}
                  disabled={currentTicketIndex === tickets.length - 1}
                >
                  <Text style={[styles.navButtonText, currentTicketIndex === tickets.length - 1 && styles.navButtonTextDisabled]}>Next</Text>
                  <Ionicons name="chevron-forward" size={20} color={currentTicketIndex === tickets.length - 1 ? themeColors.textSecondary : themeColors.text} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
