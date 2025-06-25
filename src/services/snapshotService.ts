import { ID } from 'appwrite';
import { databases, DATABASE_ID, COLLECTION_ID } from '@/lib/appwrite';
import { AppSnapshot, ShareableSnapshot } from '@/types/snapshot';

export class SnapshotService {
  
  /**
   * Save a snapshot to Appwrite
   */
  static async saveSnapshot(snapshot: ShareableSnapshot): Promise<string> {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          title: snapshot.title || 'TimeTracker Snapshot',
          description: snapshot.description || '',
          data: JSON.stringify(snapshot),
          createdAt: new Date().toISOString(),
        }
      );
      
      return doc.$id;
    } catch (error) {
      console.error('Error saving snapshot:', error);
      
      // Provide helpful error messages
      if (error.code === 404) {
        throw new Error('Database or collection not found. Please run "npm run setup:appwrite" to initialize the database.');
      } else if (error.code === 401) {
        throw new Error('Invalid Appwrite credentials. Please check your Project ID in the .env file.');
      } else {
        throw new Error('Failed to save snapshot. Please try again.');
      }
    }
  }

  /**
   * Load a snapshot from Appwrite by ID
   */
  static async loadSnapshot(snapshotId: string): Promise<AppSnapshot> {
    try {
      const doc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        snapshotId
      );
      
      const snapshotData = JSON.parse(doc.data);
      
      return {
        id: doc.$id,
        createdAt: doc.createdAt,
        ...snapshotData,
      };
    } catch (error) {
      console.error('Error loading snapshot:', error);
      
      // Provide helpful error messages
      if (error.code === 404) {
        throw new Error('Snapshot not found. The link may be invalid or the snapshot may have been deleted.');
      } else if (error.code === 401) {
        throw new Error('Invalid Appwrite credentials. Please check your Project ID in the .env file.');
      } else {
        throw new Error('Failed to load snapshot. Please try again.');
      }
    }
  }

  /**
   * Generate a shareable URL for a snapshot
   */
  static generateShareableUrl(snapshotId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?snapshot=${snapshotId}`;
  }

  /**
   * Extract snapshot ID from URL
   */
  static getSnapshotIdFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('snapshot');
  }

  /**
   * Create a snapshot from current app state
   */
  static createSnapshot(
    timeEntries: any[],
    settings: {
      defaultHourlyRate: number;
      defaultRoundingInterval: 15 | 30 | 60;
      currentFilters?: any;
    },
    options?: {
      title?: string;
      description?: string;
      invoiceState?: any;
      activeView?: 'dashboard' | 'analytics' | 'invoice';
    }
  ): ShareableSnapshot {
    return {
      title: options?.title || `Snapshot ${new Date().toLocaleDateString()}`,
      description: options?.description || '',
      timeEntries,
      defaultHourlyRate: settings.defaultHourlyRate,
      defaultRoundingInterval: settings.defaultRoundingInterval,
      currentFilters: settings.currentFilters,
      activeView: options?.activeView || 'dashboard',
      invoiceState: options?.invoiceState,
      uiState: {
        darkMode: document.documentElement.classList.contains('dark'),
      },
    };
  }
}
