# swarm-connect

A React connect-button and wizard for [Ethereum Swarm](https://www.ethswarm.org/) on the [Gnosis](https://www.gnosis.io/) chain. Drop in a single `<SwarmConnectButton />` and let users connect their wallet, verify a running Bee node, and pick a postage stamp — all from one modal.

## Features

- 🐝 **Bee node detection** — checks a Bee node's `/health` endpoint and surfaces its version.
- 🎟️ **Postage stamp selection** — fetches available stamps from `/stamps` and lets the user pick one.
- 🦊 **Wallet connect** — injected-wallet connection via [wagmi](https://wagmi.sh/), pinned to Gnosis chain (ID `100`).
- ✅ **At-a-glance status** — the button shows status dots for node, stamp, wallet, and network.
- 🧩 **Headless hooks** — use the `useSwarmConnect` / `useBeeNode` / `usePostageStamps` hooks to build your own UI.
- 🎨 **Zero-dependency styling** — inline styles, no CSS imports required.

## Installation

```bash
npm install @ffaerber/swarm-connect
```

### Peer dependencies

This package expects the following to be installed in your app:

```bash
npm install react react-dom wagmi viem @tanstack/react-query
```

| Package | Version |
| --- | --- |
| `react` | `>=18` |
| `react-dom` | `>=18` |
| `wagmi` | `>=2` |
| `viem` | `>=2` |
| `@tanstack/react-query` | `>=5` |

## Quick start

Wrap your app in `SwarmConnectProvider` and drop in the button:

```tsx
import { SwarmConnectProvider, SwarmConnectButton } from '@ffaerber/swarm-connect'

export function App() {
  return (
    <SwarmConnectProvider>
      <SwarmConnectButton beeApiUrl="http://localhost:1633" />
    </SwarmConnectProvider>
  )
}
```

`SwarmConnectProvider` sets up wagmi (Gnosis chain + injected connector) and a React Query client for you. If your app already has its own `WagmiProvider` and `QueryClientProvider`, you can skip the provider and use `SwarmConnectButton` directly.

## Components

### `<SwarmConnectProvider>`

Provides the wagmi and React Query context. Configured for the Gnosis chain with an injected connector.

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `ReactNode` | Your app. |
| `config` | `SwarmConnectConfig` | Optional configuration. |

### `<SwarmConnectButton>`

The connect button. Opens a two-tab modal (**Swarm** for the Bee node + postage stamp, **Wallet** for connecting your wallet).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `beeApiUrl` | `string` | `http://localhost:1633` | Base URL of the Bee node API. |
| `label` | `string` | auto | Overrides the button label. Defaults to `Connect to Swarm`, or the truncated address once fully connected. |

### `<SwarmConnectModal>`

The modal rendered by `SwarmConnectButton`. Exported for advanced use if you want to manage open/close state yourself.

## Hooks

### `useSwarmConnect(config?)`

The top-level hook combining node, stamp, wallet, and network state.

```tsx
import { useSwarmConnect } from '@ffaerber/swarm-connect'

function Status() {
  const {
    beeNode,          // { isRunning, isChecking, version?, error?, check() }
    stamps,           // { stamps, isLoading, error?, fetchStamps(), selectedStampId?, selectStamp() }
    isWalletConnected,
    address,
    isOnGnosis,
    chainId,
    isFullyConnected, // node running + stamp selected + wallet connected + on Gnosis
  } = useSwarmConnect({ beeApiUrl: 'http://localhost:1633' })

  return <span>{isFullyConnected ? 'Ready' : 'Not connected'}</span>
}
```

### `useBeeNode(beeApiUrl?)`

Checks a Bee node's health.

```tsx
const { isRunning, isChecking, version, error, check } = useBeeNode('http://localhost:1633')
```

### `usePostageStamps(beeApiUrl?)`

Fetches and selects postage stamps.

```tsx
const { stamps, isLoading, error, fetchStamps, selectedStampId, selectStamp } =
  usePostageStamps('http://localhost:1633')
```

## Configuration

```ts
interface SwarmConnectConfig {
  beeApiUrl?: string // defaults to http://localhost:1633
}
```

"Fully connected" requires all of the following:

1. A reachable Bee node (`/health` responds OK).
2. A selected postage stamp.
3. A connected wallet.
4. The wallet on the Gnosis chain (chain ID `100`).

## Development

```bash
npm install
npm run dev          # start Vite dev server
npm run type-check   # type-check without emitting
npm run build        # build the library + type declarations to dist/
```

The library is built with Vite in library mode and ships ESM (`swarm-connect.js`), CommonJS (`swarm-connect.umd.cjs`), and TypeScript declarations. `react`, `react-dom`, `wagmi`, `viem`, and `@tanstack/react-query` are externalized.

## License

MIT
