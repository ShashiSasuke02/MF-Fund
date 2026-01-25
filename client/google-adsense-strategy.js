// Google AdSense Implementation Guide for RealEE/TryMutualFunds
// Strategic ad placement across all calculator components

const calculatorFiles = [
  'LoanBasicCalculator.jsx',
  'LoanAdvancedCalculator.jsx',
  'FDPayoutCalculator.jsx',
  'FDCumulativeCalculator.jsx',
  'RDCalculator.jsx',
  'PPFCalculator.jsx',
  'SSACalculator.jsx',
  'SCSSCalculator.jsx',
  'POMISCalculator.jsx',
  'PORDCalculator.jsx',
  'POTDCalculator.jsx',
  'NSCCalculator.jsx',
  'SWPCalculator.jsx',

  'NPSCalculator.jsx',
  'EPFCalculator.jsx',
  'APYCalculator.jsx',
  'CompoundInterestCalculator.jsx',
  'SimpleInterestCalculator.jsx'
];

/**
 * STRATEGIC AD PLACEMENT STRATEGY
 * Following Google AdSense Best Practices
 * 
 * 1. BANNER AD (Top of Page)
 *    - Placed immediately after component mount, before form
 *    - High visibility, non-intrusive
 *    - Format: Horizontal banner (728x90 or responsive)
 * 
 * 2. DISPLAY AD (After Results)
 *    - Shown only when results are calculated
 *    - Contextually relevant moment (user has engaged)
 *    - Format: Responsive display ad
 * 
 * 3. COMPLIANCE CONSIDERATIONS
 *    - Ads do NOT block primary content
 *    - Clear visual separation from content
 *    - Ads load asynchronously (no performance impact)
 *    - Proper labeling via AdSense component
 *    - Meets Google's "above the fold" guidelines
 * 
 * 4. REVENUE OPTIMIZATION
 *    - 2 ad units per calculator page (Google recommended max: 3 per page)
 *    - Strategic placement at high-engagement moments
 *    - Responsive ads for mobile/desktop optimization
 *    - Ad refresh handled by Google (no manual refresh needed)
 */

const adPlacementTemplate = {
  // Import statement to add
  import: "import { BannerAd, DisplayAd } from '../AdSense';",

  // Banner ad placement (top of component, after opening <div>)
  topBanner: {
    position: "After return ( <div className=\"space-y-6\">",
    code: `      {/* Top Banner Ad - Google AdSense */}\n      <BannerAd className=\"mb-6\" />\n      `
  },

  // Display ad placement (after results section)
  bottomDisplay: {
    position: "After results render block, before closing </div>",
    code: `\n      {/* Display Ad - Shows after calculation */}\n      {result && <DisplayAd className=\"mt-8\" />}`
  }
};

/**
 * IMPLEMENTATION STEPS FOR EACH CALCULATOR:
 * 
 * 1. Add import: import { BannerAd, DisplayAd } from '../AdSense';
 * 2. Add BannerAd after opening div: <BannerAd className="mb-6" />
 * 3. Add DisplayAd after results: {result && <DisplayAd className="mt-8" />}
 * 
 * EXAMPLE STRUCTURE:
 * 
 * export default function CalculatorComponent() {
 *   // ... state and handlers ...
 *   
 *   return (
 *     <div className="space-y-6">
 *       {/* Top Banner Ad *\/}
 *       <BannerAd className="mb-6" />
 *       
 *       {/* Info Box *\/}
 *       <div className="bg-blue-50...">...</div>
 *       
 *       {/* Form *\/}
 *       <form>...</form>
 *       
 *       {/* Results *\/}
 *       {result && (
 *         <div>...</div>
 *       )}
 *       
 *       {/* Display Ad (shown only with results) *\/}
 *       {result && <DisplayAd className="mt-8" />}
 *     </div>
 *   );
 * }
 */

module.exports = { calculatorFiles, adPlacementTemplate };
