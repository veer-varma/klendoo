"use strict";
// Copyright (c) 2026 Veer Varma. All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletManager = void 0;
class WalletManager {
    constructor() {
        this.state = {
            isConnected: false,
            account: null,
            balance: 0,
            spendingAuthorizationCap: 0
        };
    }
    async connect(provider) {
        switch (provider) {
            case 'pera':
                return this.connectPera();
            case 'defly':
                return this.connectDefly();
            case 'myalgo':
                return this.connectMyAlgo();
            default:
                throw new Error(`Unsupported wallet provider: ${provider}`);
        }
    }
    async connectPera() {
        const account = {
            address: '',
            name: 'Pera Wallet',
            provider: 'pera'
        };
        this.state.isConnected = true;
        this.state.account = account;
        return account;
    }
    async connectDefly() {
        const account = {
            address: '',
            name: 'Defly Wallet',
            provider: 'defly'
        };
        this.state.isConnected = true;
        this.state.account = account;
        return account;
    }
    async connectMyAlgo() {
        const account = {
            address: '',
            name: 'MyAlgo Wallet',
            provider: 'myalgo'
        };
        this.state.isConnected = true;
        this.state.account = account;
        return account;
    }
    async requestSpendingAuthorization(cap) {
        if (!this.state.account)
            throw new Error('No wallet connected');
        this.state.spendingAuthorizationCap = cap;
        return true;
    }
    requiresSpendingAuth() {
        return !this.state.isConnected || this.state.spendingAuthorizationCap === 0;
    }
    getState() {
        return { ...this.state };
    }
    async fetchBalance() {
        if (!this.state.account)
            throw new Error('No wallet connected');
        return this.state.balance;
    }
    disconnect() {
        this.state = {
            isConnected: false,
            account: null,
            balance: 0,
            spendingAuthorizationCap: 0
        };
    }
}
exports.WalletManager = WalletManager;
//# sourceMappingURL=wallet.js.map