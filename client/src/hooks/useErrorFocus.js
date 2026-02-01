import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle scroll-to-error and focus behavior.
 * When the errors object changes, it finds the first field with an error,
 * scrolls it into view, and focuses the input element.
 *
 * @param {Object} errors - An object where keys are field names and values are error messages.
 * @param {React.RefObject} containerRef - Optional ref to limit selector scope.
 */
export default function useErrorFocus(errors, containerRef = null) {
    const isFirstRun = useRef(true);

    useEffect(() => {
        // Skip the initial render to avoid focusing on mount
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        // Check if errors is a valid object
        if (!errors || typeof errors !== 'object') return;

        const firstErrorKey = Object.keys(errors).find(key => !!errors[key]);
        if (!firstErrorKey) return;

        // Find the element by name or id attribute
        const container = containerRef?.current || document;
        const errorElement = container.querySelector(
            `[name="${firstErrorKey}"], #${firstErrorKey}`
        );

        if (errorElement) {
            // Smooth scroll to center the element
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Focus with preventScroll to avoid double-scrolling
            errorElement.focus({ preventScroll: true });
        }
    }, [errors, containerRef]);
}
