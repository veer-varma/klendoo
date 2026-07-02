export interface X402Request {
    amount: number;
    recipient: string;
    action: string;
    note?: string;
}
export interface X402PaymentProof {
    x402PaymentId: string;
    transactionHash: string;
    amount: number;
    recipient: string;
    timestamp: number;
    confirmed: boolean;
}
export declare class X402Middleware {
    /**
     * Generate x402 payment request header
     * Returns the header that should be sent as HTTP 402 Payment Required
     */
    static generateX402Header(request: X402Request): {
        statusCode: 402;
        headers: {
            'X-402-Pay-To': string;
            'X-402-Amount': string;
            'X-402-Action': string;
            'X-402-Pay-Request': string;
        };
        body: {
            error: string;
            paymentRequired: true;
            facilitator: string;
            instructions: string;
        };
    };
    /**
     * Verify x402 payment proof from client
     */
    static verifyPaymentProof(paymentId: string, expectedAmount: number, expectedRecipient: string): Promise<X402PaymentProof | null>;
    /**
     * Extract x402 payment ID from request headers
     */
    static extractPaymentId(headers: Record<string, string>): string | null;
    /**
     * Check if request has valid x402 payment proof
     */
    static hasValidPayment(headers: Record<string, string>, expectedAmount: number, expectedRecipient: string): Promise<boolean>;
}
//# sourceMappingURL=x402-middleware.d.ts.map