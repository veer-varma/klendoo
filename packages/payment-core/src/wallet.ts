// Copyright (c) 2026 Veer Varma. All rights reserved.

export type WalletProvider = 'pera' | 'defly' | 'myalgo';

export interface WalletAccount {
  address: string;
  name: string;
  provider: WalletProvider;
}

export interface WalletState {
  isConnected: boolean;
  account: WalletAccount | null;
  balance: number;
  spendingAuthorizationCap: number;
}

export class WalletManager {
  private state: WalletState = {
    isConnected: false,
    account: null,
    balance: 0,
    spendingAuthorizationCap: 0
  };

  async connect(provider: WalletProvider): Promise<WalletAccount> {
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

  private async connectPera(): Promise<WalletAccount> {
    const account: WalletAccount = {
      address: '',
      name: 'Pera Wallet',
      provider: 'pera'
    };
    this.state.isConnected = true;
    this.state.account = account;
    return account;
  }

  private async connectDefly(): Promise<WalletAccount> {
    const account: WalletAccount = {
      address: '',
      name: 'Defly Wallet',
      provider: 'defly'
    };
    this.state.isConnected = true;
    this.state.account = account;
    return account;
  }

  private async connectMyAlgo(): Promise<WalletAccount> {
    const account: WalletAccount = {
      address: '',
      name: 'MyAlgo Wallet',
      provider: 'myalgo'
    };
    this.state.isConnected = true;
    this.state.account = account;
    return account;
  }

  async requestSpendingAuthorization(cap: number): Promise<boolean> {
    if (!this.state.account) throw new Error('No wallet connected');
    this.state.spendingAuthorizationCap = cap;
    return true;
  }

  requiresSpendingAuth(): boolean {
    return !this.state.isConnected || this.state.spendingAuthorizationCap === 0;
  }

  getState(): WalletState {
    return { ...this.state };
  }

  async fetchBalance(): Promise<number> {
    if (!this.state.account) throw new Error('No wallet connected');
    return this.state.balance;
  }

  disconnect(): void {
    this.state = {
      isConnected: false,
      account: null,
      balance: 0,
      spendingAuthorizationCap: 0
    };
  }
}
