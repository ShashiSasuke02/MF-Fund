
import { jest } from '@jest/globals';
import { fundModel } from '../../../src/models/fund.model.js';
import db from '../../../src/db/database.js';

describe('Fund Model - findPeerFundWithData', () => {
    let queryOneSpy;

    beforeEach(() => {
        // Spy on the db.queryOne method
        queryOneSpy = jest.spyOn(db, 'queryOne');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should find a peer fund with exact matching base name', async () => {
        const baseName = 'ICICI Prudential Bharat Consumption Fund';
        const excludeCode = 123456;
        const mockPeer = {
            scheme_code: 654321,
            scheme_name: 'ICICI Prudential Bharat Consumption Fund',
            aum: 1000,
            expense_ratio: '1.5'
        };

        queryOneSpy.mockResolvedValue(mockPeer);

        const result = await fundModel.findPeerFundWithData(baseName, excludeCode);

        // Verify query structure
        expect(queryOneSpy).toHaveBeenCalledWith(
            expect.stringContaining('WHERE scheme_name = ?'),
            expect.arrayContaining([baseName, excludeCode])
        );

        expect(result).toEqual(mockPeer);
    });

    it('should return null if no peer matches strict criteria', async () => {
        queryOneSpy.mockResolvedValue(null);
        const result = await fundModel.findPeerFundWithData('NonExistent', 123);
        expect(result).toBeNull();
    });
});
