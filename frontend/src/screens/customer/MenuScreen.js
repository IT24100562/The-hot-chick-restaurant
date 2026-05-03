import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { PremiumButton, PremiumCard, EmptyState } from '../../components';
import { buildFileUrl } from '../../utils/media';

export default function MenuScreen({ navigation, route }) {
  const { categoryId, categoryName } = route.params || {};
  const { addItem } = useCart();
  const lastScrollY = useRef(0);
  const tabBarVisible = useRef(true);
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Home');
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterFoods();
  }, [foods, selectedCategory, searchQuery]);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: tabBarVisible.current ? styles.tabBarVisible : styles.tabBarHidden,
    });

    return () => {
      navigation.setOptions({ tabBarStyle: styles.tabBarVisible });
    };
  }, [navigation]);

  const fetchData = async () => {
    try {
      const [catRes, foodRes] = await Promise.allSettled([
        api.get('/api/categories'),
        api.get('/api/foods'),
      ]);

      if (catRes.status === 'fulfilled') {
        setCategories(catRes.value.data.data || []);
      }
      if (foodRes.status === 'fulfilled') {
        setFoods(foodRes.value.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
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

  const filterFoods = () => {
    let filtered = foods;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((f) => f.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query)
      );
    }

    setFilteredFoods(filtered);
  };

  const renderFoodGridItem = (food) => (
    <TouchableOpacity
      key={food._id}
      onPress={() => navigation.navigate('FoodDetail', { foodId: food._id })}
      activeOpacity={0.8}
      style={styles.foodGridItem}
    >
      <PremiumCard variant="light" padding={0} marginVertical={0} marginHorizontal={0} style={styles.foodCard}>
        <View style={styles.foodCardInner}>
          <View style={styles.imageBox}>
            {food.image ? (
              <Image
              source={{ uri: buildFileUrl(food.image, food.updatedAt || food.createdAt || food._id) }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <View style={[styles.imageBox, { backgroundColor: '#F3F4F6' }]}>
                <MaterialIcons name="restaurant" size={40} color="#D1D5DB" />
              </View>
            )}
            {food.isPopular && (
              <View style={styles.popularBadge}>
                <MaterialIcons name="star" size={12} color="#FFF" />
                <Text style={styles.popularText}>Popular</Text>
              </View>
            )}
            {food.isVegetarian && (
              <View style={styles.vegBadge}>
                <MaterialIcons name="eco" size={12} color="#FFF" />
              </View>
            )}
          </View>
          <View style={styles.foodInfo}>
            <Text style={styles.foodName} numberOfLines={2}>
              {food.name}
            </Text>
            <View style={styles.meta}>
              {Number(food.rating) > 0 && (
                <View style={styles.ratingBadge}>
                  <MaterialIcons name="star" size={11} color="#F59E0B" />
                  <Text style={styles.ratingText}>{food.rating.toFixed(1)}</Text>
                </View>
              )}
              {Number(food.prepTime) > 0 && (
                <Text style={styles.prepTime}>{food.prepTime}m</Text>
              )}
              {food.spiceLevel && (
                <Text style={styles.spice}>🌶 {food.spiceLevel}</Text>
              )}
            </View>
            <Text style={styles.price}>Rs. {food.price}</Text>
            <PremiumButton
              title="View Details"
              variant="primary"
              size="sm"
              onPress={() =>
                navigation.navigate('FoodDetail', { foodId: food._id })
              }
              style={{ marginTop: 8 }}
              textStyle={{ fontSize: 11 }}
            />
          </View>
        </View>
      </PremiumCard>
    </TouchableOpacity>
  );

  const renderFoodListItem = ({ item: food }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('FoodDetail', { foodId: food._id })}
      activeOpacity={0.8}
    >
      <PremiumCard variant="light" marginVertical={6} marginHorizontal={16}>
        <View style={styles.listItem}>
          <View style={styles.listImageBox}>
            {food.image ? (
              <Image
              source={{ uri: buildFileUrl(food.image, food.updatedAt || food.createdAt || food._id) }}
                style={{ width: '100%', height: '100%', borderRadius: 10 }}
              />
            ) : (
              <View style={[styles.listImageBox, { backgroundColor: '#F3F4F6' }]}>
                <MaterialIcons name="restaurant" size={24} color="#D1D5DB" />
              </View>
            )}
          </View>
          <View style={styles.listContent}>
            <Text style={styles.listFoodName} numberOfLines={1}>
              {food.name}
            </Text>
            <Text style={styles.listDesc} numberOfLines={1}>
              {food.description}
            </Text>
            <View style={styles.listMeta}>
              {Number(food.rating) > 0 && (
                <View style={styles.ratingBadge}>
                  <MaterialIcons name="star" size={10} color="#F59E0B" />
                  <Text style={{ fontSize: 10, color: '#F59E0B' }}>
                    {food.rating.toFixed(1)}
                  </Text>
                </View>
              )}
              {Number(food.prepTime) > 0 && (
                <Text style={{ fontSize: 10, color: '#6B7280' }}>
                  {food.prepTime}m
                </Text>
              )}
            </View>
            <Text style={styles.listPrice}>Rs. {food.price}</Text>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={16} color="#16A34A" />
        </View>
      </PremiumCard>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {categoryName || 'Menu'}
        </Text>
        <TouchableOpacity onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
          <MaterialIcons
            name={viewMode === 'grid' ? 'list' : 'grid-3x3'}
            size={24}
            color="#16A34A"
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search dishes..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory('all')}
            style={[
              styles.categoryFilter,
              selectedCategory === 'all' && styles.categoryFilterActive,
            ]}
          >
            <Text
              style={[
                styles.categoryFilterText,
                selectedCategory === 'all' && styles.categoryFilterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat._id}
              onPress={() => setSelectedCategory(cat._id)}
              style={[
                styles.categoryFilter,
                selectedCategory === cat._id && styles.categoryFilterActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryFilterText,
                  selectedCategory === cat._id &&
                    styles.categoryFilterTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      {loading ? (
        <EmptyState icon="hourglass-empty" title="Loading..." description="Please wait" />
      ) : filteredFoods.length > 0 ? (
        viewMode === 'grid' ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />
            }
          >
            <View style={styles.foodGrid}>
              {filteredFoods.map((food) => renderFoodGridItem(food))}
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>
        ) : (
          <FlatList
            data={filteredFoods}
            renderItem={renderFoodListItem}
            keyExtractor={(item) => item._id}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />
            }
            contentContainerStyle={{ paddingVertical: 8, paddingBottom: 20 }}
          />
        )
      ) : (
        <EmptyState
          icon="restaurant"
          title="No Dishes Found"
          description="Try adjusting your filters"
        />
      )}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    textAlign: 'center',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  categoriesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryFilter: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryFilterActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  categoryFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryFilterTextActive: {
    color: '#FFF',
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  foodGridItem: {
    width: '50%',
    padding: 6,
  },
  foodCard: {
    borderRadius: 12,
    overflow: 'hidden',
    aspectRatio: 1,
  },
  foodCardInner: {
    flex: 1,
  },
  imageBox: {
    width: '100%',
    height: '56%',
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
    fontSize: 9,
    fontWeight: '700',
  },
  vegBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10B981',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodInfo: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  foodName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  ratingText: {
    fontSize: 9,
    color: '#F59E0B',
    fontWeight: '600',
  },
  prepTime: {
    fontSize: 9,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  spice: {
    fontSize: 9,
    color: '#EF4444',
    fontWeight: '600',
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
    marginBottom: 6,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listImageBox: {
    width: 80,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flex: 1,
  },
  listFoodName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  listDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  listMeta: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 4,
  },
  listPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
  },
});
