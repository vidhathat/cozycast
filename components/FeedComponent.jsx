import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, RefreshControl } from 'react-native'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { FlashList } from '@shopify/flash-list'
import Cast from './Cast'
import FilterModal from './FilterModal'
import { Notifications } from './Notification'
import { FontAwesome } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import toast from 'react-hot-toast/headless'
import axios from 'axios'

const FEED_TYPES = {
  HOME_FEED: 'home',
  GLOBAL_FEED: 'global',
}

const FILTER_STORAGE_KEY = '@filter_settings'

const FeedComponent = ({ fid }) => {
  const [activeTab, setActiveTab] = useState(FEED_TYPES.HOME_FEED)
  const [casts, setCasts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [cursor, setCursor] = useState('')
  const [isFilterVisible, setFilterVisible] = useState(false)
  const [filters, setFilters] = useState({
    minFID: 0,
    maxFID: Infinity,
    isPowerBadgeHolder: false,
    selectedChannels: [],
    mutedChannels: [],
    includeRecasts: true,
    selectedNFTs: [],
  })
  const [nftCasts, setNftCasts] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadSavedFilters()
  }, [])

  useEffect(() => {
    if (filters.selectedNFTs?.length > 0) {
      fetchNFTCasts()
    }
  }, [filters.selectedNFTs])

  const loadSavedFilters = async () => {
    try {
      const savedFilters = await AsyncStorage.getItem(FILTER_STORAGE_KEY)
      if (savedFilters) {
        setFilters(JSON.parse(savedFilters))
      }
    } catch (error) {
      console.error('Error loading filters:', error)
      showErrorToast('Failed to load filters')
    }
  }

  const saveFilters = async (newFilters) => {
    try {
      await AsyncStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(newFilters))
      return true
    } catch (error) {
      console.error('Error saving filters:', error)
      showErrorToast('Failed to save filters')
      return false
    }
  }

  const handleApplyFilters = async (newFilters) => {
    const saved = await saveFilters(newFilters)
    if (saved) {
      setFilters(newFilters)
      setFilterVisible(false)
      
      // Show success toast with filter summary
      const filterSummary = []
      if (newFilters.minFID > 0) filterSummary.push(`Min FID: ${newFilters.minFID}`)
      if (newFilters.maxFID !== Infinity) filterSummary.push(`Max FID: ${newFilters.maxFID}`)
      if (newFilters.isPowerBadgeHolder) filterSummary.push('Power Badge Holders')
      if (newFilters.selectedChannels.length) filterSummary.push(`${newFilters.selectedChannels.length} channels`)
      if (newFilters.mutedChannels.length) filterSummary.push(`${newFilters.mutedChannels.length} muted`)
      if (!newFilters.includeRecasts) filterSummary.push('No recasts')

      const message = filterSummary.length 
        ? `Filters applied: ${filterSummary.join(', ')}`
        : 'All filters cleared'

      toast.success(message)
    }
  }

  const fetchCasts = async (type = FEED_TYPES.HOME_FEED, userFid = 616) => {
    try {
      setIsLoading(true)
      const apiKey = ''

      let feedUrl
      if (type === FEED_TYPES.HOME_FEED) {
        feedUrl = `https://api.neynar.com/v2/farcaster/feed?feed_type=following&fid=${userFid}&limit=100&cursor=${cursor}`
      } else if (type === FEED_TYPES.GLOBAL_FEED) {
        feedUrl = `https://api.neynar.com/v2/farcaster/feed?feed_type=filter&filter_type=global_trending&with_recasts=true&limit=100&cursor=${cursor}`
      }

      const response = await fetch(feedUrl, {
        headers: {
          Accept: 'application/json',
          api_key: apiKey,
        },
      })

      const data = await response.json()
      setCasts((prev) => [...prev, ...data.casts])
      setCursor(data.next?.cursor || '')
      setIsLoading(false)
    } catch (error) {
      console.log('ERROR FETCHING CASTS', error)
      setIsLoading(false)
      showErrorToast('Failed to fetch casts')
    }
  }

  const fetchNFTHolders = useCallback(async (nft) => {
    try {
      const response = await axios.get(`https://cozycast-backend.vercel.app/nft-holders/${nft.address}`)
      return response.data
    } catch (error) {
      console.error('Error fetching NFT holders:', error)
      return { feed: { casts: [] } }
    }
  }, [])

  const fetchNFTCasts = useCallback(async () => {
    try {
      const nftResults = await Promise.all(
        filters.selectedNFTs.map(nft => fetchNFTHolders(nft))
      )

      const existingHashes = new Set(casts.map(cast => cast.hash))
      const newNFTCasts = nftResults
        .flatMap(result => result?.feed?.casts || [])
        .filter(Boolean)
        .filter(cast => !existingHashes.has(cast.hash))

      setNftCasts(newNFTCasts)
    } catch (error) {
      console.error('Error fetching NFT casts:', error)
      showErrorToast('Failed to fetch NFT casts')
    }
  }, [filters.selectedNFTs, casts, fetchNFTHolders])

  const filterCasts = useCallback((castsToFilter) => {
    if (!castsToFilter) return []
    
    // Only include NFT casts in home feed
    let allCasts = activeTab === FEED_TYPES.HOME_FEED 
      ? [...nftCasts, ...castsToFilter]
      : [...castsToFilter]
    
    return allCasts.filter(cast => {
      if (!cast?.author) return false
      
      // FID Range filter - Only apply if values are set
      const authorFid = cast.author.fid
      if ((filters.minFID > 0 && authorFid < filters.minFID) || 
          (filters.maxFID !== null && filters.maxFID !== Infinity && authorFid > filters.maxFID)) {
        return false
      }

      // Power Badge filter - Only apply if enabled
      if (filters.isPowerBadgeHolder && !cast.author.power_badge) {
        return false
      }

      // Channel filters - Only apply if channels are selected
      if (filters.selectedChannels.length > 0) {
        if (!cast.channel || !filters.selectedChannels.includes(cast.channel.name)) {
          return false
        }
      }

      // Muted channels
      if (cast.channel && filters.mutedChannels.includes(cast.channel.name)) {
        return false
      }

      // Recast filter
      if (!filters.includeRecasts && cast.reactions.recasts_count > 0) {
        return false
      }

      return true
    })
  }, [nftCasts, filters, activeTab])

  const loadMore = () => {
    if (!isLoading && cursor) {
      fetchCasts(activeTab, fid)
    }
  }

  useEffect(() => {
    if (fid) {
      setCasts([])
      setCursor('')
      fetchCasts(activeTab, fid)
    }
  }, [activeTab, fid])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    setCasts([])
    setCursor('')
    setNftCasts([])
    
    try {
      await fetchCasts(activeTab, fid)
      if (filters.selectedNFTs?.length > 0) {
        await fetchNFTCasts()
      }
    } finally {
      setRefreshing(false)
    }
  }, [activeTab, fid, filters.selectedNFTs, fetchNFTCasts])

  const renderContent = () => {
    const filteredCasts = filterCasts(casts)

    if (isLoading && casts.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading casts...</Text>
        </View>
      )
    }

    if (!isLoading && filteredCasts.length === 0) {
      return (
        <View style={styles.noContentContainer}>
          <Text style={styles.noContentText}>
            No casts for the current filter.
          </Text>
          <Text style={styles.noContentText}>
            Try tweaking your filter or head back to the default view by
            resetting?
          </Text>
          <TouchableOpacity 
            style={styles.applyButton} 
            onPress={() => handleApplyFilters({
              minFID: 0,
              maxFID: Infinity,
              isPowerBadgeHolder: false,
              selectedChannels: [],
              mutedChannels: [],
              includeRecasts: true,
            })}
          >
            <Text style={styles.applyButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <FlashList
        data={filteredCasts}
        renderItem={({ item }) => <Cast cast={item} />}
        estimatedItemSize={150}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            colors={["#007AFF"]} // Android
            progressBackgroundColor="#ffffff" // Android
          />
        }
        ListFooterComponent={
          isLoading ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : null
        }
      />
    )
  }


  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab(FEED_TYPES.HOME_FEED)}
          style={styles.filterButton}
        >
          <Text
            style={[
              styles.filterText,
              activeTab === FEED_TYPES.HOME_FEED && styles.activeText,
            ]}
          >
            Following
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab(FEED_TYPES.GLOBAL_FEED)}
          style={styles.filterButton}
        >
          <Text
            style={[
              styles.filterText,
              activeTab === FEED_TYPES.GLOBAL_FEED && styles.activeText,
            ]}
          >
            Global
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterVisible(true)}
        >
          <FontAwesome
            name="filter"
            size={18}
            color="#565555"
            style={styles.filterIcon}
          />
        </TouchableOpacity>
      </View>

      {renderContent()}
      
      <FilterModal
        visible={isFilterVisible}
        onClose={() => setFilterVisible(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />
      <Notifications />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 20,
  },
  filterText: {
    fontSize: 16,
    color: '#808080',
  },
  activeText: {
    color: '#000000',
    fontWeight: '600',
  },
  filterBtn: {
    position: 'absolute',
    right: 20,
    top: 10,
    bottom: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  noContentText: {
    color: 'black',
    fontSize: 24,
    marginBottom: 20,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
  },
  applyButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
})

export default FeedComponent
