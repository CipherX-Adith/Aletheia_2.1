import { env } from '../config/env.js';
import { horizonServer, NETWORK_PASSPHRASE, sorobanServer, StellarSdk } from '../config/stellar.js';

function issuerKeypair() {
  if (!env.STELLAR_ISSUER_SECRET_KEY) {
    throw new Error('STELLAR_ISSUER_SECRET_KEY is required for on-chain issuance');
  }
  return StellarSdk.Keypair.fromSecret(env.STELLAR_ISSUER_SECRET_KEY);
}

export function isOnChainIssuanceConfigured() {
  return Boolean(env.STELLAR_ISSUER_SECRET_KEY && env.PLATFORM_STELLAR_PUBLIC_KEY);
}

export async function issueReceivableAsset(assetCode) {
  if (!/^[A-Z0-9]{1,12}$/.test(assetCode)) throw new Error('Stellar asset code must be 1-12 uppercase alphanumeric characters');
  const issuer = issuerKeypair();
  const account = await horizonServer.loadAccount(issuer.publicKey());
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(StellarSdk.Operation.setOptions({ setFlags: 1 | 2 | 8 }))
    .setTimeout(30)
    .build();
  transaction.sign(issuer);
  const result = await horizonServer.submitTransaction(transaction);
  return {
    assetCode,
    issuer: issuer.publicKey(),
    assetId: `${assetCode}:${issuer.publicKey()}`,
    txHash: result.hash,
  };
}

export async function authorizeInvestorTrustline(investorPublicKey, assetCode) {
  const issuer = issuerKeypair();
  const account = await horizonServer.loadAccount(issuer.publicKey());
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(StellarSdk.Operation.allowTrust({ trustor: investorPublicKey, assetCode, authorize: true }))
    .setTimeout(30)
    .build();
  transaction.sign(issuer);
  return (await horizonServer.submitTransaction(transaction)).hash;
}

export async function invokeSorobanContract(contractId, method, args, signerSecret = env.STELLAR_ISSUER_SECRET_KEY) {
  if (!contractId) throw new Error('Soroban contract ID is not configured');
  if (!signerSecret) throw new Error('A signer key is required for Soroban invocation');
  const signer = StellarSdk.Keypair.fromSecret(signerSecret);
  const account = await sorobanServer.getAccount(signer.publicKey());
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: '1000000',
    networkPassphrase: NETWORK_PASSPHRASE,
  }).addOperation(new StellarSdk.Contract(contractId).call(method, ...args)).setTimeout(30).build();
  const simulation = await sorobanServer.simulateTransaction(transaction);
  if (StellarSdk.rpc.Api.isSimulationError(simulation)) throw new Error(`Soroban simulation failed: ${simulation.error}`);
  const prepared = StellarSdk.rpc.assembleTransaction(transaction, simulation).build();
  prepared.sign(signer);
  const submitted = await sorobanServer.sendTransaction(prepared);
  if (submitted.status === 'ERROR') throw new Error(`Soroban submission failed: ${JSON.stringify(submitted)}`);
  return { txHash: submitted.hash, status: submitted.status };
}
