# Aletheia

> **Truth in Trade, Trust in Time**

Aletheia is a Stellar-powered digital trade finance network that transforms verified international trade receivables into programmable financial assets — enabling exporters to access immediate liquidity, investors to finance real-world trade, and buyers to build verifiable payment reputations.

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | Node.js + Express 5 + Prisma ORM |
| Database | PostgreSQL |
| Blockchain | Stellar + Soroban + USDC |
| AI | Groq + RAG |
| Storage | IPFS / Pinata |

## Four Product Pillars

1. **Trade Passport** — Digital KYB identity, compliance, reputation
2. **Trade Exchange** — Verified receivables marketplace
3. **Settlement Network** — USDC on Stellar, Soroban smart contracts
4. **Intelligence Layer** — AI copilot, risk engine, fraud detection

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Stellar Testnet account

### Backend
```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Docker (Full Stack)
```bash
docker-compose up --build
```

## Project Structure

```
Aletheia/
├── backend/          # Express API server
├── frontend/         # React + Vite client
├── contracts/        # Soroban smart contracts
├── docs/             # Architecture & API docs
├── infrastructure/   # Docker, Nginx, deployment
└── scripts/          # Dev utilities
```

## License

MIT
