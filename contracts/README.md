# Aletheia Soroban contracts

The on-chain trade-finance lifecycle is split into three Soroban contracts:

- `receivable-registry`: exporter registration and two-of-three independent attestation.
- `fractional-sale`: USDC-funded fractional investment and automatic sale closure.
- `settlement-escrow`: oracle-confirmed settlement and pro-rata investor distribution.

`rwt-token` remains the application-specific token contract. Build all contracts with `cargo build --target wasm32-unknown-unknown --release` from this directory. Deploy to Stellar Testnet with `../scripts/deploy-contracts.sh` after creating funded identities and configuring `backend/.env`.
