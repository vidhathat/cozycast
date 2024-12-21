import React from 'react'
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { NFT } from '../../types/filter'

interface NFTSectionProps {
  searchQuery: string
  onSearchChange: (text: string) => void
  searchResults: NFT[]
  onAddNFT: (nft: NFT) => void
  selectedNFTs: NFT[]
  onRemoveNFT: (id: string) => void
  loading: boolean
}

export const NFTSection: React.FC<NFTSectionProps> = ({
  searchQuery,
  onSearchChange,
  searchResults,
  onAddNFT,
  selectedNFTs,
  onRemoveNFT,
  loading
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>NFT Token Gate</Text>
      <TextInput
        style={styles.input}
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder="Search for NFTs"
      />
      
      {loading && <ActivityIndicator size="small" color="#0000ff" />}
      
      {searchResults.map((nft) => (
        <TouchableOpacity
          key={nft.id}
          onPress={() => onAddNFT(nft)}
          style={styles.channelContainer}
        >
          <Text>{nft.name}</Text>
        </TouchableOpacity>
      ))}
      
      <View style={styles.chipContainer}>
        {selectedNFTs?.map((nft) => (
          <View key={nft.id} style={styles.chip}>
            <Text>{nft.name}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemoveNFT(nft.id)}
            >
              <FontAwesome name="times" size={16} color="black" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
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