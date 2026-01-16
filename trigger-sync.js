// Trigger MFAPI Full Sync with Admin Authentication
import http from 'http';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Admin Login Required');
console.log('You need admin credentials to trigger MFAPI sync\n');

rl.question('Enter email (default: shashidhar02@gmail.com): ', (email) => {
  email = email.trim() || 'shashidhar02@gmail.com';
  
  rl.question('Enter password: ', (password) => {
    rl.close();
    
    if (!password) {
      console.error('❌ Password is required');
      process.exit(1);
    }
    
    // Step 1: Login to get JWT token
    loginAndSync(email, password);
  });
});

function loginAndSync(email, password) {
  const loginData = JSON.stringify({ email, password });
  
  const loginOptions = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };
  
  console.log('\n🔑 Logging in...');
  
  const loginReq = http.request(loginOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          const token = response.data.token;
          console.log('✅ Login successful!');
          console.log(`👤 Logged in as: ${response.data.user.full_name} (@${response.data.user.username})\n`);
          
          // Step 2: Trigger sync with JWT token
          triggerSync(token);
        } catch (e) {
          console.error('❌ Failed to parse login response:', e.message);
          process.exit(1);
        }
      } else {
        console.error(`❌ Login failed (Status ${res.statusCode}):`);
        try {
          console.error(JSON.parse(data).message);
        } catch (e) {
          console.error(data);
        }
        process.exit(1);
      }
    });
  });
  
  loginReq.on('error', (error) => {
    console.error('❌ Login error:', error.message);
    process.exit(1);
  });
  
  loginReq.write(loginData);
  loginReq.end();
}

function triggerSync(token) {
  const syncOptions = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/ingestion/sync/full',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  console.log('🚀 Triggering MFAPI Full Sync...');
  console.log('This will populate your database with funds from 10 whitelisted AMCs');
  console.log('Please wait, this may take 2-5 minutes...\n');
  
  const syncReq = http.request(syncOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`\n✅ Sync Response (Status ${res.statusCode}):`);
      try {
        const json = JSON.parse(data);
        console.log(JSON.stringify(json, null, 2));
        
        if (res.statusCode === 200 && json.success) {
          console.log('\n🎉 Database population complete!');
          console.log(`📊 Total funds synced: ${json.data?.totalSynced || 'Check logs'}`);
          console.log('\nYou can now browse funds in the application without hitting MFAPI for every request.');
        }
      } catch (e) {
        console.log(data);
      }
    });
  });
  
  syncReq.on('error', (error) => {
    console.error('❌ Error triggering sync:', error.message);
    console.error('\nMake sure the server is running on http://localhost:4000');
    process.exit(1);
  });
  
  syncReq.end();
}
