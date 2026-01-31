import { jest } from '@jest/globals';

export const query = jest.fn();
export const queryOne = jest.fn();
export const run = jest.fn();
export const getDatabase = jest.fn();
export const initializeDatabase = jest.fn();
export const closeDatabase = jest.fn();
export const saveDatabase = jest.fn(); // Deprecated but present
export const escape = jest.fn(val => {
    if (typeof val === 'string') return `'${val}'`;
    return String(val);
});

export const getDb = getDatabase;
export const closeDb = closeDatabase;

export default {
    query,
    queryOne,
    run,
    getDatabase,
    getDb,
    initializeDatabase,
    closeDatabase,
    closeDb,
    saveDatabase,
    escape
};
