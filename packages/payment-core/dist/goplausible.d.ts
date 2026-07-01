import { SettlementRequest, SettlementResponse } from './types';
export declare class GoPlausibleX402Client {
    private client;
    constructor(apiKey?: string);
    createPaymentRequest(request: SettlementRequest): Promise<{
        requestId: string;
        x402Header: string;
        amount: number;
        recipient: string;
    }>;
    confirmPayment(requestId: string, transactionHash: string): Promise<boolean>;
    getPaymentStatus(requestId: string): Promise<{
        status: 'pending' | 'confirmed' | 'failed';
        transactionHash?: string;
        confirmationTime?: number;
    }>;
    retryPayment(requestId: string): Promise<SettlementResponse>;
    private delay;
}
//# sourceMappingURL=goplausible.d.ts.map