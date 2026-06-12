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
- 🎛️ **Per-dApp requirements** (`requirements: { xdai, xbzz, postageStamp }`) — each dApp declares what "connected" means for it. Disabled requirements drop their step from the modal and from `isFullyConnected`. E.g. a dApp that manages stamps itself uses `{ xdai: true, xbzz: false, postageStamp: false }`.
- 💸 **Node-wallet funding** (`xbzz: true`) — for dApps that buy stamps themselves: shows the Bee node's own wallet (`/wallet`) and lets the user top it up with xDAI + xBZZ from their connected wallet (one-time setup). The dApp then buys stamps programmatically via `stamps.createStamp()` — the modal itself never purchases.
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

The connect button. Opens a dark-themed modal with sequential, gated steps — wallet → network (Gnosis) → xDAI balance → Bee node → node wallet → postage stamp — where each step unlocks only once the previous one is satisfied. Which steps appear depends on `requirements`: wallet, network, and Bee node are always present; the xDAI balance, node-wallet funding, and stamp-selection steps are included only when their requirement is enabled, and the numbering adapts. The widget ships its own scoped styles (no CSS import required); the `Space Grotesk` / `Inter` / `JetBrains Mono` fonts are used when present and fall back to system fonts otherwise.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `beeApiUrl` | `string` | `http://localhost:1633` | Base URL of the Bee node API. |
| `requirements` | `SwarmConnectRequirements` | `{ xdai: true, xbzz: false, postageStamp: true }` | Which requirements this dApp needs; disabled ones drop their step. See [Requirements](#requirements). |
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
    requirements,     // resolved { xdai, xbzz, postageStamp } booleans
    isWalletConnected,
    address,
    isOnGnosis,
    chainId,
    balance,          // { xdai?, isLoading, hasGas } — native xDAI on Gnosis
    isFullyConnected, // wallet + Gnosis + node + every enabled requirement
  } = useSwarmConnect({
    beeApiUrl: 'http://localhost:1633',
    // this dApp needs user gas, but manages stamps itself:
    requirements: { xdai: true, xbzz: false, postageStamp: false },
  })

  return <span>{isFullyConnected ? 'Ready' : 'Not connected'}</span>
}
```

### `useBeeNode(beeApiUrl?)`

Checks a Bee node's health.

```tsx
const { isRunning, isChecking, version, error, check } = useBeeNode('http://localhost:1633')
```

### `usePostageStamps(beeApiUrl?)`

Fetches, selects, and (for dApps that buy stamps themselves) creates postage stamps.

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
  beeApiUrl?: string                      // initial Bee node URL; defaults to http://localhost:1633
  requirements?: SwarmConnectRequirements // which steps this dApp needs; see below
}
```

`beeApiUrl` is only the **initial** value. Users can edit the node URL from the modal's Bee node step (or programmatically via `setBeeApiUrl` from `useSwarmConnect`), which re-checks the node at the new address and persists the choice in `localStorage` so it survives sign-out / sign-in. This is useful when the Bee node runs on a non-default host or port.

### Requirements

Every dApp needs a connected wallet, the Gnosis chain, and a reachable Bee node — those steps are always present. The rest is per-dApp via `requirements`; a disabled requirement drops its step from the modal and is ignored by `isFullyConnected`:

```ts
interface SwarmConnectRequirements {
  xdai?: boolean         // default true  — user wallet must hold xDAI for gas
  xbzz?: boolean         // default false — node wallet funded (xDAI + xBZZ) so the dApp can buy stamps
  postageStamp?: boolean // default true  — user must select a postage stamp in the modal
}
```

- **`xdai`** — adds the *Balance* step: shows the connected wallet's native xDAI on Gnosis and links a faucet while it's empty. Disable for read-only dApps that never transact from the user's wallet.
- **`xbzz`** — adds the *Node wallet* step: shows the Bee node's own xDAI/xBZZ balances (`GET /wallet`) and, while they're empty, offers a one-time top-up (a native xDAI transfer plus an ERC-20 xBZZ transfer to the node's address). Enable when your dApp buys stamps itself — purchasing is your dApp's job via `stamps.createStamp({ amount, depth, label })` (`POST /stamps/{amount}/{depth}`); the modal never buys.
- **`postageStamp`** — adds the *Postage stamp* step where the user picks an existing stamp. Disable when the dApp manages stamps itself (e.g. it creates and tracks its own batches).

Example — a dApp that needs user gas but manages stamps itself:

```tsx
<SwarmConnectButton requirements={{ xdai: true, xbzz: false, postageStamp: false }} />
```

"Fully connected" requires all of the following (skipping disabled requirements):

1. A connected wallet.
2. The wallet on the Gnosis chain (chain ID `100`).
3. *(`xdai`)* A non-zero xDAI balance on that wallet.
4. A reachable Bee node (`/health` responds OK).
5. *(`xbzz`)* The node's wallet funded with xDAI + xBZZ.
6. *(`postageStamp`)* A selected postage stamp.

## Development

```bash
npm install
npm run dev          # start the demo app (example/) on the Vite dev server
npm run type-check   # type-check without emitting
npm run build        # build the library + type declarations to dist/
```

### Demo app

`npm run dev` serves a playground in [`example/`](./example) for testing sign-in end to end. It shows **four connection scenarios side by side** — classic stamp selection, dApp-managed stamps (`postageStamp: false`), dApp-buys-stamps with node funding (`xbzz: true`), and a minimal node-only flow — each with its own `useSwarmConnect` instance and modal, so you can see how the gated steps adapt to `requirements`. Once a scenario is fully connected its card shows the live state: wallet address, chain, xDAI balance, Bee node URL + version, the node's overlay address, node-wallet balances, and the selected postage stamp (as applicable). Point it at a running Bee node (defaults to `http://localhost:1633`, editable in each modal).

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
