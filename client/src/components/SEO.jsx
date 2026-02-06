
import React from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * SEO Component
 * Optimized for MF-Investments
 */
const SEO = ({ title, description, keywords, image, url, type = 'website', schema }) => {
    const siteTitle = 'MF-Investments';
    const fullTitle = title === siteTitle ? siteTitle : `${title} | ${siteTitle}`;
    const defaultDescription = 'Practice mutual fund investing with virtual money. Track real-time fund performance, analyze active schemes, and master market strategies risk-free.';
    const defaultTopics = 'mutual funds, paper trading, investment simulator, virtual portfolio, stock market india, sip calculator, swp calculator';
    const defaultImage = '/og-image.jpg'; // Placeholder - create this in public/ later if needed

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name='description' content={description || defaultDescription} />
            <meta name='keywords' content={keywords ? `${keywords}, ${defaultTopics}` : defaultTopics} />

            {/* Open Graph / Facebook */}
            <meta property='og:type' content={type} />
            <meta property='og:title' content={fullTitle} />
            <meta property='og:description' content={description || defaultDescription} />
            <meta property='og:image' content={image || defaultImage} />
            <meta property='og:url' content={url || window.location.href} />
            <meta property='og:site_name' content={siteTitle} />

            {/* Twitter */}
            <meta name='twitter:card' content='summary_large_image' />
            <meta name='twitter:title' content={fullTitle} />
            <meta name='twitter:description' content={description || defaultDescription} />
            <meta name='twitter:image' content={image || defaultImage} />

            {/* Structured Data (JSON-LD) */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};

SEO.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    keywords: PropTypes.string,
    image: PropTypes.string,
    url: PropTypes.string,
    type: PropTypes.string,
    schema: PropTypes.object
};

export default SEO;
