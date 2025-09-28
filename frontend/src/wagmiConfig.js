import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [mainnet.id]: http('https://eth-mainnet.public.blastapi.io'),
    [sepolia.id]: http('https://eth-sepolia.public.blastapi.io'),
  },
})