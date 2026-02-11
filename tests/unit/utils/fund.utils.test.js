
import { extractBaseName } from '../../../src/utils/fund.utils.js';

describe('Fund Utils - extractBaseName', () => {

    test('should extract base name from Direct Plan Growth', () => {
        expect(extractBaseName('ICICI Prudential Bluechip Fund - Direct Plan - Growth')).toBe('ICICI Prudential Bluechip Fund');
    });

    test('should extract base name from Regular Plan', () => {
        expect(extractBaseName('HDFC Top 100 Fund - Regular Plan - Growth Option')).toBe('HDFC Top 100 Fund');
    });

    test('should handle names with hyphens correctly (Smart Truncation)', () => {
        // This was the specific bug report case
        expect(extractBaseName('Aditya Birla Sun Life - Tax Relief 96 - Direct Plan')).toBe('Aditya Birla Sun Life - Tax Relief 96');
    });

    test('should handle IDCW plans', () => {
        expect(extractBaseName('SBI Equity Hybrid Fund - Direct Plan - IDCW')).toBe('SBI Equity Hybrid Fund');
    });

    test('should return original name if no markers found', () => {
        expect(extractBaseName('Axis Long Term Equity Fund')).toBe('Axis Long Term Equity Fund');
    });

    test('should handle Dividend plans', () => {
        expect(extractBaseName('Kotak Emerging Equity Fund - Direct Plan - Dividend')).toBe('Kotak Emerging Equity Fund');
    });

    test('should handle null or undefined input', () => {
        expect(extractBaseName(null)).toBeNull();
        expect(extractBaseName(undefined)).toBeNull();
        expect(extractBaseName(123)).toBeNull();
    });

    test('should trim whitespace', () => {
        expect(extractBaseName('  Franklin India Prima Fund - Direct   ')).toBe('Franklin India Prima Fund');
    });
});
