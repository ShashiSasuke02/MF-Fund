
import request from 'supertest';
import { jest } from '@jest/globals';
import express from 'express';
import { validate } from '../../src/middleware/validate.middleware.js';
import { createTransactionSchema } from '../../src/validators/demo.schema.js';

// Setup simplified express app for testing middleware
const app = express();
app.use(express.json());

// Mock controller
const mockController = jest.fn((req, res) => res.status(201).json({ success: true }));

app.post('/test/transactions', validate(createTransactionSchema), mockController);

describe('Validation Middleware Integration', () => {

    test('should return 400 for negative amount', async () => {
        const response = await request(app)
            .post('/test/transactions')
            .send({
                schemeCode: 12345,
                transactionType: 'LUMP_SUM',
                amount: -500 // Invalid
            });

        expect(response.status).toBe(400);
        expect(response.body.errors[0].message).toContain('positive');
    });

    test('should return 400 for missing frequency in SIP', async () => {
        const response = await request(app)
            .post('/test/transactions')
            .send({
                schemeCode: 12345,
                transactionType: 'SIP', // Requires frequency
                amount: 1000
            });

        expect(response.status).toBe(400);
        expect(response.body.errors[0].message).toContain('Frequency is required');
    });

    test('should pass valid LUMP_SUM', async () => {
        const response = await request(app)
            .post('/test/transactions')
            .send({
                schemeCode: 12345,
                transactionType: 'LUMP_SUM',
                amount: 5000
            });

        expect(response.status).toBe(201);
        expect(mockController).toHaveBeenCalled();
    });
});
