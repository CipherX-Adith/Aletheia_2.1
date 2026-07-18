// ============================================================
//  SettlementEscrow â€” Aletheia
//  Holds importer payment and distributes pro-rata to all
//  receivable token holders when payment is confirmed.
//  Includes clawback for fraud/dispute scenarios.
// ============================================================
#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    token, Address, Bytes, Env, Map, Vec,
};

// â”€â”€ Data Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum EscrowStatus {
    Waiting,        // Waiting for importer payment
    Confirmed,      // Oracle confirmed payment; ready to distribute
    Distributed,    // All investors paid out
    Clawback,       // Fraud clawback executed
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct EscrowRecord {
    pub receivable_id: u128,
    pub face_value_cents: i128,
    pub stablecoin_address: Address,
    pub oracle: Address,              // Trusted address that can confirm payment
    pub investors: Vec<Address>,      // Ordered list
    pub shares: Map<Address, i128>,   // investor â†’ face value share (cents)
    pub total_share_cents: i128,      // Sum of all investor shares
    pub status: EscrowStatus,
    pub confirmed_amount_cents: i128, // Actual confirmed payment
    pub proof: Bytes,                 // Payment proof (hash/reference from oracle)
    pub created_at: u64,
    pub confirmed_at: u64,
    pub distributed_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Escrow(u128),
}

// â”€â”€ Contract â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

#[contract]
pub struct SettlementEscrow;

#[contractimpl]
impl SettlementEscrow {
    // â”€â”€ Initializer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().extend_ttl(17280, 17280);
    }

    // â”€â”€ Setup: Register escrow for a receivable â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /// Called by admin after FractionalSale closes.
    /// Records investor shares so we know who gets what at settlement.
    pub fn setup_escrow(
        env: Env,
        admin: Address,
        receivable_id: u128,
        face_value_cents: i128,
        stablecoin_address: Address,
        oracle: Address,
        investors: Vec<Address>,
        shares: Map<Address, i128>,
    ) {
        admin.require_auth();
        Self::require_admin(&env, &admin);

        if env
            .storage()
            .persistent()
            .has(&DataKey::Escrow(receivable_id))
        {
            panic!("escrow already exists");
        }

        let mut total = 0i128;
        for inv in investors.iter() {
            total += shares.get(inv).unwrap_or(0);
        }

        let record = EscrowRecord {
            receivable_id,
            face_value_cents,
            stablecoin_address,
            oracle,
            investors,
            shares,
            total_share_cents: total,
            status: EscrowStatus::Waiting,
            confirmed_amount_cents: 0,
            proof: Bytes::new(&env),
            created_at: env.ledger().timestamp(),
            confirmed_at: 0,
            distributed_at: 0,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Escrow(receivable_id), &record);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Escrow(receivable_id), 17280, 17280);
    }

    // â”€â”€ Oracle: Confirm importer payment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /// Called by the registered oracle (or admin during demo) when the
    /// importer's wire transfer / SWIFT/SEPA message is confirmed.
    /// `proof` is a hash/reference from the bank confirmation feed.
    /// `confirmed_amount_cents` is the actual USD amount received.
    pub fn confirm_payment(
        env: Env,
        oracle: Address,
        receivable_id: u128,
        confirmed_amount_cents: i128,
        proof: Bytes,
    ) {
        oracle.require_auth();

        let mut record: EscrowRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(receivable_id))
            .expect("escrow not found");

        if record.status != EscrowStatus::Waiting {
            panic!("escrow not waiting");
        }
        if oracle != record.oracle {
            panic!("unauthorized oracle");
        }
        if confirmed_amount_cents <= 0 {
            panic!("invalid amount");
        }

        record.confirmed_amount_cents = confirmed_amount_cents;
        record.proof = proof;
        record.status = EscrowStatus::Confirmed;
        record.confirmed_at = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&DataKey::Escrow(receivable_id), &record);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Escrow(receivable_id), 17280, 17280);

        env.events().publish(
            (symbol_short!("CONFIRM"), symbol_short!("escrow")),
            (receivable_id, confirmed_amount_cents),
        );
    }

    // â”€â”€ Distribute: Pro-rata payout to all token holders â”€â”€â”€â”€â”€

    /// Triggered after `confirm_payment`. Distributes `confirmed_amount_cents`
    /// pro-rata to each investor based on their share of the face value.
    ///
    /// Each investor receives:
    ///   payment_i = confirmed_amount * (share_i / total_share)
    ///
    /// Stablecoin must be pre-deposited to this contract address
    /// (by the oracle/admin) before calling distribute.
    pub fn distribute(env: Env, caller: Address, receivable_id: u128) {
        caller.require_auth();

        let mut record: EscrowRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(receivable_id))
            .expect("escrow not found");

        if record.status != EscrowStatus::Confirmed {
            panic!("payment not confirmed yet");
        }

        let stablecoin = token::Client::new(&env, &record.stablecoin_address);
        let total = record.total_share_cents;
        let confirmed = record.confirmed_amount_cents;

        // Distribute pro-rata
        let mut distributed = 0i128;
        let last_idx = record.investors.len() - 1;

        for (idx, investor) in record.investors.iter().enumerate() {
            let share = record.shares.get(investor.clone()).unwrap_or(0);

            let payout = if idx as u32 == last_idx {
                // Last investor gets the remainder to avoid rounding dust
                confirmed - distributed
            } else {
                // Integer division â€” confirmed * share / total
                confirmed * share / total
            };

            if payout > 0 {
                stablecoin.transfer(
                    &env.current_contract_address(),
                    &investor,
                    &payout,
                );
            }

            distributed += payout;

            env.events().publish(
                (symbol_short!("PAYOUT"), symbol_short!("escrow")),
                (receivable_id, investor, payout),
            );
        }

        record.status = EscrowStatus::Distributed;
        record.distributed_at = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&DataKey::Escrow(receivable_id), &record);

        env.events().publish(
            (symbol_short!("DISTRIB"), symbol_short!("escrow")),
            (receivable_id, distributed),
        );
    }

    // â”€â”€ Emergency Clawback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /// Issuer-only. Uses Stellar's native clawback flag on the receivable
    /// asset (AUTH_REVOCABLE + CLAWBACK_ENABLED set on issuer account).
    /// Here we just mark the escrow as clawed-back; the actual token
    /// clawback is a Stellar protocol-level operation performed by the
    /// issuing account (one line in the SDK, no custom code needed).
    pub fn clawback(
        env: Env,
        admin: Address,
        receivable_id: u128,
        reason: Bytes,
    ) {
        admin.require_auth();
        Self::require_admin(&env, &admin);

        let mut record: EscrowRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(receivable_id))
            .expect("escrow not found");

        if record.status == EscrowStatus::Distributed {
            panic!("already distributed");
        }

        record.status = EscrowStatus::Clawback;

        env.storage()
            .persistent()
            .set(&DataKey::Escrow(receivable_id), &record);

        env.events().publish(
            (symbol_short!("CLAWBACK"), symbol_short!("escrow")),
            (receivable_id, reason),
        );
    }

    // â”€â”€ Queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    pub fn get_escrow(env: Env, receivable_id: u128) -> EscrowRecord {
        env.storage()
            .persistent()
            .get(&DataKey::Escrow(receivable_id))
            .expect("not found")
    }

    // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    fn require_admin(env: &Env, caller: &Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        if *caller != admin {
            panic!("admin only");
        }
    }
}

