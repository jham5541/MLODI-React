import { Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Dimensions, FlatList } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { useTheme, colors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import BottomNavBar from '../components/common/BottomNavBar';

// Artist Components
import ArtistHeader from '../components/artists/ArtistHeader';
import PopularSongs from '../components/artists/PopularSongs';
import DiscographyCarousel from '../components/artists/DiscographyCarousel';
import VideoCarousel from '../components/artists/VideoCarousel';
import TourDates from '../components/artists/TourDates';
import EngagementChallenges from '../components/artists/EngagementChallenges';
import TopFansLeaderboard from '../components/artists/TopFansLeaderboard';
import PlaylistIntegration from '../components/artists/PlaylistIntegration';

// Analytics Components
import EngagementMetrics from '../components/analytics/EngagementMetrics';

// Finance Components
import RevenueInsights from '../components/finance/RevenueInsights';

// Social Components
import ReactionBar from '../components/social/ReactionBar';
import CommentSection from '../components/social/CommentSection';

// Collaboration Components
import CollaborationContainer from '../components/collaboration/CollaborationContainer';

// Database Service
import { supabase } from '../lib/supabase/client';

// Dev Components
import { DevSubscriptionPanel } from '../components/dev/DevSubscriptionPanel';
import { MonthlyListenersDemo } from '../components/dev/MonthlyListenersDemo';

import { Artist } from '../types/music';
import { fetchArtistDetails } from '../services/artistService';
import MLService from '../services/ml/MLService';
import merchandiseService, { Merchandise } from '../services/merchandiseService';

type ArtistProfileRouteProp = RouteProp<RootStackParamList, 'ArtistProfile'>;

interface Props {
  route: ArtistProfileRouteProp;
}

export default function ArtistProfileScreen({ route }: Props) {
  const artistId = route?.params?.artistId;
  if (!artistId) {
    console.error('No artist ID provided in route params');
  }
  console.log('ArtistProfile received artistId:', artistId);
  const { activeTheme } = useTheme();
  const { user } = useAuth();
  const themeColors = colors[activeTheme];
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const [artistInsights, setArtistInsights] = useState<any>(null);
  const [isEmergingTalent, setIsEmergingTalent] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Handler for subscription changes
  const handleSubscriptionChange = () => {
    console.log('Subscription changed, refreshing insights...');
    // Increment refreshKey to force RevenueInsights to refresh
    setRefreshKey(prev => prev + 1);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    contentContainer: {
      flex: 1,
      paddingBottom: 180, // Space for bottom nav and play bar
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    artistName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.text,
      marginLeft: 8,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: themeColors.text,
      marginVertical: 12,
    },
    bio: {
      fontSize: 16,
      color: themeColors.textSecondary,
      marginBottom: 16,
    },
    image: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeColors.background,
    },
    loadingText: {
      fontSize: 18,
      color: themeColors.text,
    },
    merchandiseSection: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 16,
      marginVertical: 16,
    },
    sectionSpacer: {
      height: 16,
    },
    merchandiseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    merchandiseTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: themeColors.text,
    },
    scrollContainer: {
      paddingLeft: 4,
    },
    merchandiseCard: {
      width: 160,
      marginRight: 16,
      backgroundColor: themeColors.background,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    merchandiseImage: {
      width: 160,
      height: 160,
      borderRadius: 0,
      backgroundColor: themeColors.surface,
    },
    merchandiseInfo: {
      padding: 12,
      backgroundColor: themeColors.background,
    },
    merchandiseName: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 4,
    },
    merchandisePrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: themeColors.primary,
      marginBottom: 8,
    },
    buyButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 0,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buyButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 12,
    },
    modalView: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    checkoutContainer: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 10,
      paddingHorizontal: 20,
      paddingBottom: 30,
      maxHeight: '90%',
    },
    checkoutHandle: {
      width: 40,
      height: 4,
      backgroundColor: themeColors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
    },
    checkoutHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    checkoutTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: themeColors.text,
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      fontSize: 18,
      color: themeColors.textSecondary,
    },
    orderSummary: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    orderItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    orderItemImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
    },
    orderItemDetails: {
      flex: 1,
    },
    orderItemName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 4,
    },
    orderItemPrice: {
      fontSize: 18,
      fontWeight: '700',
      color: themeColors.primary,
    },
    sizeSection: {
      marginBottom: 24,
    },
    sizeOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 12,
      gap: 8,
    },
    sizeButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: themeColors.border,
      marginRight: 8,
      marginBottom: 8,
      minWidth: 50,
      alignItems: 'center',
    },
    sizeButtonSelected: {
      borderColor: themeColors.primary,
      backgroundColor: themeColors.primary + '20',
    },
    sizeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
    },
    sizeButtonTextSelected: {
      color: themeColors.primary,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 16,
    },
    shippingForm: {
      marginBottom: 24,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: themeColors.textSecondary,
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: themeColors.surface,
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    inputRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    halfInput: {
      width: '48%',
    },
    paymentOptions: {
      marginBottom: 24,
    },
    paymentButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
      shadowColor: themeColors.shadow || '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      marginBottom: 12,
    },
    paymentButtonSelected: {
      borderColor: themeColors.primary,
      shadowOpacity: 0.15,
    },
    paymentIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: themeColors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    paymentInfo: {
      flex: 1,
    },
    paymentText: {
      fontSize: 17,
      color: themeColors.text,
      fontWeight: '600',
      marginBottom: 2,
    },
    paymentDesc: {
      fontSize: 14,
      color: themeColors.textSecondary,
      fontWeight: '500',
    },
    paymentSelected: {
      marginLeft: 12,
    },
    totalSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      marginBottom: 20,
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.textSecondary,
    },
    totalAmount: {
      fontSize: 24,
      fontWeight: '700',
      color: themeColors.text,
    },
    checkoutButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      padding: 18,
      alignItems: 'center',
      shadowColor: themeColors.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    checkoutButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '700',
    },
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState('apple');
  const [selectedSize, setSelectedSize] = useState('');
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
  });

  const [merchandise, setMerchandise] = useState<Merchandise[]>([]);
  const [loadingMerchandise, setLoadingMerchandise] = useState(true);

  useEffect(() => {
    const loadMerchandise = async () => {
      try {
        const data = await merchandiseService.getArtistMerchandise(artistId);
        if (data && data.length > 0) {
          setMerchandise(data);
        } else {
          // Fallback sample merchandise to ensure UI shows examples
          const sample: Merchandise[] = [
            {
              id: 'sample-hoodie',
              artist_id: artistId,
              name: 'Drake OVO Hoodie',
              description: 'Premium fleece hoodie',
              price: 79.99,
              image_url: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1200&auto=format',
              category: 'clothing',
              inventory_count: 25,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'sample-tour-tee',
              artist_id: artistId,
              name: 'Taylor Swift Tour Tee',
              description: 'Eras Tour T-shirt',
              price: 34.99,
              image_url: 'https://images.unsplash.com/photo-1520975922325-24baf2ed0a9b?q=80&w=1200&auto=format',
              category: 'clothing',
              inventory_count: 50,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'sample-beanie',
              artist_id: artistId,
              name: 'Ed Sheeran Beanie',
              description: 'Knit beanie with logo',
              price: 19.99,
              image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format',
              category: 'accessories',
              inventory_count: 75,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];
          setMerchandise(sample);
        }
      } catch (error) {
        console.error('Error loading merchandise:', error);
        // Ensure UI still shows examples if fetch fails
        const sample: Merchandise[] = [
          {
            id: 'sample-hoodie',
            artist_id: artistId,
            name: 'Drake OVO Hoodie',
            description: 'Premium fleece hoodie',
            price: 79.99,
            image_url: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1200&auto=format',
            category: 'clothing',
            inventory_count: 25,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'sample-tour-tee',
            artist_id: artistId,
            name: 'Taylor Swift Tour Tee',
            description: 'Eras Tour T-shirt',
            price: 34.99,
            image_url: 'https://images.unsplash.com/photo-1520975922325-24baf2ed0a9b?q=80&w=1200&auto=format',
            category: 'clothing',
            inventory_count: 50,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'sample-beanie',
            artist_id: artistId,
            name: 'Ed Sheeran Beanie',
            description: 'Knit beanie with logo',
            price: 19.99,
            image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format',
            category: 'accessories',
            inventory_count: 75,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        setMerchandise(sample);
      } finally {
        setLoadingMerchandise(false);
      }
    };

    if (artistId) {
      loadMerchandise();
    }
  }, [artistId]);

  const toggleModal = () => {
    setModalVisible(!modalVisible);
    if (!modalVisible) {
      // Reset size when opening modal
      setSelectedSize('');
    }
  };

  const handlePurchase = async () => {
    try {
      // Validate shipping information
      if (!shippingInfo.fullName || !shippingInfo.address || !shippingInfo.city || 
          !shippingInfo.state || !shippingInfo.zipCode || !shippingInfo.country || !shippingInfo.phone) {
        Alert.alert('Missing Information', 'Please fill in all shipping address fields including phone number.');
        return;
      }

      if (!selectedItem) {
        Alert.alert('Error', 'No item selected');
        return;
      }

      if (!selectedSize) {
        Alert.alert('Select Size', 'Please select a size for your item.');
        return;
      }

      // Create the order using the new createMerchOrder function
      const result = await merchandiseService.createMerchOrder({
        user_id: user?.id || '',
        artist_id: artistId,
        product_id: selectedItem.id,
        product_name: selectedItem.name,
        size: selectedSize,
        quantity: 1,
        price: selectedItem.price,
        total: selectedItem.price,
        shipping_info: {
          fullName: shippingInfo.fullName,
          address: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          country: shippingInfo.country,
          phone: shippingInfo.phone,
        },
        status: 'pending'
      });
      
      Alert.alert(
        'Order Confirmed!',
        `Your ${selectedItem.name} (Size: ${selectedSize}) order has been placed and will be shipped to ${shippingInfo.fullName} at ${shippingInfo.address}.`,
        [{ text: 'OK', onPress: () => toggleModal() }]
      );
      
      // Clear form after successful order
      setShippingInfo({
        fullName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        phone: '',
      });
      setSelectedSize('');
      
    } catch (error) {
      console.error('Purchase failed:', error);
      Alert.alert(
        'Purchase Failed', 
        error.message || 'There was an error processing your order. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  useEffect(() => {
    const loadArtist = async () => {
      if (!artistId) {
        setError('No artist ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const artistData = await fetchArtistDetails(artistId);
        setArtist(artistData);
      } catch (err) {
        console.error('Failed to load artist:', err);
        setError(err?.message || 'Failed to load artist details');
      } finally {
        setLoading(false);
      }
    };
    
    loadArtist();
  }, [artistId]);

  useEffect(() => {
    const loadArtistInsights = async () => {
      try {
        // Check if artist is emerging talent
        const emergingArtists = await MLService.discoverEmergingTalent();
        const isEmerging = emergingArtists.some(a => a.artistId === artistId);
        setIsEmergingTalent(isEmerging);
        
        // Get artist insights
        const emerging = emergingArtists.find(a => a.artistId === artistId);
        if (emerging) {
          setArtistInsights({
            potential: Math.round(emerging.viralPotential * 100),
            engagementScore: emerging.engagementScore.toFixed(2),
            metrics: emerging.metrics
          });
        }
      } catch (error) {
        console.log('Error loading artist insights:', error);
      }
    };
    
    if (artistId) {
      loadArtistInsights();
    }
  }, [artistId]);
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading artist...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: themeColors.error || '#FF4444' }]}>Error: {error}</Text>
        <Text style={[styles.loadingText, { fontSize: 14, marginTop: 10 }]}>Please check if the artist exists in the database</Text>
      </View>
    );
  }
  
  if (!artist) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Artist not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.contentContainer}
        contentContainerStyle={{ paddingBottom: 180 }}
        data={[{ id: 'content' }]}
        renderItem={() => (
          <>
            {/* Dev Subscription Panel (only in development) - DISABLED */}
            {/* {__DEV__ && <DevSubscriptionPanel />} */}
            
            <ArtistHeader artist={artist} onSubscribe={handleSubscriptionChange} />
            
            {/* Monthly Listeners Demo (only in development) - DISABLED */}
            {/* {__DEV__ && <MonthlyListenersDemo artistId={artistId} artistName={artist.name} />} */}
            <EngagementMetrics artistId={artistId} artistName={artist.name} />
            <RevenueInsights artistId={artistId} artistName={artist.name} refreshKey={refreshKey} />
            <PopularSongs artistId={artistId} artistName={artist.name} />
            {/* <ReactionBar artistId={artistId} /> */}
            <CollaborationContainer artistId={artistId} />
            <CommentSection trackId={artistId} scope="artist" />
            <DiscographyCarousel artistId={artistId} artistName={artist.name} />
            <VideoCarousel artistId={artistId} artistName={artist.name} />
            <TourDates artistId={artistId} artistName={artist.name} />
            {/* AI-Powered Insights */}
            {artistInsights && (
              <View style={styles.merchandiseSection}>
                <Text style={styles.merchandiseTitle}>AI Insights</Text>
                <Text>Potential: {artistInsights.potential}%</Text>
                <Text>Engagement Score: {artistInsights.engagementScore}</Text>
                {isEmergingTalent && <Text style={{color: 'orange'}}>Emerging Talent!</Text>}
              </View>
            )}
            <EngagementChallenges artistId={artistId} artistName={artist.name} userLevel={2} />
            <PlaylistIntegration artistId={artistId} artistName={artist.name} />
            <TopFansLeaderboard artistId={artistId} />

            <View style={styles.sectionSpacer} />

            <View style={styles.merchandiseSection}>
              <View style={styles.merchandiseHeader}>
                <Text style={styles.merchandiseTitle}>Merchandise</Text>
              </View>
              
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
                data={merchandise}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.merchandiseCard}>
                    <Image source={{ uri: item.image_url }} style={styles.merchandiseImage} />
                    <View style={styles.merchandiseInfo}>
                      <Text style={styles.merchandiseName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.merchandisePrice}>${item.price.toFixed(2)}</Text>
                      <TouchableOpacity
                        style={styles.buyButton}
                        onPress={() => {
                          setSelectedItem(item);
                          setModalVisible(true);
                        }}
                      >
                        <Text style={styles.buyButtonText}>BUY NOW</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            </View>
          </>
        )}
        keyExtractor={() => 'content'}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalView}>
          <ScrollView style={styles.checkoutContainer}>
            <View style={styles.checkoutHandle} />
            
            <View style={styles.checkoutHeader}>
              <Text style={styles.checkoutTitle}>Checkout</Text>
              <TouchableOpacity style={styles.closeButton} onPress={toggleModal}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <>
                <View style={styles.orderSummary}>
                  <View style={styles.orderItem}>
                    <Image source={{ uri: selectedItem.image_url }} style={styles.orderItemImage} />
                    <View style={styles.orderItemDetails}>
                      <Text style={styles.orderItemName}>{selectedItem.name}</Text>
                      <Text style={styles.orderItemPrice}>${selectedItem.price.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.sizeSection}>
                  <Text style={styles.sectionTitle}>Select Size</Text>
                  <View style={styles.sizeOptions}>
                    {['OS', 'XS', 'S', 'M', 'L', 'XL', '2XL'].map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={[
                          styles.sizeButton,
                          selectedSize === size && styles.sizeButtonSelected
                        ]}
                        onPress={() => setSelectedSize(size)}
                      >
                        <Text style={[
                          styles.sizeButtonText,
                          selectedSize === size && styles.sizeButtonTextSelected
                        ]}>
                          {size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            <View style={styles.shippingForm}>
              <Text style={styles.sectionTitle}>Shipping Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={shippingInfo.fullName}
                  onChangeText={(text) => setShippingInfo({...shippingInfo, fullName: text})}
                  placeholder="John Doe"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={shippingInfo.address}
                  onChangeText={(text) => setShippingInfo({...shippingInfo, address: text})}
                  placeholder="123 Main Street"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.textInput}
                    value={shippingInfo.city}
                    onChangeText={(text) => setShippingInfo({...shippingInfo, city: text})}
                    placeholder="New York"
                  />
                </View>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>State</Text>
                  <TextInput
                    style={styles.textInput}
                    value={shippingInfo.state}
                    onChangeText={(text) => setShippingInfo({...shippingInfo, state: text})}
                    placeholder="NY"
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>ZIP Code</Text>
                  <TextInput
                    style={styles.textInput}
                    value={shippingInfo.zipCode}
                    onChangeText={(text) => setShippingInfo({...shippingInfo, zipCode: text})}
                    placeholder="10001"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>Country</Text>
                  <TextInput
                    style={styles.textInput}
                    value={shippingInfo.country}
                    onChangeText={(text) => setShippingInfo({...shippingInfo, country: text})}
                    placeholder="USA"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={shippingInfo.phone}
                  onChangeText={(text) => setShippingInfo({...shippingInfo, phone: text})}
                  placeholder="(555) 123-4567"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.paymentOptions}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              
              <TouchableOpacity
                style={[styles.paymentButton, selectedPayment === 'apple' && styles.paymentButtonSelected]}
                onPress={() => setSelectedPayment('apple')}
              >
                <View style={styles.paymentIconContainer}>
                  <Ionicons name="logo-apple" size={24} color={themeColors.text} />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentText}>Apple Pay</Text>
                  <Text style={styles.paymentDesc}>Touch ID or Face ID</Text>
                </View>
                {selectedPayment === 'apple' && (
                  <View style={styles.paymentSelected}>
                    <Ionicons name="checkmark-circle" size={20} color={themeColors.primary} />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentButton, selectedPayment === 'card' && styles.paymentButtonSelected]}
                onPress={() => setSelectedPayment('card')}
              >
                <View style={styles.paymentIconContainer}>
                  <Ionicons name="card" size={24} color={themeColors.text} />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentText}>Credit Card</Text>
                  <Text style={styles.paymentDesc}>Visa, Mastercard, Amex</Text>
                </View>
                {selectedPayment === 'card' && (
                  <View style={styles.paymentSelected}>
                    <Ionicons name="checkmark-circle" size={20} color={themeColors.primary} />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentButton, selectedPayment === 'web3' && styles.paymentButtonSelected]}
                onPress={() => setSelectedPayment('web3')}
              >
                <View style={styles.paymentIconContainer}>
                  <Ionicons name="logo-bitcoin" size={24} color={themeColors.text} />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentText}>Ethereum</Text>
                  <Text style={styles.paymentDesc}>Crypto payment</Text>
                </View>
                {selectedPayment === 'web3' && (
                  <View style={styles.paymentSelected}>
                    <Ionicons name="checkmark-circle" size={20} color={themeColors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${selectedItem ? selectedItem.price.toFixed(2) : '0.00'}</Text>
            </View>

            <TouchableOpacity style={styles.checkoutButton} onPress={handlePurchase}>
              <Text style={styles.checkoutButtonText}>Complete Purchase</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
      <BottomNavBar />
    </View>
  );
}