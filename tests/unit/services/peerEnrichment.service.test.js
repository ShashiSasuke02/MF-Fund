import { jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('../../../src/models/fund.model.js', () => ({
    fundModel: {
        findEnrichedFunds: jest.fn().mockResolvedValue([]),
        findPeerFundsMissingData: jest.fn().mockResolvedValue([])
    }
}));

jest.unstable_mockModule('../../../src/utils/fund.utils.js', () => ({
    extractBaseName: jest.fn((name) => name.split(' - ')[0])
}));

jest.unstable_mockModule('../../../src/services/cronNotification.service.js', () => ({
    cronNotificationService: {
        onJobComplete: jest.fn().mockResolvedValue(true)
    }
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    default: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }
}));

jest.unstable_mockModule('../../../src/db/database.js', () => ({
    default: {
        run: jest.fn().mockResolvedValue({ changes: 1 })
    }
}));

// Import module after mocking
const { peerEnrichmentService } = await import('../../../src/services/peerEnrichment.service.js');
const { fundModel } = await import('../../../src/models/fund.model.js');
const { cronNotificationService } = await import('../../../src/services/cronNotification.service.js');
const db = (await import('../../../src/db/database.js')).default;

describe('Peer Enrichment Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should extract base name correctly', () => {
        const name = 'HDFC Top 100 Fund - Direct Plan - Growth Option';
        const result = peerEnrichmentService.extractBaseName(name);
        expect(result).toBe('HDFC Top 100 Fund'); // Based on mock implementation
    });

    test('should run enrichment process successfully', async () => {
        // Setup mocks
        const mockSource = { scheme_name: 'HDFC Top 100 Fund - Direct', scheme_code: '123', aum: 1000 };
        const mockTarget = { scheme_name: 'HDFC Top 100 Fund - Regular', scheme_code: '456' };

        fundModel.findEnrichedFunds.mockResolvedValue([mockSource]);
        fundModel.findPeerFundsMissingData.mockResolvedValue([mockTarget]);

        const result = await peerEnrichmentService.runDailyEnrichment();

        expect(fundModel.findEnrichedFunds).toHaveBeenCalled();
        expect(fundModel.findPeerFundsMissingData).toHaveBeenCalledWith('HDFC Top 100 Fund', '123');
        expect(db.run).toHaveBeenCalled(); // Copy data

        expect(cronNotificationService.onJobComplete).toHaveBeenCalledWith(
            'Peer Fund Enrichment',
            'SUCCESS',
            expect.objectContaining({
                totalEnriched: 1,
                enrichedFundNames: ['HDFC Top 100 Fund - Regular']
            }),
            null,
            expect.any(Number)
        );

        expect(result.totalEnriched).toBe(1);
    });

    test('should handle empty source funds', async () => {
        fundModel.findEnrichedFunds.mockResolvedValue([]);

        const result = await peerEnrichmentService.runDailyEnrichment();

        expect(cronNotificationService.onJobComplete).toHaveBeenCalledWith(
            'Peer Fund Enrichment',
            'SUCCESS',
            expect.objectContaining({ totalEnriched: 0 }),
            null,
            expect.any(Number)
        );
    });
});
