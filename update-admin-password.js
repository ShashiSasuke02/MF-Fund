// Update Admin Password
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const newPassword = 'Naruto@02';
const userId = 1;

async function updatePassword() {
  let connection;
  
  try {
    // Generate bcrypt hash
    console.log('🔐 Generating password hash...');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log('✅ Hash generated');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'root',
      database: 'mfselection'
    });
    console.log('✅ Connected to database');
    
    // Update password
    console.log(`🔄 Updating password for user id=${userId}...`);
    const [result] = await connection.execute(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
      [passwordHash, Date.now(), userId]
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Password updated successfully!');
      
      // Fetch updated user details
      const [rows] = await connection.execute(
        'SELECT id, username, full_name, email_id FROM users WHERE id = ?',
        [userId]
      );
      
      console.log('\n📋 Updated User Details:');
      console.log('─────────────────────────────');
      console.log(`ID: ${rows[0].id}`);
      console.log(`Username: ${rows[0].username}`);
      console.log(`Email: ${rows[0].email_id}`);
      console.log(`Full Name: ${rows[0].full_name}`);
      console.log(`New Password: ${newPassword}`);
      console.log('─────────────────────────────');
      console.log('\n✅ You can now login with the new password!');
    } else {
      console.error('❌ No user found with id=' + userId);
    }
    
  } catch (error) {
    console.error('❌ Error updating password:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updatePassword();
