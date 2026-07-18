#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Address, String, Symbol};

#[contract]
pub struct RWTContract;

#[contractimpl]
impl RWTContract {
    /// Initialize the RWT token with name, symbol, and administrator
    pub fn initialize(env: Env, admin: Address, name: String, symbol: Symbol) {
        admin.require_auth();
        env.storage().instance().set(&Symbol::new(&env, "admin"), &admin);
        env.storage().instance().set(&Symbol::new(&env, "name"), &name);
        env.storage().instance().set(&Symbol::new(&env, "symbol"), &symbol);
    }

    /// Mint new RWT tokens for a verified trade receivable
    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&Symbol::new(&env, "admin")).unwrap();
        admin.require_auth();
        
        let mut balance: i128 = env.storage().persistent().get(&to).unwrap_or(0);
        balance += amount;
        
        env.storage().persistent().set(&to, &balance);
    }

    /// Burn RWT tokens upon buyer settlement confirmation
    pub fn burn(env: Env, from: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&Symbol::new(&env, "admin")).unwrap();
        admin.require_auth();
        
        let mut balance: i128 = env.storage().persistent().get(&from).unwrap_or(0);
        if balance < amount {
            panic!("insufficient balance to burn");
        }
        balance -= amount;
        
        env.storage().persistent().set(&from, &balance);
    }

    /// Query the RWT balance of an investor
    pub fn balance_of(env: Env, owner: Address) -> i128 {
        env.storage().persistent().get(&owner).unwrap_or(0)
    }
}
