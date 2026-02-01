import 'dotenv/config.js';

import { initializeDatabase } from './src/db/database.js';
import { mfApiService } from './src/services/mfapi.service.js';

async function debugFunds() {
  try {
    await initializeDatabase();
    console.log('Fetching funds from MFAPI...');
    const funds = await mfApiService.getAllFunds();
    
    console.log(`Total funds: ${funds.length}\n`);
    
    if (funds.length > 0) {
      console.log('=== FIRST 5 FUNDS STRUCTURE ===\n');
      for (let i = 0; i < Math.min(5, funds.length); i++) {
        console.log(`Fund ${i + 1}:`);
        console.log(JSON.stringify(funds[i], null, 2));
        console.log('\n');
      }
      
      // Check for AMC names in funds
      console.log('\n=== CHECKING FOR WHITELISTED AMCs ===\n');
      const AMC_WHITELIST = [
        'SBI Mutual Fund',
        'ICICI Prudential Mutual Fund',
        'HDFC Mutual Fund',
        'Nippon India Mutual Fund',
        'Kotak Mahindra Mutual Fund',
        'Aditya Birla Sun Life Mutual Fund',
        'UTI Mutual Fund',
        'Axis Mutual Fund',
        'Tata Mutual Fund',
        'Mirae Asset Mutual Fund'
      ];
      
      // Sample different property combinations
      const fundSamples = funds.slice(0, 20);
      console.log('Sample fund properties:');
      fundSamples.forEach((fund, idx) => {
        console.log(`\nFund ${idx}: Keys =`, Object.keys(fund).join(', '));
      });
      
      // Count how many match whitelist with different properties
      let matchBySchemeName = 0;
      let matchByFundHouse = 0;
      let matchBySchemeType = 0;
      
      funds.forEach(fund => {
        if (fund.schemeName && AMC_WHITELIST.some(amc => fund.schemeName.includes(amc))) {
          matchBySchemeName++;
        }
        if (fund.fundHouse && AMC_WHITELIST.includes(fund.fundHouse)) {
          matchByFundHouse++;
        }
        if (fund.schemeType && AMC_WHITELIST.some(amc => fund.schemeType.includes(amc))) {
          matchBySchemeType++;
        }
      });
      
      console.log('\n=== WHITELIST MATCHING RESULTS ===');
      console.log(`Matches by schemeName: ${matchBySchemeName}`);
      console.log(`Matches by fundHouse: ${matchByFundHouse}`);
      console.log(`Matches by schemeType: ${matchBySchemeType}`);
      
      // Show first few fund names
      console.log('\n=== FIRST 20 FUND NAMES ===');
      fundSamples.forEach((fund, idx) => {
        console.log(`${idx + 1}. ${fund.schemeName || 'N/A'} (${fund.fundHouse || 'N/A'})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debugFunds();
