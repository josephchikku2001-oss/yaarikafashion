import firebaseConfig from '../../firebase-applet-config.json';
import { Product, ProductCategory } from '../types';

declare global {
  interface Window {
    google?: any;
  }
}

const CLIENT_ID = firebaseConfig.oAuthClientId || '661013424464-t9tnimaultltkhg8s7sn7lg4opprq4j2.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

let cachedAccessToken: string | null = null;
let cachedUserEmail: string | null = null;

const STORAGE_KEY_SPREADSHEET_ID = 'yaarika_google_spreadsheet_id_v1';
const STORAGE_KEY_AUTO_SYNC = 'yaarika_auto_sync_sheets_v1';
const STORAGE_KEY_TOKEN = 'yaarika_gs_token_v1';
const STORAGE_KEY_EMAIL = 'yaarika_gs_email_v1';

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
    return val !== 'false';
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

export const getGoogleAccessToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
};

export const getConnectedEmail = (): string | null => {
  if (cachedUserEmail) return cachedUserEmail;
  try {
    return localStorage.getItem(STORAGE_KEY_EMAIL);
  } catch {
    return null;
  }
};

export const signOutGoogle = () => {
  cachedAccessToken = null;
  cachedUserEmail = null;
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_EMAIL);
  } catch {}
};

// Sign in with Google using Google Identity Services (GIS) token client (Bypasses auth/unauthorized-domain errors on Vercel and custom domains)
export const signInWithGoogleSheets = async (): Promise<{ email: string; accessToken: string }> => {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services script is loading or blocked. Please check ad blockers or reload.'));
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          const accessToken = response.access_token;
          cachedAccessToken = accessToken;
          try {
            localStorage.setItem(STORAGE_KEY_TOKEN, accessToken);
          } catch {}

          let email = 'admin@yaarika.com';
          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              if (userData.email) {
                email = userData.email;
                cachedUserEmail = email;
                try {
                  localStorage.setItem(STORAGE_KEY_EMAIL, email);
                } catch {}
              }
            }
          } catch {}

          resolve({ email, accessToken });
        }
      });

      tokenClient.requestAccessToken();
    } catch (err) {
      reject(err);
    }
  });
};

export const initGoogleAuth = (
  onAuthSuccess?: (user: { email: string }, token: string) => void,
  onAuthFailure?: () => void
) => {
  const token = getGoogleAccessToken();
  const email = getConnectedEmail() || 'admin@yaarika.com';
  if (token) {
    cachedAccessToken = token;
    cachedUserEmail = email;
    if (onAuthSuccess) onAuthSuccess({ email }, token);
  } else {
    if (onAuthFailure) onAuthFailure();
  }
  return () => {};
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

// Read products from Published Google Sheet CSV (Unauthenticated / Public access)
export const fetchProductsFromPublicSheet = async (spreadsheetId: string): Promise<Product[]> => {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=Products`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Could not load products from Google Sheet. Make sure the sheet is published to web (File -> Share -> Publish to web -> CSV).');
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
    } catch {}

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
