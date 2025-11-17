# FlowForge 🌊 — No-Code DeFi for the BlockDAG Testnet

**Visit the live FlowForge site:** **[https://flowforgehq.netlify.app/](https://flowforgehq.netlify.app/)**

(Production preview hosted on Netlify.)

## The Vision: Democratizing DeFi on BlockDAG

FlowForge is the first native, no-code toolkit for the BlockDAG ecosystem. Our mission is to empower developers, DAOs, and hackathon teams to launch secure and powerful DeFi primitives without writing a single line of Solidity.

> **Value Proposition:** FlowForge transforms BlockDAG development by letting builders deploy secure, pre-audited DeFi contracts through a simple visual interface — reducing hours of Solidity work to minutes.

---

## The Problem: The DeFi Development Bottleneck

Developing secure DeFi applications is complex, time-consuming, and expensive. For a new and rapidly growing ecosystem like BlockDAG, this friction can slow down innovation and the growth of on-chain liquidity.

- **High Barrier to Entry:** Mastering Solidity, deployment scripts, and security audits takes months, if not years.
- **Security Risks:** Smart contract vulnerabilities are a constant threat. A single mistake can lead to catastrophic losses.
- **Slow Iteration:** For hackathon teams and indie developers, the time spent on contract development is time lost on building a unique user experience.

## The Solution: A Visual No-Code Factory

FlowForge provides a curated library of pre-audited smart contract templates. Users select a template, configure parameters through an intuitive UI, and deploy directly to the BlockDAG testnet.

- **Speed:** Launch a staking pool, vesting contract, or multi-sig wallet in under five minutes.
- **Security:** All templates are rigorously audited, minimizing risk and inspiring user trust.
- **Accessibility:** Opens the door for non-technical founders and community managers to build on BlockDAG.

---

## 🏗️ Architecture Overview

FlowForge is built on a modern, scalable web stack designed for a seamless user experience. The Wave 2 architecture validates the core user flow from wallet connection, on-chain deployment, to data persistence.

**Core User Flow:**

`User Connects Wallet (Wagmi)` → `Selects Template (Next.js UI)` → `Configures Parameters (React Hook Form)` → `Initiates Deployment (Viem)` → `Transaction Confirmed (BlockDAG Network)` → `Deployment is Recorded (Supabase)`

This clean, decoupled architecture allows us to add more contract templates in the future without re-architecting the application.

## ✅ Wave 2 Progress

Our focus for Wave 2 was to implement real, on-chain functionality. We have successfully integrated with the BlockDAG testnet, enabling users to deploy their first smart contract directly from our UI.

| Feature                 | Status       | Description                                                    |
| ----------------------- | ------------ | -------------------------------------------------------------- |
| **Wallet Integration**  | ✅ Completed | Connect MetaMask via Wagmi v2.                                 |
| **UI/UX Scaffold**      | ✅ Completed | Built with Next.js, ShadCN, and Tailwind.                      |
| **Real Deployment**     | ✅ Completed | **ERC-20 contracts are deployed live to the BlockDAG testnet.**   |
| **Network Integration** | ✅ Completed | Custom RPC proxy and `viem` configuration to handle BlockDAG. |
| **Database Connection** | ✅ Completed | Deployment data is successfully persisted to Supabase.         |
| **Explorer Links**      | ✅ Completed | Users can view their deployment transaction on the BlockDAG explorer. |
| **More Templates**      | 🔴 Planned     | ERC-721, Vesting, and other templates are planned for Wave 3.  |


## ⚙️ Tech Stack

| Layer                | Technology                                      | Purpose                               |
| -------------------- | ----------------------------------------------- | ------------------------------------- |
| **Frontend**         | Next.js (App Router) + TypeScript               | Application Framework & UI            |
| **Styling**          | TailwindCSS + ShadCN UI                         | Modern, Component-Based Design System |
| **Wallet**           | `wagmi` + `viem`                                  | EVM Wallet Connection & Interaction   |
| **Data Layer**       | Supabase                                        | Deployment Registry & History         |
| **Hosting**          | Vercel                                          | Global, Performant Deployments        |
| **Target Blockchain**| BlockDAG Testnet                                  | Core Deployment Target                |

---

## 🚀 Getting Started

You can run a local instance of the FlowForge prototype in just a few steps.

### 1. Prerequisites

- [Node.js](https://nodejs.org/en/) (v18.0 or later)
- [npm](https://www.npmjs.com/) (or yarn/pnpm)
- A MetaMask wallet (or any EIP-1193 compatible browser wallet)

### 2. Setup

Clone the repository and install the dependencies:

```bash
git clone https://github.com/theweb3wizard/FlowForge.git
cd FlowForge
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root of the project by copying the example file:

```bash
cp .env.local.example .env.local
```

Now, fill in your Supabase credentials in the `.env.local` file. You can get these from your Supabase project dashboard.

```bash
# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser to see the application.

---

## 🗺️ Project Roadmap

| Phase  | Core Deliverable                                     | Status      |
| ------ | ---------------------------------------------------- | ----------- |
| **Wave 1** | UI Scaffold & Mocked Backend                       | ✅ Completed  |
| **Wave 2** | **Real ERC-20 Deployment via BlockDAG RPC**        | ✅ **Completed** |
| **Wave 3** | Verified Contracts, Explorer Integration, & More Templates | 🚀 Final     |

## 🏆 Buildathon Alignment

FlowForge is more than just a dApp; it's a strategic infrastructure tool designed to accelerate the growth of the entire BlockDAG ecosystem.

- **Innovation:** As the **first native no-code builder for BlockDAG**, FlowForge addresses a critical gap in the developer toolkit.
- **Ecosystem Impact:** By reducing developer onboarding friction, we directly support the buildathon's goal of expanding BlockDAG's DeFi footprint.
- **Technical Foundation:** We've built a scalable, modern application scaffold, proving our ability to execute quickly and setting the stage for a seamless Wave 3 integration.

We are excited to bring more on-chain functionality to FlowForge in Wave 3 and contribute a foundational tool to the BlockDAG community.
