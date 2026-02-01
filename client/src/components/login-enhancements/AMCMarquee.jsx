import React from 'react';

export default function AMCMarquee() {
    // Using text placeholders styled to look like logos for the demo since we don't have SVG assets yet
    const amcs = [
        { name: 'SBI Mutual Fund', color: 'text-blue-600' },
        { name: 'HDFC Mutual Fund', color: 'text-red-600' },
        { name: 'ICICI Prudential', color: 'text-orange-600' },
        { name: 'Nippon India', color: 'text-red-500' },
        { name: 'Kotak Mutual Fund', color: 'text-red-700' },
        { name: 'Axis Mutual Fund', color: 'text-pink-700' },
        { name: 'UTI Mutual Fund', color: 'text-blue-500' },
        { name: 'Mirae Asset', color: 'text-blue-400' },
    ];

    return (
        <div className="w-full bg-white/50 backdrop-blur-sm border-y border-gray-200 py-6 overflow-hidden">

            <div className="flex animate-marquee-slow whitespace-nowrap items-center">
                {[...amcs, ...amcs, ...amcs].map((amc, i) => (
                    <div key={i} className="mx-8 flex items-center justify-center bg-white px-6 py-3 rounded-lg shadow-sm border border-gray-100 min-w-[180px]">
                        {/* Logo Placeholder */}
                        <span className={`font-bold text-lg ${amc.color}`}>{amc.name}</span>
                    </div>
                ))}
            </div>

            <style>{`
        @keyframes marquee-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-slow {
          animation: marquee-slow 40s linear infinite;
        }
      `}</style>
        </div>
    );
}
