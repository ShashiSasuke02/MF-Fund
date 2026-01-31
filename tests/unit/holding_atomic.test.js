
import { jest } from '@jest/globals';

// Define mock implementations
const mockRun = jest.fn().mockResolvedValue({ changes: 1 });
const mockQueryOne = jest.fn().mockResolvedValue({
    user_id: 1,
    scheme_code: 101,
    total_units: 100,
    invested_amount: 10000
});

const mockQuery = jest.fn();

// Mock the database module BEFORE importing it
jest.unstable_mockModule('../../src/db/database.js', () => ({
    run: mockRun,
    queryOne: mockQueryOne,
    query: mockQuery,
    saveDatabase: jest.fn(),
    getDatabase: jest.fn(),
    initializeDatabase: jest.fn(),
    closeDatabase: jest.fn(),
    escape: jest.fn(val => val),
    default: {
        run: mockRun,
        queryOne: mockQueryOne,
        query: mockQuery,
        saveDatabase: jest.fn(),
        getDatabase: jest.fn(),
        initializeDatabase: jest.fn(),
        closeDatabase: jest.fn(),
        escape: jest.fn(val => val)
    }
}));

// Dynamic import after mocking
const { holdingModel } = await import('../../src/models/holding.model.js');
const db = await import('../../src/db/database.js');

describe('Holding Model Atomic Updates', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('addUnits should use atomic SQL update for consistency', async () => {
        // Act
        await holdingModel.addUnits(1, 101, 10, 1000);

        // Assert
        console.log('Mock calls:', mockRun.mock.calls);
        const runCall = mockRun.mock.calls[0];

        // Safety check in case the code didn't call run
        if (!runCall) {
            throw new Error('Database run() was not called');
        }

        const sql = runCall[0];
        const params = runCall[1];

        console.log('Generated SQL:', sql);

        expect(sql).toContain('total_units = total_units + ?');
        expect(sql).toContain('invested_amount = invested_amount + ?');

        // The params should be the delta (10, 1000)
        expect(params).toContain(10);
        expect(params).toContain(1000);
    });

    test('removeUnits should use atomic SQL update for consistency', async () => {
        // Act
        await holdingModel.removeUnits(1, 101, 5, 500);

        // Assert
        const runCall = mockRun.mock.calls[0];
        if (!runCall) {
            throw new Error('Database run() was not called');
        }

        const sql = runCall[0];
        const params = runCall[1];

        expect(sql).toContain('total_units = total_units - ?');
        expect(sql).toContain('invested_amount = invested_amount - ?');

        expect(params).toContain(5);
        expect(params).toContain(500);
    });
});
