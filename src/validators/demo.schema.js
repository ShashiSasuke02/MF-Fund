
import { z } from 'zod';

export const createTransactionSchema = z.object({
    schemeCode: z.number({
        required_error: 'Scheme code is required',
        invalid_type_error: 'Scheme code must be a number'
    }).int().positive(),

    transactionType: z.enum(['SIP', 'STP', 'LUMP_SUM', 'SWP'], {
        errorMap: () => ({ message: 'Invalid transaction type. Must be one of: SIP, STP, LUMP_SUM, SWP' })
    }),

    amount: z.number({
        required_error: 'Amount is required'
    }).positive('Amount must be positive'),

    // Optional but validated if present
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY']).optional(),

    startDate: z.string().optional(), // Could add regex validation for YYYY-MM-DD
    endDate: z.string().optional(),
    installments: z.number().int().positive().optional()
}).refine(data => {
    // If type is NOT LUMP_SUM, frequency is required
    if (data.transactionType !== 'LUMP_SUM' && !data.frequency) {
        return false;
    }
    return true;
}, {
    message: "Frequency is required for SIP, STP, and SWP",
    path: ["frequency"]
});
