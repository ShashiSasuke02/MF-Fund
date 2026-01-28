
import { z } from 'zod';

/**
 * Middleware factory for Zod validation
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @param {string} source - property to validate ('body', 'query', 'params')
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
    try {
        const dataToValidate = req[source];

        // Parse/Validate
        const result = schema.parse(dataToValidate);

        // Replace req[source] with parsed/typed data (strips unknown keys if strict)
        req[source] = result;

        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        next(error);
    }
};
