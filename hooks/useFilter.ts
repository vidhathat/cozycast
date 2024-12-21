import { useCallback, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Filter, NFT } from '../types/filter'
import { LOCAL_STORAGE_KEYS } from '../constants/Farcaster'
import { eventEmitter } from '../utils/event'

const DEFAULT_FILTER: Filter = {
  lowerFid: 0,
  upperFid: Infinity,
  showChannels: [],
  mutedChannels: [],
  isPowerBadgeHolder: false,
  nftFilters: [],
  nfts: [],
  includeRecasts: true
}

export const useFilter = () => {
  const [filter, setFilter] = useState<Filter>(DEFAULT_FILTER)
  const [selectedNFTs, setSelectedNFTs] = useState<NFT[]>([])

  // Load initial filters from storage
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const savedFilters = await AsyncStorage.getItem(LOCAL_STORAGE_KEYS.FILTERS)
        if (savedFilters) {
          const parsedFilters = JSON.parse(savedFilters)
          setFilter(parsedFilters)
          setSelectedNFTs(parsedFilters.nfts || [])
        }
      } catch (error) {
        console.error('Error loading filters:', error)
      }
    }
    loadFilters()
  }, [])

  const updateFilter = useCallback(async (newFilter: Filter) => {
    try {
      setFilter(newFilter)
      setSelectedNFTs(newFilter.nfts || [])
      await AsyncStorage.setItem(
        LOCAL_STORAGE_KEYS.FILTERS,
        JSON.stringify(newFilter)
      )
      eventEmitter.emit('filtersUpdated', newFilter)
    } catch (error) {
      console.error('Error saving filters:', error)
    }
  }, [])

  const clearFilter = useCallback(async () => {
    await updateFilter(DEFAULT_FILTER)
    setSelectedNFTs([])
  }, [updateFilter])

  return {
    filter,
    selectedNFTs,
    updateFilter,
    clearFilter
  }
} 