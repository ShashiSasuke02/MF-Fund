import React from 'react';

export default function MarketMasteryBanner() {
    const message = "💎 Level Up Your Market IQ: Real-time data. Zero risk. Infinite practice. Dive into the world of Mutual Funds to build, test, and dominate your investment strategies. Turn experience into your greatest asset! Note: Simulated data for educational purposes. For real-world trading, always go through a SEBI-registered firm";

    // Repeat message to ensure smooth continuous scrolling
    const fullText = `${message} ${message} ${message} ${message}`;

    return (
        <div className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-gray-900 via-emerald-900 to-teal-900 text-white overflow-hidden py-3 border-t border-emerald-500/30 z-[100] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="relative flex overflow-x-hidden group">
                <div className="animate-marquee whitespace-nowrap flex items-center group-hover:[animation-play-state:paused] pointer-events-auto">
                    <span className="text-sm md:text-base font-semibold tracking-wide px-4">
                        {fullText}
                    </span>
                    <span className="text-sm md:text-base font-semibold tracking-wide px-4">
                        {fullText}
                    </span>
                </div>
            </div>
        </div>
    );
}
