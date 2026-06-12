# swarm-connect

[![npm version](https://img.shields.io/npm/v/@ffaerber/swarm-connect.svg)](https://www.npmjs.com/package/@ffaerber/swarm-connect)
[![npm downloads](https://img.shields.io/npm/dm/@ffaerber/swarm-connect.svg)](https://www.npmjs.com/package/@ffaerber/swarm-connect)
[![license](https://img.shields.io/npm/l/@ffaerber/swarm-connect.svg)](./LICENSE)

A React connect-button and wizard for [Ethereum Swarm](https://www.ethswarm.org/) on the [Gnosis](https://www.gnosis.io/) chain. Drop in a single `<SwarmConnectButton />` and let users connect their wallet, verify a running Bee node, and pick a postage stamp — all from one modal.

📦 **npm:** [`@ffaerber/swarm-connect`](https://www.npmjs.com/package/@ffaerber/swarm-connect)

## Features

- 🪜 **Gated sequential flow** — steps unlock in order: wallet → Gnosis network → xDAI gas → Bee node → *(node wallet)* → postage stamp.
- 🦊 **Wallet connect** — wallet connection via [wagmi](https://wagmi.sh/) connectors, pinned to the Gnosis chain (ID `100`), with an xDAI balance/gas check.
- 🐝 **Bee node detection** — checks a Bee node's `/health` endpoint and surfaces its version.
- 🔧 **Editable node URL** — users can change the Bee node hostname from the modal and reconnect (defaults to `http://localhost:1633`); the chosen URL is persisted in `localStorage`.
- 🎟️ **Postage stamp selection** — fetches available stamps from `/stamps` and lets the user pick one.
- 💸 **Stamp-create mode** (`stampMode: 'create'`) — for dApps that buy stamps themselves: shows the Bee node's own wallet (`/wallet`), lets the user top it up with xDAI + xBZZ from their connected wallet (one-time setup), and buy stamps right from the modal (`POST /stamps`).
- ✅ **At-a-glance status** — the button shows status dots for every gated step.
- 🧩 **Headless hooks** — use the `useSwarmConnect` / `useBeeNode` / `usePostageStamps` / `useNodeWallet` hooks to build your own UI.
- 🎨 **Self-contained dark theme** — scoped CSS variables and inline styles, no CSS import required.

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

The connect button. Opens a dark-themed modal with sequential, gated steps — **1.** wallet, **2.** network (Gnosis), **3.** xDAI balance, **4.** Bee node, and **5.** postage stamp — where each step unlocks only once the previous one is satisfied. With `stampMode="create"` a **node wallet** step is inserted before the stamp step (making it six steps): it reads the Bee node's own wallet and, if it's empty, lets the user send it xDAI + xBZZ from their connected wallet so the node can buy postage stamps. The widget ships its own scoped styles (no CSS import required); the `Space Grotesk` / `Inter` / `JetBrains Mono` fonts are used when present and fall back to system fonts otherwise.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `beeApiUrl` | `string` | `http://localhost:1633` | Base URL of the Bee node API. |
| `stampMode` | `'select' \| 'create'` | `'select'` | `'select'`: only pick existing stamps. `'create'`: also fund the node wallet and buy stamps from the modal. |
| `label` | `string` | auto | Overrides the button label. Defaults to `Connect to Swarm`, or the truncated address once fully connected. |

### `<SwarmConnectModal>`

The modal rendered by `SwarmConnectButton`. Exported for advanced use if you want to manage open/close state yourself.

## Hooks

### `useSwarmConnect(config?)`

The top-level hook combining wallet, network, balance, node, node-wallet, and stamp state.

```tsx
import { useSwarmConnect } from '@ffaerber/swarm-connect'

function Status() {
  const {
    beeNode,          // { isRunning, isChecking, version?, error?, check() }
    stamps,           // { stamps, isLoading, error?, fetchStamps(), selectedStampId?, selectStamp(), createStamp(), isCreating, createError? }
    nodeWallet,       // { address?, xdai?, xbzz?, isLoading, error?, isFunded, refresh() } — the node's own wallet
    beeApiUrl,        // current Bee node URL
    setBeeApiUrl,     // change the Bee node URL at runtime, then re-check
    stampMode,        // 'select' | 'create'
    isWalletConnected,
    address,
    isOnGnosis,
    chainId,
    balance,          // { xdai?, isLoading, hasGas } — native xDAI on Gnosis
    isFullyConnected, // wallet + Gnosis + xDAI gas + node (+ funded node wallet in create mode) + stamp
  } = useSwarmConnect({ beeApiUrl: 'http://localhost:1633', stampMode: 'create' })

  return <span>{isFullyConnected ? 'Ready' : 'Not connected'}</span>
}
```

### `useBeeNode(beeApiUrl?)`

Checks a Bee node's health.

```tsx
const { isRunning, isChecking, version, error, check } = useBeeNode('http://localhost:1633')
```

### `usePostageStamps(beeApiUrl?)`

Fetches, selects, and (in create-mode UIs) buys postage stamps.

```tsx
const { stamps, isLoading, error, fetchStamps, selectedStampId, selectStamp,
        createStamp, isCreating, createError } =
  usePostageStamps('http://localhost:1633')

// Buy a batch via the node (cost = 2^depth × amount PLUR, paid by the node wallet):
const batchID = await createStamp({ amount: '1000000000', depth: 20, label: 'my-app' })
```

### `useNodeWallet(beeApiUrl?)`

Reads the Bee node's **own** wallet — the one that pays for postage stamps — from `GET /wallet` and `GET /addresses`.

```tsx
const { address, xdai, xbzz, isLoading, error, isFunded, refresh } =
  useNodeWallet('http://localhost:1633')
```

`isFunded` is true once the node wallet holds both xDAI (gas) and xBZZ (storage payment) — funding it is a **one-time setup**; returning users with a funded node skip the step automatically.

## Configuration

```ts
interface SwarmConnectConfig {
  beeApiUrl?: string             // initial Bee node URL; defaults to http://localhost:1633
  stampMode?: 'select' | 'create' // defaults to 'select'
}
```

`beeApiUrl` is only the **initial** value. Users can edit the node URL from the modal's Bee node step (or programmatically via `setBeeApiUrl` from `useSwarmConnect`), which re-checks the node at the new address and persists the choice in `localStorage` so it survives sign-out / sign-in. This is useful when the Bee node runs on a non-default host or port.

### Stamp modes

Swarm splits responsibilities between two wallets: the **user's wallet** only needs xDAI for gas, while the **Bee node's wallet** needs xDAI *and* xBZZ because it is the one buying postage stamps on chain.

- **`'select'`** (default) — the dApp only uses stamps the user already created. No xBZZ, no node funding, no on-chain spending from the modal.
- **`'create'`** — the dApp can buy stamps. The modal gains a *node wallet* step that shows the node's xDAI/xBZZ balances and, while they're empty, offers a one-time top-up (a native xDAI transfer plus an ERC-20 xBZZ transfer to the node's address). The stamp step then also offers a *buy stamp* form (`POST /stamps/{amount}/{depth}`).

"Fully connected" requires all of the following:

1. A connected wallet.
2. The wallet on the Gnosis chain (chain ID `100`).
3. A non-zero xDAI balance on that wallet (gas for its own transactions).
4. A reachable Bee node (`/health` responds OK).
5. *(create mode only)* The node's wallet funded with xDAI + xBZZ.
6. A selected postage stamp.

## Development

```bash
npm install
npm run dev          # start the demo app (example/) on the Vite dev server
npm run type-check   # type-check without emitting
npm run build        # build the library + type declarations to dist/
```

### Demo app

`npm run dev` serves a small playground in [`example/`](./example) for testing sign-in end to end. It renders the connect button and, once you're fully connected, shows the live state — wallet address, chain, xDAI balance, Bee node URL + version, the node's overlay (Bee) address, and the selected postage stamp. Point it at a running Bee node (defaults to `http://localhost:1633`, editable in the modal).

**`ENOSPC: System limit for number of file watchers reached`?** Your machine's inotify watch limit is exhausted. Either:

- **Quick fix** — run the dev server in polling mode: `npm run dev:poll`.
- **Permanent fix** — raise the system limit:

  ```bash
  echo 'fs.inotify.max_user_watches=524288' | sudo tee /etc/sysctl.d/99-inotify.conf
  sudo sysctl -p /etc/sysctl.d/99-inotify.conf
  ```

The library is built with Vite in library mode and ships ESM (`swarm-connect.js`), CommonJS (`swarm-connect.umd.cjs`), and TypeScript declarations. `react`, `react-dom`, `wagmi`, `viem`, and `@tanstack/react-query` are externalized.

## License

MIT
