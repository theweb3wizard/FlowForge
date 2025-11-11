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

FlowForge is built on a modern, scalable web stack designed for a seamless user experience. The Wave 1 architecture validates the core user flow from wallet connection to deployment data persistence.

**Core User Flow:**

`User Connects Wallet (Wagmi)` → `Selects Template (Next.js UI)` → `Configures Parameters (React Hook Form)` → `Initiates Deployment (Mocked)` → `Deployment is Recorded (Supabase)`

This clean, decoupled architecture allows us to swap the mocked deployment logic with a real BlockDAG RPC integration in Wave 2 without re-architecting the application.

## ✅ Wave 1 Progress

Our focus for Wave 1 was to build a robust and functional UI scaffold that proves the core concept and provides a polished user experience.

| Feature                 | Status       | Description                                                    |
| ----------------------- | ------------ | -------------------------------------------------------------- |
| **Wallet Integration**  | ✅ Completed | Connect MetaMask via Wagmi v2.                                 |
| **UI/UX Scaffold**      | ✅ Completed | Built with Next.js, ShadCN, and Tailwind.                      |
| **Template Browser**    | ✅ Completed | Displays contract templates from a static data source.         |
| **Deployment Wizard**   | 🟡 UI Complete | A multi-step modal guides users through parameter input.       |
| **Database Connection** | ✅ Completed | Mock deployment data is successfully persisted to Supabase.    |
| **Real Deployment**     | 🔴 Planned     | Blockchain interaction logic is mocked and slated for Wave 2.  |

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
| **Wave 1** | UI Scaffold, Wallet Integration, & Mocked Backend    | ✅ Completed  |
| **Wave 2** | Real Contract Deployment via BlockDAG RPC          | ⏳ **Next**   |
| **Wave 3** | Verified Contracts, Explorer Integration, & Polish | 🚀 Final     |

## 🏆 Buildathon Alignment

FlowForge is more than just a dApp; it's a strategic infrastructure tool designed to accelerate the growth of the entire BlockDAG ecosystem.

- **Innovation:** As the **first native no-code builder for BlockDAG**, FlowForge addresses a critical gap in the developer toolkit.
- **Ecosystem Impact:** By reducing developer onboarding friction, we directly support the buildathon's goal of expanding BlockDAG's DeFi footprint.
- **Technical Foundation:** We've built a scalable, modern application scaffold, proving our ability to execute quickly and setting the stage for a seamless Wave 2 integration.

We are excited to bring real on-chain functionality to FlowForge in Wave 2 and contribute a foundational tool to the BlockDAG community.
