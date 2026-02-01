import React from 'react';

export default function MarketTicker() {
    const indices = [
        { name: 'NIFTY 50', value: '24,350.50', change: '+120.30', isUp: true },
        { name: 'SENSEX', value: '79,850.10', change: '+350.20', isUp: true },
        { name: 'NIFTY BANK', value: '52,100.00', change: '-80.50', isUp: false },
        { name: 'NIFTY CAKE', value: '12,500.00', change: '+45.00', isUp: true },
        { name: 'GOLD', value: '72,000.00', change: '-150.00', isUp: false },
        { name: 'USD/INR', value: '83.50', change: '+0.10', isUp: true },
    ];

    return (
        <div className="w-full bg-gray-900 text-white overflow-hidden py-2 border-b border-gray-800">
            <div className="flex animate-marquee whitespace-nowrap">
                {[...indices, ...indices, ...indices].map((index, i) => (
                    <div key={i} className="flex items-center mx-6 space-x-2 text-sm">
                        <span className="font-bold text-gray-400">{index.name}</span>
                        <span className="font-mono">{index.value}</span>
                        <span className={`flex items-center ${index.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                            {index.isUp ? '▲' : '▼'} {index.change}
                        </span>
                    </div>
                ))}
            </div>

            {/* Add keyframes for marquee in global css or inline style block if needed, 
          but utilizing tailwind config extension is cleaner. 
          For demo, I'll add a style tag here for portability. */}
            <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
        </div>
    );
}
