#!/usr/bin/env bash
# Creates named Stellar Testnet identities for a local Aletheia demo.
# It never writes secrets to project files; add the printed values to backend/.env yourself.
set -euo pipefail

NETWORK=testnet
IDENTITIES=(aletheia-issuer aletheia-oracle aletheia-exporter aletheia-investor)

command -v soroban >/dev/null || { echo "Install the Soroban CLI first."; exit 1; }
command -v curl >/dev/null || { echo "curl is required to fund Testnet accounts."; exit 1; }

for identity in "${IDENTITIES[@]}"; do
  if ! soroban keys address "$identity" >/dev/null 2>&1; then
    soroban keys generate --no-fund "$identity"
  fi
  address=$(soroban keys address "$identity")
  curl --fail --silent --show-error "https://friendbot.stellar.org?addr=${address}" >/dev/null
  echo "Funded ${identity}: ${address}"
done

issuer_public=$(soroban keys address aletheia-issuer)
oracle_public=$(soroban keys address aletheia-oracle)
issuer_secret=$(soroban keys secret aletheia-issuer)
oracle_secret=$(soroban keys secret aletheia-oracle)

cat <<EOF

Add these values to backend/.env (do not commit them):
STELLAR_NETWORK=testnet
PLATFORM_STELLAR_PUBLIC_KEY=${issuer_public}
PLATFORM_STELLAR_SECRET_KEY=${issuer_secret}
STELLAR_ISSUER_SECRET_KEY=${issuer_secret}
STELLAR_ORACLE_SECRET_KEY=${oracle_secret}
STELLAR_ORACLE_PUBLIC_KEY=${oracle_public}

Next: run scripts/deploy-contracts.sh from a Bash/WSL shell.
EOF
