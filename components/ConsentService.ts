export type ConsentType = 'marketing' | 'analytics' | 'retention';
export type ConsentStatus = 'granted' | 'revoked' | 'expired';

export interface ConsentRecord {
    id: string;
    playerId: string;
    type: ConsentType;
    status: ConsentStatus;
    consentedAt: string;
    expiresAt: string;
    version: string;
}

export class ConsentService {
    private baseUrl: string;

    constructor(baseUrl: string = '') {
        this.baseUrl = baseUrl;
    }

    async recordConsent(playerId: string, type: ConsentType): Promise<ConsentRecord> {
        const response = await fetch(`${this.baseUrl}/api/consent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, consentType: type }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to record consent');
        }

        const result = await response.json();
        return {
            id: result.consentId,
            playerId,
            type,
            status: 'granted',
            consentedAt: new Date().toISOString(),
            expiresAt: result.expiresAt,
            version: '1.0',
        };
    }

    async checkConsent(playerId: string, type: ConsentType): Promise<boolean> {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/consent?playerId=${encodeURIComponent(playerId)}&type=${type}`
            );

            if (!response.ok) return false;
            const result = await response.json();

            return result.consents && result.consents.length > 0;
        } catch {
            return false;
        }
    }

    async getConsents(playerId: string): Promise<ConsentRecord[]> {
        const response = await fetch(
            `${this.baseUrl}/api/consent?playerId=${encodeURIComponent(playerId)}`
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch consents');
        }

        const result = await response.json();
        return result.consents || [];
    }

    isExpired(record: ConsentRecord): boolean {
        return new Date(record.expiresAt) < new Date();
    }

    isValid(record: ConsentRecord): boolean {
        return record.status === 'granted' && !this.isExpired(record);
    }
}
