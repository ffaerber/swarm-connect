# swarm-connect

[![npm version](https://img.shields.io/npm/v/@ffaerber/swarm-connect.svg)](https://www.npmjs.com/package/@ffaerber/swarm-connect)
[![npm downloads](https://img.shields.io/npm/dm/@ffaerber/swarm-connect.svg)](https://www.npmjs.com/package/@ffaerber/swarm-connect)
[![license](https://img.shields.io/npm/l/@ffaerber/swarm-connect.svg)](./LICENSE)

A React connect-button and wizard for [Ethereum Swarm](https://www.ethswarm.org/) on the [Gnosis](https://www.gnosis.io/) chain. Drop in a single `<SwarmConnectButton />` and let users connect their wallet, verify a running Bee node, and pick a postage stamp — all from one modal.

📦 **npm:** [`@ffaerber/swarm-connect`](https://www.npmjs.com/package/@ffaerber/swarm-connect)

🐝 **Live demo on Swarm** — the example app is hosted on Swarm itself, at bzz reference:

```
476bbf2c20715a1003aaf3fa7a65dd7c36285a9cd6f2d5a1acb2f72b29c84394
```

Open it on any Bee node at `<bee>/bzz/476bbf2c20715a1003aaf3fa7a65dd7c36285a9cd6f2d5a1acb2f72b29c84394/`, or — once the content has propagated across the network — through a public gateway such as [bzz.link](https://476bbf2c20715a1003aaf3fa7a65dd7c36285a9cd6f2d5a1acb2f72b29c84394.bzz.link/).

## Features

- 🪜 **Gated sequential flow** — steps unlock in order: wallet → Gnosis network → wallet balance (xDAI / xBZZ) → Bee node → *(node wallet)* → postage stamp.
- 🦊 **Wallet connect** — wallet connection via [wagmi](https://wagmi.sh/) connectors, pinned to the Gnosis chain (ID `100`), with an xDAI balance/gas check.
- 🐝 **Bee node detection** — checks a Bee node's `/health` endpoint and surfaces its version.
- 🔧 **Editable node URL** — users can change the Bee node hostname from the modal and reconnect (defaults to `http://localhost:1633`); the chosen URL is persisted in `localStorage`.
- 🔑 **bee-manager support** — enter an API key in the modal (or pass `beeApiKey`) to connect through a [bee-manager](https://github.com/ffaerber/bee-manager) instead of a bare Bee node. The key is sent as `x-api-key` and checked against `/stamps`.
- 🎟️ **Postage stamp selection** — fetches available stamps from `/stamps` and lets the user pick one.
- 🎛️ **Per-dApp requirements** (`requirements: { xdai, xbzz, xbzzAllowance, nodeWallet, postageStamp }`) — each dApp declares what "connected" means for it. Disabled requirements drop their step from the modal and from `isFullyConnected`. E.g. a dApp that manages stamps itself uses `{ xdai: true, postageStamp: false }`.
- 🪙 **xBZZ as a platform token** (`xbzz: true`) — require the *user's connected wallet* to hold xBZZ (e.g. a token your platform uses). This checks the wallet balance and is independent of postage stamps.
- ✅ **xBZZ spending approval** (`xbzzAllowance: { spender }`) — for dApps whose contract pulls xBZZ from the user: a gated step where the user picks an amount with a slider (or unlimited) and approves your contract, can change it later, and sees how much is left to spend — so the button never says "connected" while writes would revert.
- 💸 **Node-wallet funding** (`nodeWallet: true`) — for dApps that buy stamps themselves: shows the Bee node's own wallet (`/wallet`) and lets the user top it up with xDAI + xBZZ from their connected wallet (one-time setup). The dApp then buys stamps programmatically via `stamps.createStamp()` — the modal itself never purchases.
- ✅ **At-a-glance status** — the button shows status dots for every gated step.
- 🧩 **Headless hooks** — use the `useSwarmConnect` / `useBeeNode` / `usePostageStamps` / `useNodeWallet` / `useXbzzAllowance` hooks to build your own UI.
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
      <SwarmConnectButton />
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
| `config` | `SwarmConnectConfig` | App-wide defaults (`beeApiUrl`, `requirements`) for every `useSwarmConnect` / `SwarmConnectButton` below it. Anything a component passes itself wins. |

### `<SwarmConnectButton>`

The connect button. Opens a dark-themed two-column modal — **Ethereum** (your wallet: connect, Gnosis network, xDAI/xBZZ balance) on the left, **Swarm** (the Bee node, node-wallet funding, postage stamp) on the right — with gated steps that unlock in order. Which steps appear depends on `requirements`: wallet, network, and Bee node are always present; the balance, node-wallet funding, and stamp-selection steps are included only when their requirement is enabled, and the numbering adapts. The widget ships its own scoped styles (no CSS import required); the `Space Grotesk` / `Inter` / `JetBrains Mono` fonts are used when present and fall back to system fonts otherwise.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `beeApiUrl` | `string` | last saved URL, else `http://localhost:1633` | Base URL of the Bee node API. Setting it pins the initial value and skips the `localStorage` restore. |
| `beeApiKey` | `string` | — | Initial API key, sent as `x-api-key`. Needed for a bee-manager; see [Connecting through bee-manager](#connecting-through-bee-manager). |
| `requirements` | `SwarmConnectRequirements` | `{ xdai: true, xbzz: false, xbzzAllowance: false, nodeWallet: false, postageStamp: true }` | Which requirements this dApp needs; disabled ones drop their step. See [Requirements](#requirements). |
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
    beeApiKey,        // current API key ('' when none)
    setBeeApiKey,     // change the API key at runtime, then re-check
    requirements,     // resolved { xdai, xbzz, xbzzAllowance, nodeWallet, postageStamp }
    isWalletConnected,
    address,
    isOnGnosis,
    chainId,
    balance,          // { xdai?, bzz?, isLoading, hasGas, hasBzz } — connected wallet on Gnosis
    allowance,        // { value?, approved?, minimum?, isLoading, isApproved, approve(amount?), isApproving, error? } — xBZZ allowance for xbzzAllowance.spender
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
const { isRunning, isChecking, version, isBeeManager, error, check } =
  useBeeNode('http://localhost:1633', apiKey /* optional */)
```

### `usePostageStamps(beeApiUrl?)`

Fetches, selects, and (for dApps that buy stamps themselves) creates postage stamps.

```tsx
const { stamps, isLoading, error, fetchStamps, selectedStampId, selectStamp,
        createStamp, isCreating, createError } =
  usePostageStamps('http://localhost:1633', apiKey /* optional */)

// Buy a batch via the node (cost = 2^depth × amount PLUR, paid by the node wallet):
const batchID = await createStamp({ amount: '1000000000', depth: 20, label: 'my-app' })
```

### `useNodeWallet(beeApiUrl?)`

Reads the Bee node's **own** wallet — the one that pays for postage stamps — from `GET /wallet` and `GET /addresses`.

```tsx
const { address, xdai, xbzz, isLoading, error, isFunded, refresh } =
  useNodeWallet('http://localhost:1633', apiKey /* optional */)
```

`isFunded` is true once the node wallet holds both xDAI (gas) and xBZZ (storage payment) — funding it is a **one-time setup**; returning users with a funded node skip the step automatically.

### `useXbzzAllowance(requirement)`

The connected wallet's xBZZ allowance for a spender contract, and a way to approve it. Pass `false` to turn it off.

```tsx
const { value, approved, minimum, isLoading, isApproved, approve, isApproving, error } =
  useXbzzAllowance({ spender: '0xYourContract', minimum: 5n * 10n ** 16n /* optional, PLUR; default 1 xBZZ */ })
```

`approve(amount?)` sends `approve(spender, amount)` from the connected wallet — calling it again changes the approval — and re-reads the allowance once it is mined. `amount` defaults to `minimum` (`maxUint256` when `minimum` is `0n`).

`value` is what the spender can still take; it goes down as the contract spends. The chain does not record the original amount, so `approved` is the amount last approved from this browser (kept in `localStorage`), and is left undefined when unknown or when the allowance was raised elsewhere since. `value` of `approved` is what is left.

## Configuration

```ts
interface SwarmConnectConfig {
  beeApiUrl?: string                      // initial Bee node URL; defaults to http://localhost:1633
  beeApiKey?: string                      // initial API key (x-api-key), e.g. for a bee-manager
  requirements?: SwarmConnectRequirements // which steps this dApp needs; see below
}
```

`beeApiUrl` is only the **initial** value, and only when it is set — omit it and the last URL the user saved is restored instead. Users can edit the node URL from the modal's Bee node step (or programmatically via `setBeeApiUrl` from `useSwarmConnect`), which re-checks the node at the new address and persists the choice in `localStorage` so it survives sign-out / sign-in. This is useful when the Bee node runs on a non-default host or port.

### Connecting through bee-manager

[bee-manager](https://github.com/ffaerber/bee-manager) sits in front of a Bee node and offers a Bee-compatible API, so the node doesn't have to be exposed to the internet. Every call except `/health` needs a per-app API key. Point `beeApiUrl` at the bee-manager and give the key, either as `beeApiKey` or by typing it into the Bee node step of the modal:

```tsx
<SwarmConnectButton beeApiUrl="https://stamps.example.org" requirements={{ nodeWallet: false }} />
```

- Once a key is set it goes out as `x-api-key` on every node request. With no key, no header is sent, so a plain Bee node needs no extra CORS setup.
- `/health` doesn't check the key, so the connection check also calls `/stamps`. A `401` shows as *API key rejected*. A bee-manager with no key never counts as online.
- `/stamps` returns only the batch that belongs to the key. bee-manager uses that batch for every upload, whatever batch ID the client sends.
- The node wallet (`/wallet`) and buying stamps are admin-only on bee-manager, so leave `nodeWallet` off.
- The key is saved in `localStorage` next to the URL, and removed from it when cleared. Only use a key that is meant to be used from a browser.
- The browser sends a CORS preflight for the `x-api-key` header, so the bee-manager must answer `OPTIONS` and allow your origin and that header.

### Requirements

Every dApp needs a connected wallet, the Gnosis chain, and a reachable Bee node — those steps are always present. The rest is per-dApp via `requirements`; a disabled requirement drops its step from the modal and is ignored by `isFullyConnected`:

```ts
interface SwarmConnectRequirements {
  xdai?: boolean         // default true  — connected wallet must hold xDAI for gas
  xbzz?: boolean         // default false — connected wallet must hold xBZZ (a platform token)
  xbzzAllowance?: { spender: `0x${string}`, minimum?: bigint /* PLUR, default 1 xBZZ */ } | false
                         // default false — connected wallet must have approved `spender` to spend its xBZZ
  nodeWallet?: boolean   // default false — the Bee node's own wallet funded (xDAI + xBZZ) to buy stamps
  postageStamp?: boolean // default true  — user must select a postage stamp in the modal
}
```

The two xBZZ-related options are deliberately separate, because they're about **different wallets**:

- **`xdai`** — adds an xDAI row to the *Balance* step (Ethereum column): the connected wallet's native xDAI on Gnosis, with a faucet link while empty. Disable for read-only dApps that never transact from the user's wallet.
- **`xbzz`** — adds an xBZZ row to the *Balance* step (Ethereum column): the **connected wallet's** xBZZ balance. Use this when your dApp requires the user to hold a platform token. This has nothing to do with postage stamps.
- **`xbzzAllowance`** — adds the *xBZZ approval* step (Ethereum column, after *Balance*): the connected wallet's ERC-20 allowance for `spender`, where the user picks an amount with a slider (from `minimum` up to their xBZZ balance, a typed amount, or unlimited) and approves it. Once approved, the step shows how much is left of the approved amount and a *change* button to approve a different amount. Use it when your contract pulls xBZZ from the user (`transferFrom`) — without an allowance every write reverts. `minimum` (in PLUR, 1 xBZZ = `10n ** 16n`) is the least allowance that counts and the slider's lower end. It defaults to **1 xBZZ**; set your own, e.g. `minimum: 5n * 10n ** 16n` for 5 xBZZ, or `0n` to accept any non-zero allowance. The same state is on the hook as `allowance`, or standalone via `useXbzzAllowance({ spender })`.
- **`nodeWallet`** — adds the *Node wallet* step (Swarm column): the **Bee node's own** xDAI/xBZZ balances (`GET /wallet`), with a one-time top-up (a native xDAI transfer plus an ERC-20 xBZZ transfer to the node's address) while empty. Enable when your dApp buys stamps itself — purchasing is your dApp's job via `stamps.createStamp({ amount, depth, label })` (`POST /stamps/{amount}/{depth}`); the modal never buys.
- **`postageStamp`** — adds the *Postage stamp* step where the user picks an existing stamp. Disable when the dApp manages stamps itself (e.g. it creates and tracks its own batches).

Example — a dApp that needs user gas but manages stamps itself:

```tsx
<SwarmConnectButton requirements={{ xdai: true, postageStamp: false }} />
```

"Fully connected" requires all of the following (skipping disabled requirements):

1. A connected wallet.
2. The wallet on the Gnosis chain (chain ID `100`).
3. *(`xdai`)* A non-zero xDAI balance on the connected wallet.
4. *(`xbzz`)* A non-zero xBZZ balance on the connected wallet.
5. *(`xbzzAllowance`)* An xBZZ allowance for `spender` of at least `minimum` (default 1 xBZZ).
6. A reachable Bee node (`/health` responds OK).
7. *(`nodeWallet`)* The Bee node's wallet funded with xDAI + xBZZ.
8. *(`postageStamp`)* A selected postage stamp.

## Development

```bash
npm install
npm run dev          # start the demo app (example/) on the Vite dev server
npm run type-check   # type-check without emitting
npm run build        # build the library + type declarations to dist/
```

### Demo app

`npm run dev` serves a playground in [`example/`](./example) for testing sign-in end to end. It shows **six connection scenarios side by side** — classic stamp selection, dApp-managed stamps (`postageStamp: false`), xBZZ as a platform token (`xbzz: true`), a contract that spends the user's xBZZ (`xbzzAllowance`), dApp-buys-stamps with node funding (`nodeWallet: true`), and a minimal node-only flow — each with its own `useSwarmConnect` instance and modal, so you can see how the gated steps adapt to `requirements`. Once a scenario is fully connected its card shows the live state: wallet address, chain, wallet xDAI/xBZZ, Bee node URL + version, the node's overlay address, node-wallet balances, and the selected postage stamp (as applicable). Point it at a running Bee node (defaults to `http://localhost:1633`, editable in each modal).

This same playground is the [live demo on Swarm](#swarm-connect) above. To rebuild and redeploy it as a static, content-addressed website:

```bash
npm run build:example   # static build into example-dist/ (relative paths for subpath serving)
BEE_API=https://your-bee-node POSTAGE_BATCH=<batchID> npm run deploy:swarm
```

`deploy:swarm` packs `example-dist/` and uploads it as a Swarm collection (`index.html` as the index document), printing the resulting `bzz` reference and gateway URLs.

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
