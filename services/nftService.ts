import axios from 'axios'
import { ContractMetadata } from '../types/filter'

export class NFTService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_ALCHEMY_API_KEY || ''
  }

  async fetchContractMetadata(address: string): Promise<ContractMetadata> {
    try {
      let response = await this.fetchFromChain('eth', address)
      let data = response.data

      if (this.isEmptyContract(data)) {
        response = await this.fetchFromChain('base', address)
        data = response.data
        return { ...data, chain: 'base' }
      }

      return { ...data, chain: 'eth' }
    } catch (error) {
      console.error('Error fetching contract metadata:', error)
      throw new Error('Failed to fetch contract metadata')
    }
  }

  private async fetchFromChain(chain: 'eth' | 'base', address: string) {
    return axios.get(
      `https://${chain}-mainnet.g.alchemy.com/nft/v3/${this.apiKey}/getContractMetadata`,
      {
        params: { contractAddress: address }
      }
    )
  }

  private isEmptyContract(data: ContractMetadata): boolean {
    return (
      data?.name === null &&
      data?.symbol === null &&
      data?.tokenType === 'NOT_A_CONTRACT'
    )
  }
} 