// â”€â”€ Tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::Address as _,
        token::{Client as TokenClient, StellarAssetClient},
        Env,
    };

    fn create_token<'a>(env: &'a Env, admin: &Address) -> (Address, StellarAssetClient<'a>) {
        let contract_id = env.register_stellar_asset_contract_v2(admin.clone());
        let sac = StellarAssetClient::new(env, &contract_id.address());
        (contract_id.address(), sac)
    }

    #[test]
    fn test_confirm_and_distribute() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let oracle = Address::generate(&env);
        let investor1 = Address::generate(&env);
        let investor2 = Address::generate(&env);

        let contract_id = env.register_contract(None, SettlementEscrow);
        let client = SettlementEscrowClient::new(&env, &contract_id);
        client.initialize(&admin);

        let (usdc_addr, usdc_sac) = create_token(&env, &admin);

        // Fund the escrow contract with the settlement amount
        usdc_sac.mint(&contract_id, &100_000_00i128);

        let mut investors = Vec::new(&env);
        investors.push_back(investor1.clone());
        investors.push_back(investor2.clone());

        let mut shares: Map<Address, i128> = Map::new(&env);
        shares.set(investor1.clone(), 60_000_00i128); // 60% share
        shares.set(investor2.clone(), 40_000_00i128); // 40% share

        client.setup_escrow(
            &admin,
            &0u128,
            &100_000_00i128,
            &usdc_addr,
            &oracle,
            &investors,
            &shares,
        );

        // Oracle confirms $100,000 payment
        client.confirm_payment(
            &oracle,
            &0u128,
            &100_000_00i128,
            &Bytes::from_slice(&env, b"SWIFT:MT103:REF123"),
        );

        let escrow = client.get_escrow(&0u128);
        assert_eq!(escrow.status, EscrowStatus::Confirmed);

        // Distribute
        client.distribute(&admin, &0u128);

        let escrow = client.get_escrow(&0u128);
        assert_eq!(escrow.status, EscrowStatus::Distributed);

        // Verify balances
        let tok = TokenClient::new(&env, &usdc_addr);
        // investor1 gets 60% of $100,000 = $60,000
        assert_eq!(tok.balance(&investor1), 60_000_00);
        // investor2 gets 40% = $40,000
        assert_eq!(tok.balance(&investor2), 40_000_00);
    }

    #[test]
    #[should_panic(expected = "unauthorized oracle")]
    fn test_unauthorized_oracle_rejected() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let oracle = Address::generate(&env);
        let fake_oracle = Address::generate(&env);

        let contract_id = env.register_contract(None, SettlementEscrow);
        let client = SettlementEscrowClient::new(&env, &contract_id);
        client.initialize(&admin);

        let (usdc_addr, _) = create_token(&env, &admin);

        let investors = Vec::new(&env);
        let shares = Map::new(&env);

        client.setup_escrow(
            &admin,
            &0u128,
            &100_000_00i128,
            &usdc_addr,
            &oracle,
            &investors,
            &shares,
        );

        // Fake oracle tries to confirm â€” should panic
        client.confirm_payment(
            &fake_oracle,
            &0u128,
            &100_000_00i128,
            &Bytes::from_slice(&env, b"FAKE"),
        );
    }
}
