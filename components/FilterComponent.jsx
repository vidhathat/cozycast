import React, { useCallback, useEffect, useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import AsyncStorage from '@react-native-async-storage/async-storage'
import useAppContext from '../hooks/useAppContext'
import { useSearchChannel } from '../hooks/useSearchChannels'
import { debounce, set } from 'lodash'
import { LOCAL_STORAGE_KEYS } from '../constants/Farcaster'
import toast from 'react-hot-toast/headless'
import { eventEmitter } from '../utils/event'
import axios from 'axios'
import { useFilter } from '../hooks/useFilter'

const FilterModal = ({ visible, onClose }) => {
  const { filter, updateFilter } = useFilter()
  const [localFilter, setLocalFilter] = useState(filter)
  const [minFID, setMinFID] = useState(0)
  const [maxFID, setMaxFID] = useState(Infinity)
  const [searchChannels, setSearchChannels] = useState('')
  const [muteChannels, setMuteChannels] = useState('')
  const [fetchedChannels, setFetchedChannels] = useState([])
  const [fetchedMutedChannels, setFetchedMutedChannels] = useState([])
  const [selectedChannels, setSelectedChannels] = useState([])
  const [selectedMutedChannels, setSelectedMutedChannels] = useState([])
  const [isPowerBadgeHolder, setIsPowerBadgeHolder] = useState(false)
  const [nftSearchQuery, setNftSearchQuery] = useState('')
  const [nftSearchResults, setNftSearchResults] = useState([])
  const [selectedNFTs, setSelectedNFTs] = useState([])
  const [tokenGatedData, setTokenGatedData] = useState()
  const [loading, setLoading] = useState(false)
  const [contractAddress, setContractAddress] = useState('')
  const [contractMetadata, setContractMetadata] = useState(null)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [includeRecasts, setIncludeRecasts] = useState(true)

  useEffect(() => {
    if (filter) {
      setMinFID(filter.lowerFid || 0)
      setMaxFID(filter.upperFid === Infinity ? '' : filter.upperFid)
      setSelectedChannels(filter.showChannels || [])
      setSelectedMutedChannels(filter.mutedChannels || [])
      setIsPowerBadgeHolder(filter.isPowerBadgeHolder || false)
      setSelectedNFTs(filter.nfts || [])
      setIncludeRecasts(filter.includeRecasts)
    }
  }, [filter])

  const handleApply = useCallback(() => {
    const newFilter = {
      lowerFid: minFID,
      upperFid: maxFID === '' ? Infinity : maxFID,
      showChannels: selectedChannels,
      mutedChannels: selectedMutedChannels,
      isPowerBadgeHolder: isPowerBadgeHolder,
      nfts: selectedNFTs,
      includeRecasts: includeRecasts,
    }

    updateFilter(newFilter)
    onClose()
  }, [
    minFID,
    maxFID,
    selectedChannels,
    selectedMutedChannels,
    isPowerBadgeHolder,
    selectedNFTs,
    includeRecasts,
  ])

  const handleClearAll = useCallback(() => {
    const defaultFilter = {
      lowerFid: 0,
      upperFid: Infinity,
      showChannels: [],
      mutedChannels: [],
      isPowerBadgeHolder: false,
      nftFilters: [],
      nfts: [],
      includeRecasts: true,
    }
    setLocalFilter(defaultFilter)
    updateFilter(defaultFilter)
  }, [updateFilter])

  const handleSetMaxFID = (text) => {
    const numericValue = parseFloat(text)
    setMaxFID(!isNaN(numericValue) ? numericValue : '')
  }

  const handleAddChannel = (channel) => {
    setSearchChannels('')
    setSelectedChannels([...selectedChannels, channel.id])
    setFetchedChannels([])
  }

  const handleAddMuteChannel = (channel) => {
    setMuteChannels('')
    setSelectedMutedChannels([...selectedMutedChannels, channel.id])
    setFetchedMutedChannels([])
  }

  const debouncedSearch = useCallback(
    debounce(async (text) => {
      const { channels } = await useSearchChannel(text)
      setFetchedChannels(channels)
    }, 1000),
    [],
  )

  useEffect(() => {
    if (searchChannels?.length > 0) {
      debouncedSearch(searchChannels)
    }
    return () => {
      debouncedSearch.cancel()
    }
  }, [searchChannels, debouncedSearch])

  const debouncedMuteSearch = useCallback(
    debounce(async (text) => {
      const { channels } = await useSearchChannel(text)
      setFetchedMutedChannels(channels)
    }, 1000),
    [],
  )

  useEffect(() => {
    if (muteChannels?.length > 0) {
      debouncedMuteSearch(muteChannels)
    }
    return () => {
      debouncedMuteSearch.cancel()
    }
  }, [muteChannels, debouncedMuteSearch])

  const handleRemoveNFT = (nftId) => {
    setTokenGatedData()
    setSelectedNFTs(selectedNFTs.filter((nft) => nft.id !== nftId))
  }

  const fetchContractMetadata = useCallback(async (address) => {
    // console.log("Fetching metadata for address:", address);
    setIsLoadingMetadata(true)
    try {
      let apiKey = process.env.EXPO_PUBLIC_ALCHEMY_API_KEY
      let response = await axios.get(
        `https://eth-mainnet.g.alchemy.com/nft/v3/${apiKey}/getContractMetadata`,
        {
          params: { contractAddress: address },
        },
      )
      let data = response.data

      if (
        data?.name === null &&
        data?.symbol === null &&
        data?.tokenType === 'NOT_A_CONTRACT'
      ) {
        response = await axios.get(
          `https://base-mainnet.g.alchemy.com/nft/v3/${apiKey}/getContractMetadata`,
          {
            params: { contractAddress: address },
          },
        )
        data = response.data
        console.log('Contract metadata:', response.data)
        let newData = {
          chain: 'base',
          ...data,
        }
        setContractMetadata(newData)
      } else {
        let newData = {
          chain: 'eth',
          ...data,
        }
        setContractMetadata(newData)
      }
    } catch (error) {
      console.error('Error fetching contract metadata:', error)
      Alert.alert(
        'Error',
        'Failed to fetch contract metadata. Please check the address and try again.',
      )
    } finally {
      setIsLoadingMetadata(false)
    }
  }, [])

  const handleContractAddressChange = useCallback(
    (text) => {
      // console.log("Contract address changed to:", text);
      setContractAddress(text)
      if (text.length === 42 && text.startsWith('0x')) {
        fetchContractMetadata(text)
      } else {
        setContractMetadata(null)
      }
    },
    [fetchContractMetadata],
  )

  const handleAddContractNFT = () => {
    if (contractMetadata) {
      const newNFT = {
        id: contractAddress,
        name: contractMetadata.name || 'Unknown Name',
        address: contractAddress,
      }
      setSelectedNFTs([...selectedNFTs, newNFT])
      setContractAddress('')
      setContractMetadata(null)
    }
  }

  const toggleIncludeRecasts = () => {
    setIncludeRecasts((prev) => !prev)
    console.log('Include Recasts:', !includeRecasts)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome name="times" size={24} color="black" />
          </TouchableOpacity>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.header}>Filter</Text>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>FID Range</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text>Min</Text>
                  <TextInput
                    style={styles.input}
                    value={minFID?.toString()}
                    onChangeText={(text) => setMinFID(Number(text))}
                    keyboardType="numeric"
                    placeholder="Minimum FID"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text>Max</Text>
                  <TextInput
                    style={styles.input}
                    value={
                      maxFID?.toString() === 'Infinity'
                        ? ''
                        : maxFID?.toString()
                    }
                    onChangeText={handleSetMaxFID}
                    keyboardType="numeric"
                    placeholder="Maximum FID"
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>User Type</Text>
              <TouchableOpacity
                onPress={() => setIsPowerBadgeHolder(!isPowerBadgeHolder)}
                style={styles.checkboxContainer}
              >
                <Text style={styles.checkboxText}>
                  {isPowerBadgeHolder ? '✅' : '☐'} Power Badge Holder
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Channel Filters</Text>
              <Text style={styles.subSectionHeader}>Show Channels</Text>
              <TextInput
                style={styles.input}
                value={searchChannels}
                onChangeText={setSearchChannels}
                placeholder="Search channels to show"
              />
              {fetchedChannels?.slice(0, 5).map((channel) => (
                <TouchableOpacity
                  key={channel.id}
                  onPress={() => handleAddChannel(channel)}
                  style={styles.channelContainer}
                >
                  <Image
                    source={{ uri: channel.image_url }}
                    style={styles.channelImage}
                  />
                  <Text>{channel.name}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.chipContainer}>
                {selectedChannels.map((channel) => (
                  <View key={channel} style={styles.chip}>
                    <Text>{channel}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setSelectedChannels(
                          selectedChannels.filter((c) => c !== channel),
                        )
                      }
                    >
                      <FontAwesome name="times" size={16} color="black" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <Text style={styles.subSectionHeader}>Mute Channels</Text>
              <TextInput
                style={styles.input}
                value={muteChannels}
                onChangeText={setMuteChannels}
                placeholder="Search channels to mute"
              />
              {fetchedMutedChannels.map((channel) => (
                <TouchableOpacity
                  key={channel.id}
                  onPress={() => handleAddMuteChannel(channel)}
                  style={styles.channelContainer}
                >
                  <Image
                    source={{ uri: channel.image_url }}
                    style={styles.channelImage}
                  />
                  <Text>{channel.name}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.chipContainer}>
                {selectedMutedChannels?.slice(0, 5).map((channel) => (
                  <View key={channel} style={styles.chip}>
                    <Text>{channel}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setSelectedMutedChannels(
                          selectedMutedChannels.filter((c) => c !== channel),
                        )
                      }
                    >
                      <FontAwesome name="times" size={16} color="black" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              {loading && <ActivityIndicator size="large" color="#0000ff" />}

              <Text style={styles.subSectionHeader}>NFT Contract Address</Text>
              <TextInput
                style={styles.input}
                value={contractAddress}
                onChangeText={handleContractAddressChange}
                placeholder="Enter NFT contract address"
              />
              {isLoadingMetadata && (
                <ActivityIndicator size="small" color="#0000ff" />
              )}
              <View style={styles.chipContainer}>
              {selectedNFTs?.map((nft) => (
                      <View key={nft.id} style={styles.chip}>
                        <Text>{nft.name}</Text>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveNFT(nft.id)}
                        >
                          <FontAwesome name="times" size={16} color="black" />
                        </TouchableOpacity>
                      </View>
                ))}
                
              </View>
              {contractMetadata && (
                <View style={styles.contractMetadataContainer}>
                  <View style={styles.contractInfoRow}>
                    {contractMetadata.openSeaMetadata?.imageUrl && (
                      <Image
                        source={{
                          uri: contractMetadata.openSeaMetadata.imageUrl,
                        }}
                        style={styles.contractImage}
                      />
                    )}
                    <Text style={styles.contractName}>
                      {contractMetadata.name || 'Unknown'}
                    </Text>
                    <TouchableOpacity
                      onPress={handleAddContractNFT}
                      style={styles.addButtonContainer}
                    >
                      <Text style={styles.addButton}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* New toggle for Include Recasts */}
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>Include Recasts</Text>
                <Switch
                  value={includeRecasts}
                  onValueChange={toggleIncludeRecasts}
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearAll}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '100%',
    height: '90%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40, // Add extra padding at the bottom
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20, // Add padding to the bottom of the ScrollView content
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subSectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    color: '#555',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 5,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    margin: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  applyButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  channelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  channelImage: {
    width: 24,
    height: 24,
    borderRadius: 10,
    marginRight: 10,
  },
  contractMetadataContainer: {
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  contractInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contractImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  contractName: {
    fontSize: 16,
    flex: 1,
  },
  addButtonContainer: {
    marginLeft: 10,
  },
  addButton: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  checkboxText: {
    marginLeft: 10,
    fontSize: 16,
  },
  removeButton: {
    marginLeft: 5,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
})

export default React.memo(FilterModal)
