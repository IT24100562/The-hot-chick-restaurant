import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api, { API_BASE_URL } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { PremiumButton, PremiumCard, EmptyState } from '../../components';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { getItemCount } = useCart();
  const lastScrollY = useRef(0);
  const tabBarVisible = useRef(true);
  const [categories, setCategories] = useState([]);
  const [featuredFoods, setFeaturedFoods] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: tabBarVisible.current ? styles.tabBarVisible : styles.tabBarHidden,
    });

    return () => {
      navigation.setOptions({ tabBarStyle: styles.tabBarVisible });
    };
  }, [navigation]);

  const fetchData = async () => {
    setErrorMessage('');
    try {
      const [catRes, foodRes, promoRes] = await Promise.allSettled([
        api.get('/api/categories'),
        api.get('/api/foods'),
        api.get('/api/promotions'),
      ]);

      if (catRes.status === 'fulfilled') {
        setCategories(catRes.value.data.data || []);
      } else {
        setCategories([]);
      }

      if (foodRes.status === 'fulfilled') {
        setFeaturedFoods((foodRes.value.data.data || []).slice(0, 8));
      } else {
        setFeaturedFoods([]);
        setErrorMessage('Could not load food items.');
      }

      if (promoRes.status === 'fulfilled') {
        setPromotions(promoRes.value.data.data || []);
      } else {
        setPromotions([]);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
      setErrorMessage('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleScroll = (event) => {
    const currentY = event.nativeEvent.contentOffset.y;

    if (currentY > lastScrollY.current + 12 && tabBarVisible.current) {
      tabBarVisible.current = false;
      navigation.setOptions({ tabBarStyle: styles.tabBarHidden });
    } else if (currentY < lastScrollY.current - 12 && !tabBarVisible.current) {
      tabBarVisible.current = true;
      navigation.setOptions({ tabBarStyle: styles.tabBarVisible });
    }

    lastScrollY.current = currentY;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#16A34A"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hey, {user?.name?.split(' ')[0] || 'Guest'} 👋
            </Text>
            <Text style={styles.subGreeting}>What sounds good today?</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Cart')}
            style={styles.cartButton}
          >
            <MaterialIcons name="shopping-cart" size={24} color="#16A34A" />
            {getItemCount() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getItemCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Menu')}
          activeOpacity={0.8}
          style={styles.heroBannerContainer}
        >
          <LinearGradient
            colors={['#16A34A', '#15803D']}
            style={styles.heroBanner}
          >
            <View>
              <Text style={styles.heroLabel}>TODAY'S MENU</Text>
              <Text style={styles.heroTitle}>Explore Dishes</Text>
              <Text style={styles.heroSub}>Tap to browse the full menu</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={28} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Promotions Section */}
        {promotions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Menu Offers</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Promotions')}>
                <MaterialIcons name="arrow-forward" size={20} color="#16A34A" />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12 }}
            >
              {promotions.map((promo) => (
                <TouchableOpacity
                  key={promo._id}
                  onPress={() => navigation.navigate('Promotions')}
                  activeOpacity={0.8}
                >
                  <PremiumCard
                    variant="green"
                    marginVertical={0}
                    marginHorizontal={4}
                    style={{ width: 260, paddingVertical: 14, paddingHorizontal: 12 }}
                  >
                    <View style={styles.promoContent}>
                      <View>
                        <Text style={styles.promoDiscount}>{promo.discountPercentage}%</Text>
                        <Text style={styles.promoOff}>OFF</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.promoTitle} numberOfLines={1}>
                          {promo.title}
                        </Text>
                        <Text style={styles.promoCode}>Code: {promo.code}</Text>
                      </View>
                    </View>
                  </PremiumCard>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Categories Section */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Menu Categories</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                <MaterialIcons name="arrow-forward" size={20} color="#16A34A" />
              </TouchableOpacity>
            </View>
            <View style={styles.categoryGrid}>
              {categories.slice(0, 6).map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  onPress={() =>
                    navigation.navigate('Menu', {
                      categoryId: cat._id,
                      categoryName: cat.name,
                    })
                  }
                  activeOpacity={0.8}
                  style={styles.categoryGridItem}
                >
                  <PremiumCard
                    variant="light"
                    marginVertical={0}
                    marginHorizontal={0}
                    padding={12}
                    style={styles.categoryCard}
                  >
                    <View style={styles.categoryIconBox}>
                      {cat.image ? (
                        <Image
                          source={{ uri: `${API_BASE_URL}${cat.image}` }}
                          style={{ width: '100%', height: '100%', borderRadius: 14 }}
                        />
                      ) : (
                        <MaterialIcons name="restaurant" size={28} color="#16A34A" />
                      )}
                    </View>
                    <Text style={styles.categoryName} numberOfLines={1}>
                      {cat.name}
                    </Text>
                  </PremiumCard>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Featured Foods Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Menu Highlights</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
              <MaterialIcons name="arrow-forward" size={20} color="#16A34A" />
            </TouchableOpacity>
          </View>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={18} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {loading ? (
            <EmptyState
              icon="hourglass-empty"
              title="Loading..."
              description="Preparing your menu"
            />
          ) : featuredFoods.length > 0 ? (
            <View style={styles.foodGrid}>
              {featuredFoods.map((food) => (
                <TouchableOpacity
                  key={food._id}
                  onPress={() =>
                    navigation.navigate('FoodDetail', { foodId: food._id })
                  }
                  activeOpacity={0.8}
                  style={styles.foodGridItem}
                >
                  <PremiumCard
                    variant="light"
                    padding={0}
                    marginVertical={0}
                    marginHorizontal={0}
                    style={styles.foodCard}
                  >
                    <View>
                      <View style={styles.foodImageBox}>
                        {food.image ? (
                          <Image
                            source={{ uri: `${API_BASE_URL}${food.image}` }}
                            style={{ width: '100%', height: '100%' }}
                          />
                        ) : (
                          <View
                            style={[
                              styles.foodImageBox,
                              { backgroundColor: '#F3F4F6' },
                            ]}
                          >
                            <MaterialIcons
                              name="restaurant"
                              size={32}
                              color="#D1D5DB"
                            />
                          </View>
                        )}
                        {food.isPopular && (
                          <View style={styles.popularBadge}>
                            <MaterialIcons
                              name="star"
                              size={12}
                              color="#FFF"
                            />
                            <Text style={styles.popularText}>Popular</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.foodInfo}>
                        <Text style={styles.foodName} numberOfLines={1}>
                          {food.name}
                        </Text>
                        <View style={styles.foodMeta}>
                          {Number(food.rating) > 0 && (
                            <View style={styles.ratingBadge}>
                              <MaterialIcons
                                name="star"
                                size={11}
                                color="#F59E0B"
                              />
                              <Text style={styles.ratingText}>
                                {food.rating.toFixed(1)}
                              </Text>
                            </View>
                          )}
                          {Number(food.prepTime) > 0 && (
                            <Text style={styles.prepTime}>
                              {food.prepTime}m
                            </Text>
                          )}
                        </View>
                        <Text style={styles.foodPrice}>Rs. {food.price}</Text>
                      </View>
                    </View>
                  </PremiumCard>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="restaurant"
              title="No Dishes"
              description="Check back soon"
            />
          )}
        </View>

        {/* CTA Banner */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Menu')}
          activeOpacity={0.8}
          style={styles.ctaBannerContainer}
        >
          <LinearGradient
            colors={['#DCFCE7', '#BBF7D0']}
            style={styles.ctaBanner}
          >
            <View>
              <Text style={styles.ctaTitle}>🎉 Special Offer!</Text>
              <Text style={styles.ctaSub}>Get 20% off today</Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={20} color="#16A34A" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 13,
    color: '#6B7280',
  },
  cartButton: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  heroBannerContainer: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabBarVisible: {
    backgroundColor: '#F8FAFC',
    borderTopColor: '#E2E8F0',
    borderTopWidth: 0,
    paddingBottom: 10,
    paddingTop: 10,
    height: 74,
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 10,
  },
  tabBarHidden: {
    display: 'none',
  },
  heroBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  section: {
    marginVertical: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoDiscount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#16A34A',
  },
  promoOff: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  promoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  promoCode: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  categoryIconBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  categoryGridItem: {
    width: '33.3333%',
    padding: 6,
  },
  categoryCard: {
    aspectRatio: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  foodGridItem: {
    width: '50%',
    padding: 6,
  },
  foodCard: {
    aspectRatio: 1,
    overflow: 'hidden',
  },
  foodImageBox: {
    width: '100%',
    height: '72%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  popularText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  foodInfo: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  foodName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  foodMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  prepTime: {
    fontSize: 11,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  foodPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    flex: 1,
    fontWeight: '500',
  },
  ctaBannerContainer: {
    marginHorizontal: 16,
    marginVertical: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  ctaSub: {
    fontSize: 12,
    color: '#16A34A',
    marginTop: 2,
    fontWeight: '500',
  },
});
