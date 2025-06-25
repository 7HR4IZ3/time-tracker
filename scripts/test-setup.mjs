#!/usr/bin/env node

/**
 * Test script to verify setup script without making actual API calls
 */

console.log('🧪 Testing Appwrite setup script structure...\n');

// Test environment variable detection
console.log('📋 Environment Variables:');
console.log(`   PROJECT_ID: ${process.env.VITE_APPWRITE_PROJECT_ID || '❌ Not set'}`);
console.log(`   ENDPOINT: ${process.env.VITE_APPWRITE_ENDPOINT || '✅ Will use default'}`);

// Test import
try {
  const { Client, Databases, ID, Permission, Role } = await import('appwrite');
  console.log('\n✅ Appwrite SDK import successful');
  console.log(`   Client: ${typeof Client}`);
  console.log(`   Databases: ${typeof Databases}`);
  console.log(`   ID: ${typeof ID}`);
  console.log(`   Permission: ${typeof Permission}`);
  console.log(`   Role: ${typeof Role}`);
} catch (error) {
  console.error('\n❌ Appwrite SDK import failed:', error.message);
  process.exit(1);
}

// Test dotenv import
try {
  const dotenv = await import('dotenv');
  console.log('\n✅ dotenv import successful');
  console.log(`   config: ${typeof dotenv.config}`);
} catch (error) {
  console.error('\n❌ dotenv import failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 All dependencies are properly installed and importable!');
console.log('\n💡 To run the actual setup:');
console.log('   1. Set VITE_APPWRITE_PROJECT_ID in your .env file');
console.log('   2. Run: npm run setup:appwrite');
