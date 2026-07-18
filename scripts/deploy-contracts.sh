#!/bin/bash
# ============================================================
#  deploy-contracts.sh â€” Aletheia Contract Deployment
#  Compiles the Aletheia Soroban contracts and deploys them to testnet.
#  Contract IDs are written to backend/.env; never commit that file.
#
#  Prerequisites:
#    - rustup with wasm32-unknown-unknown target:
#        rustup target add wasm32-unknown-unknown
#    - soroban CLI:
#        cargo install soroban-cli --features opt
#    - Accounts funded (run setup-testnet.sh first)
#
#  Usage:
#    chmod +x scripts/deploy-contracts.sh
#    ./scripts/deploy-contracts.sh
# ============================================================

set -e

NETWORK="testnet"
CONTRACTS_DIR="contracts"

echo "âš–ï¸ Aletheia â€” Contract Deployment"
echo "========================================"
echo ""

# Source environment
ENV_FILE="backend/.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "backend/.env not found. Copy the environment template and configure testnet identities first."
  exit 1
fi

# â”€â”€ Build all contracts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
echo "ðŸ“¦ Building contracts..."
cd $CONTRACTS_DIR

cargo build --target wasm32-unknown-unknown --release
echo "  âœ“ Build complete"
echo ""

# â”€â”€ Deploy ReceivableRegistry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
echo "ðŸš€ Deploying ReceivableRegistry..."
REGISTRY_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/receivable_registry.wasm \
  --source aletheia-issuer \
  --network $NETWORK)
echo "  Contract ID: $REGISTRY_ID"

# Initialize
soroban contract invoke \
  --id $REGISTRY_ID \
  --source aletheia-issuer \
  --network $NETWORK \
  -- initialize \
  --admin $PLATFORM_STELLAR_PUBLIC_KEY
echo "  âœ“ Initialized"
echo ""

# â”€â”€ Deploy FractionalSale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
echo "ðŸš€ Deploying FractionalSale..."
SALE_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/fractional_sale.wasm \
  --source aletheia-issuer \
  --network $NETWORK)
echo "  Contract ID: $SALE_ID"

soroban contract invoke \
  --id $SALE_ID \
  --source aletheia-issuer \
  --network $NETWORK \
  -- initialize \
  --admin $PLATFORM_STELLAR_PUBLIC_KEY
echo "  âœ“ Initialized"
echo ""

# â”€â”€ Deploy SettlementEscrow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
echo "ðŸš€ Deploying SettlementEscrow..."
ESCROW_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/settlement_escrow.wasm \
  --source aletheia-issuer \
  --network $NETWORK)
echo "  Contract ID: $ESCROW_ID"

soroban contract invoke \
  --id $ESCROW_ID \
  --source aletheia-issuer \
  --network $NETWORK \
  -- initialize \
  --admin $PLATFORM_STELLAR_PUBLIC_KEY
echo "  âœ“ Initialized"
echo ""

cd ..

# â”€â”€ Update .env with contract IDs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
echo "ðŸ“„ Updating .env with contract IDs..."
sed -i "s/RECEIVABLE_REGISTRY_CONTRACT_ID=.*/RECEIVABLE_REGISTRY_CONTRACT_ID=$REGISTRY_ID/" "$ENV_FILE"
sed -i "s/FRACTIONAL_SALE_CONTRACT_ID=.*/FRACTIONAL_SALE_CONTRACT_ID=$SALE_ID/" "$ENV_FILE"
sed -i "s/SETTLEMENT_ESCROW_CONTRACT_ID=.*/SETTLEMENT_ESCROW_CONTRACT_ID=$ESCROW_ID/" "$ENV_FILE"

echo ""
echo "âœ… All contracts deployed!"
echo ""
echo "  ReceivableRegistry: $REGISTRY_ID"
echo "  FractionalSale:     $SALE_ID"
echo "  SettlementEscrow:   $ESCROW_ID"
echo ""
echo "Explorer links:"
echo "  https://stellar.expert/explorer/testnet/contract/$REGISTRY_ID"
echo "  https://stellar.expert/explorer/testnet/contract/$SALE_ID"
echo "  https://stellar.expert/explorer/testnet/contract/$ESCROW_ID"
echo ""
echo "Contract IDs written to $ENV_FILE. Restart the API server to pick up changes."
