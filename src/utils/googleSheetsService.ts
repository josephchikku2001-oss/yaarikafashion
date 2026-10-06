import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, ProductCategory } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleSheets = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token for Sheets');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const signOutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

const STORAGE_KEY_SPREADSHEET_ID = 'yaarika_google_spreadsheet_id_v1';
const STORAGE_KEY_AUTO_SYNC = 'yaarika_auto_sync_sheets_v1';

export const getStoredSpreadsheetId = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY_SPREADSHEET_ID) || '';
  } catch {
    return '';
  }
};

export const saveStoredSpreadsheetId = (id: string) => {
  try {
    localStorage.setItem(STORAGE_KEY_SPREADSHEET_ID, id.trim());
  } catch (e) {
    console.error('Error saving spreadsheet id', e);
  }
};

export const getAutoSyncEnabled = (): boolean => {
  try {
    const val = localStorage.getItem(STORAGE_KEY_AUTO_SYNC);
    return val !== 'false'; // default true
  } catch {
    return true;
  }
};

export const setAutoSyncEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY_AUTO_SYNC, enabled ? 'true' : 'false');
  } catch (e) {
    console.error(e);
  }
};

// Create a new Google Sheet for Yaarika Boutique
export const createYaarikaSpreadsheet = async (accessToken: string): Promise<string> => {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'Yaarika Boutique Products & Inventory (Rithik)'
      },
      sheets: [
        {
          properties: {
            title: 'Products'
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to create spreadsheet: ${err}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  saveStoredSpreadsheetId(spreadsheetId);

  // Initialize headers
  await updateSheetValues(spreadsheetId, accessToken, 'Products!A1:N1', [
    [
      'ID',
      'Code',
      'Name',
      'Category',
      'Price',
      'OriginalPrice',
      'Image',
      'Description',
      'Fabric',
      'Color',
      'InStock',
      'IsNewArrival',
      'TotalStock',
      'SizesJSON'
    ]
  ]);

  return spreadsheetId;
};

// Read products from Google Sheet via API (Authenticated)
export const fetchProductsFromSheet = async (spreadsheetId: string, accessToken: string): Promise<Product[]> => {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Products!A1:N500`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to read spreadsheet: ${err}`);
  }

  const data = await res.json();
  const rows = data.values;
  if (!rows || rows.length <= 1) {
    return [];
  }

  const productRows = rows.slice(1);
  return parseRowsToProducts(productRows);
};

// Read products from Published Google Sheet CSV (Unauthenticated / Public access for any visitor anywhere)
export const fetchProductsFromPublicSheet = async (spreadsheetId: string): Promise<Product[]> => {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=Products`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Could not load products from Google Sheet. Make sure the sheet is shared or published to web.');
  }
  const csvText = await res.text();
  const rows = parseCsvText(csvText);
  if (rows.length <= 1) return [];
  return parseRowsToProducts(rows.slice(1));
};

// Write / Sync products to Google Sheet
export const syncProductsToSheet = async (spreadsheetId: string, accessToken: string, products: Product[]): Promise<void> => {
  const header = [
    'ID',
    'Code',
    'Name',
    'Category',
    'Price',
    'OriginalPrice',
    'Image',
    'Description',
    'Fabric',
    'Color',
    'InStock',
    'IsNewArrival',
    'TotalStock',
    'SizesJSON'
  ];

  const rows = products.map((p) => [
    p.id,
    p.code,
    p.name,
    p.category,
    p.price,
    p.originalPrice || '',
    p.image || '',
    p.description || '',
    p.fabric || '',
    p.color || '',
    p.inStock ? 'TRUE' : 'FALSE',
    p.isNewArrival ? 'TRUE' : 'FALSE',
    p.totalStock || 20,
    JSON.stringify(p.sizes || [])
  ]);

  const allValues = [header, ...rows];

  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Products!A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: 'Products!A1',
      majorDimension: 'ROWS',
      values: allValues
    })
  });

  if (!updateRes.ok) {
    const err = await updateRes.text();
    throw new Error(`Failed to update spreadsheet values: ${err}`);
  }
};

const updateSheetValues = async (spreadsheetId: string, accessToken: string, range: string, values: any[][]) => {
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values
    })
  });
};

function parseRowsToProducts(productRows: string[][]): Product[] {
  const validCategories = new Set([
    'Traditional Sarees',
    'Co-ord Sets',
    'Churidar Sets',
    'Fusion Wear',
    'New Arrivals'
  ]);

  return productRows.map((row: string[], index: number) => {
    let sizes = [{ size: 'Free Size', count: 10 }];
    try {
      if (row[13]) {
        sizes = JSON.parse(row[13]);
      }
    } catch {
      // fallback
    }

    let category: Exclude<ProductCategory, 'All'> = 'Traditional Sarees';
    const catVal = row[3]?.trim();
    if (validCategories.has(catVal)) {
      category = catVal as Exclude<ProductCategory, 'All'>;
    }

    return {
      id: row[0] || `yrk-sheet-${index}`,
      code: row[1] || `YRK-${100 + index}`,
      name: row[2] || 'Boutique Saree',
      category,
      price: Number(row[4]) || 1499,
      originalPrice: row[5] ? Number(row[5]) : undefined,
      image: row[6] || '',
      description: row[7] || '',
      fabric: row[8] || 'Pure Handloom Silk',
      color: row[9] || 'Traditional Gold',
      inStock: row[10] !== 'false' && row[10] !== 'FALSE',
      isNewArrival: row[11] === 'true' || row[11] === 'TRUE',
      totalStock: row[12] ? Number(row[12]) : 20,
      sizes
    };
  });
}

function parseCsvText(text: string): string[][] {
  const lines = text.split('\n');
  const result: string[][] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let inQuotes = false;
    let currentVal = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal.trim().replace(/^"|"$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    row.push(currentVal.trim().replace(/^"|"$/g, ''));
    result.push(row);
  }
  return result;
}
