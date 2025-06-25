import { Client, Databases, ID } from 'appwrite';

// Appwrite configuration
const client = new Client();

// You'll need to set these environment variables or update with your Appwrite instance
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || 'your-project-id';
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';

client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const databases = new Databases(client);
export const DATABASE_ID = 'timetracker-snapshots';
export const COLLECTION_ID = 'snapshots';

// Initialize Appwrite client and export
export { client };
export const appwriteService = {
  client,
  databases,
  DATABASE_ID,
  COLLECTION_ID,
};
