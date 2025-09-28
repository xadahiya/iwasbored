import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet], // Force mainnet for all operations
  connectors: [
    injected(),
  ],
  transports: {
    [mainnet.id]: http('https://eth-mainnet.public.blastapi.io'), // Use free Blast API
  },
})