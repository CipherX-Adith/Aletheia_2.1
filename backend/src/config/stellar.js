import * as StellarSdk from '@stellar/stellar-sdk';
import { env } from './env.js';

const { Networks, Horizon, rpc } = StellarSdk;

// Network passphrase
export const NETWORK_PASSPHRASE =
  env.STELLAR_NETWORK === 'mainnet'
    ? Networks.PUBLIC
    : Networks.TESTNET;

// Horizon server (for payments, accounts, assets)
export const horizonServer = new Horizon.Server(env.STELLAR_HORIZON_URL, {
  allowHttp: env.NODE_ENV === 'development',
});

// Soroban RPC server (for smart contracts)
export const sorobanServer = new rpc.Server(env.STELLAR_SOROBAN_URL, {
  allowHttp: env.NODE_ENV === 'development',
});

// USDC asset on Stellar (Circle's USDC)
export const USDC_ISSUER =
  env.STELLAR_NETWORK === 'mainnet'
    ? 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
    : 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'; // Testnet USDC

export const USDC_ASSET = new StellarSdk.Asset('USDC', USDC_ISSUER);
export const XLM_ASSET = StellarSdk.Asset.native();

export { StellarSdk };
export default { horizonServer, sorobanServer, NETWORK_PASSPHRASE, USDC_ASSET, XLM_ASSET };
