#!/usr/bin/env node

/**
 * Appwrite Database Setup Script (ES Module version)
 * 
 * This script automatically creates the required database and collection
 * for the TimeTracker snapshot sharing feature.
 * 
 * Usage:
 *   node scripts/setup-appwrite.mjs
 * 
 * Requirements:
 *   - VITE_APPWRITE_PROJECT_ID environment variable
 *   - VITE_APPWRITE_ENDPOINT environment variable
 *   - Appwrite project with appropriate permissions
 */

import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.VITE_APPWRITE_API_KEY;
const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const DATABASE_ID = 'timetracker-snapshots';
const COLLECTION_ID = 'snapshots';

if (!PROJECT_ID) {
  console.error('❌ Error: VITE_APPWRITE_PROJECT_ID environment variable is required');
  console.log('💡 Please set your Appwrite Project ID in .env file');
  process.exit(1);
}

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function setupDatabase() {
  console.log('🚀 Setting up Appwrite database for TimeTracker snapshots...\n');
  
  try {
    // Step 1: Create database
    console.log('📁 Creating database...');
    try {
      await databases.create(
        DATABASE_ID,
        'TimeTracker Snapshots',
        true // enabled
      );
      console.log('✅ Database created successfully');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Database already exists, skipping creation');
      } else {
        throw error;
      }
    }

    // Step 2: Create collection
    console.log('\n📋 Creating snapshots collection...');
    try {
      await databases.createCollection(
        DATABASE_ID,
        COLLECTION_ID,
        'Snapshots',
        [
          Permission.read(Role.any()),     // Anyone can read snapshots
          Permission.create(Role.any()),   // Anyone can create snapshots
          Permission.update(Role.any()),   // Anyone can update snapshots
          Permission.delete(Role.any())    // Anyone can delete snapshots
        ],
        false, // documentSecurity disabled for simplicity
        true   // enabled
      );
      console.log('✅ Collection created successfully');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Collection already exists, skipping creation');
      } else {
        throw error;
      }
    }

    // Step 3: Create attributes
    console.log('\n🏷️  Creating collection attributes...');
    
    const attributes = [
      {
        key: 'title',
        type: 'string',
        size: 255,
        required: false,
        default: null,
        array: false
      },
      {
        key: 'description',
        type: 'string',
        size: 1000,
        required: false,
        default: null,
        array: false
      },
      {
        key: 'data',
        type: 'string',
        size: 16777216, // 16MB for large snapshots
        required: true,
        default: null,
        array: false
      },
      {
        key: 'createdAt',
        type: 'datetime',
        required: true,
        default: null,
        array: false
      }
    ];

    for (const attr of attributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            attr.key,
            attr.size,
            attr.required,
            attr.default,
            attr.array
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
        }
        console.log(`✅ Created attribute: ${attr.key}`);
        
        // Wait a bit between attribute creations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Attribute '${attr.key}' already exists, skipping`);
        } else {
          console.error(`❌ Error creating attribute '${attr.key}':`, error.message);
        }
      }
    }

    // Wait for attributes to be ready before creating indexes
    console.log('\n⏳ Waiting for attributes to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Create indexes for better performance
    console.log('\n🔍 Creating indexes...');
    
    const indexes = [
      {
        key: 'createdAt_index',
        type: 'key',
        attributes: ['createdAt'],
        orders: ['DESC']
      },
      {
        key: 'title_index',
        type: 'fulltext',
        attributes: ['title']
      }
    ];

    for (const index of indexes) {
      try {
        await databases.createIndex(
          DATABASE_ID,
          COLLECTION_ID,
          index.key,
          index.type,
          index.attributes,
          index.orders || []
        );
        console.log(`✅ Created index: ${index.key}`);
        
        // Wait between index creations
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Index '${index.key}' already exists, skipping`);
        } else {
          console.error(`❌ Error creating index '${index.key}':`, error.message);
        }
      }
    }

    console.log('\n🎉 Appwrite setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Database ID: ${DATABASE_ID}`);
    console.log(`   Collection ID: ${COLLECTION_ID}`);
    console.log(`   Endpoint: ${ENDPOINT}`);
    console.log(`   Project ID: ${PROJECT_ID}`);
    
    console.log('\n🔗 Your app is now ready to create and share snapshots!');
    console.log('💡 You can manage your data at: https://cloud.appwrite.io/console');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    
    if (error.code === 401) {
      console.log('\n💡 This might be a permissions issue. Make sure:');
      console.log('   - Your Project ID is correct');
      console.log('   - Your project allows server-side API access');
      console.log('   - You have the necessary permissions in your Appwrite project');
    }
    
    process.exit(1);
  }
}

// Verification function
async function verifySetup() {
  console.log('\n🔍 Verifying setup...');
  
  try {
    const database = await databases.get(DATABASE_ID);
    console.log('✅ Database verification passed');
    
    const collection = await databases.getCollection(DATABASE_ID, COLLECTION_ID);
    console.log('✅ Collection verification passed');
    
    console.log(`📊 Collection info: ${collection.total} attributes configured`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await setupDatabase();
    await verifySetup();
  } catch (error) {
    console.error('\n💥 Script execution failed');
    process.exit(1);
  }
}

// Run the script
main();
