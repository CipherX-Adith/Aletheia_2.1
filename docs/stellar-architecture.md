# Aletheia Stellar architecture

## On-chain lifecycle

1. An exporter registers a receivable with a document hash and IPFS CID in `receivable-registry`.
2. Two independent attestors approve the receivable.
3. The platform issues a Stellar receivable asset with `AUTH_REQUIRED`, `AUTH_REVOCABLE`, and `CLAWBACK_ENABLED` controls.
4. Investors fund the receivable through `fractional-sale` using USDC.
5. A verified oracle confirms the importer's payment proof.
6. `settlement-escrow` distributes the confirmed stablecoin amount pro rata to investors.

## Trust boundaries

- The platform issuer key is held only in backend secrets; browser clients never receive it.
- Document files remain off-chain. Only their SHA-256 hashes and IPFS CIDs are recorded in the contract workflow.
- Oracle confirmation must be backed by a bank, payment-service-provider, or regulated data-provider integration before production launch.
- Clawback is an exceptional compliance/fraud control and must be governed by contractual policy, audit logs, and applicable regulation.

## Testnet deployment

Run `scripts/setup-testnet.sh` in Bash/WSL to create funded Testnet identities, add its printed values to `backend/.env`, then run `scripts/deploy-contracts.sh`. The deployment script writes the three contract IDs to `backend/.env`.

## Production readiness

Before Mainnet, use a custody/HSM or multisig arrangement for issuer and oracle keys, replace mock verification with KYB/KYC and trade-document partners, obtain legal review for securities/payment regulation, and commission an independent smart-contract audit.
