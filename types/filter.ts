export interface NFT {
  id: string
  name: string
  address: string
  holders?: any[]
}

export interface Filter {
  lowerFid: number
  upperFid: number
  showChannels: string[]
  mutedChannels: string[]
  isPowerBadgeHolder: boolean
  nftFilters: NFT[]
  nfts: NFT[]
  includeRecasts: boolean
}

export interface ContractMetadata {
  name: string | null
  symbol: string | null
  tokenType: string
  chain?: 'eth' | 'base'
  openSeaMetadata?: {
    imageUrl?: string
  }
} 