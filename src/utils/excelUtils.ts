import * as XLSX from 'xlsx';
import { Product, ProductCategory } from '../types';

export interface ProductExcelRow {
  Code: string;
  Name: string;
  Category: string;
  Price: number;
  OriginalPrice?: number;
  Fabric?: string;
  Color?: string;
  Description?: string;
  InStock?: string | boolean;
  Image?: string;
}

export const EXCEL_COLUMNS = [
  'Code',
  'Name',
  'Category',
  'Price',
  'OriginalPrice',
  'Fabric',
  'Color',
  'Description',
  'InStock',
  'Image'
];

/**
 * Export products to an Excel (.xlsx) file and trigger browser download
 */
export function exportProductsToExcel(products: Product[], filename = 'yaarika_products_catalog.xlsx') {
  const data = products.map((p) => ({
    Code: p.code,
    Name: p.name,
    Category: p.category,
    'Price (INR)': p.price,
    'Original Price / MRP (INR)': p.originalPrice || p.price,
    Fabric: p.fabric,
    Color: p.color,
    'In Stock': p.inStock ? 'YES' : 'NO',
    'New Arrival': p.isNewArrival ? 'YES' : 'NO',
    'Bestseller': p.isBestseller ? 'YES' : 'NO',
    Description: p.description,
    Image: p.image,
    Images: p.images && p.images.length > 0 ? p.images.join(', ') : p.image
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths for readable Excel display
  worksheet['!cols'] = [
    { wch: 12 }, // Code
    { wch: 35 }, // Name
    { wch: 20 }, // Category
    { wch: 14 }, // Price
    { wch: 22 }, // Original Price
    { wch: 40 }, // Fabric
    { wch: 18 }, // Color
    { wch: 12 }, // In Stock
    { wch: 14 }, // New Arrival
    { wch: 14 }, // Bestseller
    { wch: 45 }, // Description
    { wch: 30 }  // Image
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Yaarika Products');

  XLSX.writeFile(workbook, filename);
}

/**
 * Export products to a CSV file and trigger browser download
 */
export function exportProductsToCSV(products: Product[], filename = 'yaarika_products_catalog.csv') {
  const data = products.map((p) => ({
    Code: p.code,
    Name: p.name,
    Category: p.category,
    Price: p.price,
    OriginalPrice: p.originalPrice || p.price,
    Fabric: p.fabric,
    Color: p.color,
    InStock: p.inStock ? 'YES' : 'NO',
    Description: p.description
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download blank Excel template for adding products
 */
export function downloadExcelTemplate() {
  const templateRows: ProductExcelRow[] = [
    {
      Code: 'YRK-201',
      Name: 'Traditional Kasavu Zari Border Saree',
      Category: 'Traditional Sarees',
      Price: 3899,
      OriginalPrice: 4999,
      Fabric: 'Pure Tissue Kasavu Handloom',
      Color: 'Off-White & Gold',
      Description: 'Handwoven Kerala festive Kasavu saree with ceremonial zari border',
      InStock: 'YES',
      Image: ''
    },
    {
      Code: 'YRK-202',
      Name: 'Festive Emerald Embroidered Co-ord Set',
      Category: 'Co-ord Sets',
      Price: 2999,
      OriginalPrice: 3999,
      Fabric: 'Modal Silk with Hand Zari Threadwork',
      Color: 'Emerald Green',
      Description: 'Two piece contemporary festive tunic and palazzo trouser ensemble',
      InStock: 'YES',
      Image: ''
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);
  worksheet['!cols'] = [
    { wch: 12 }, { wch: 35 }, { wch: 20 }, { wch: 12 }, 
    { wch: 15 }, { wch: 35 }, { wch: 18 }, { wch: 45 }, { wch: 10 }, { wch: 25 }
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  XLSX.writeFile(workbook, 'yaarika_products_import_template.xlsx');
}

/**
 * Parse an uploaded Excel (.xlsx, .xls) or CSV file into Product array
 */
export async function parseExcelOrCsvFile(file: File, fallbackImage: string): Promise<Product[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('No rows found in uploaded file.');
        }

        const validCategories = new Set([
          'Traditional Sarees',
          'Co-ord Sets',
          'Churidar Sets',
          'Fusion Wear',
          'New Arrivals'
        ]);

        const parsedProducts: Product[] = rawRows.map((row, index) => {
          // Normalize column headers case-insensitively
          const getVal = (possibleKeys: string[]) => {
            for (const key of possibleKeys) {
              for (const rowKey of Object.keys(row)) {
                if (rowKey.trim().toLowerCase() === key.toLowerCase()) {
                  return row[rowKey];
                }
              }
            }
            return '';
          };

          const code = String(getVal(['code', 'product code', 'item code', 'id']) || `YRK-${Date.now().toString().slice(-4)}-${index + 1}`).trim();
          const name = String(getVal(['name', 'title', 'product name', 'product title', 'item name']) || `Boutique Saree ${index + 1}`).trim();
          
          let rawCategory = String(getVal(['category', 'type', 'collection'])).trim();
          let category: Exclude<ProductCategory, 'All'> = 'Traditional Sarees';

          if (rawCategory && validCategories.has(rawCategory)) {
            category = rawCategory as Exclude<ProductCategory, 'All'>;
          } else if (rawCategory.toLowerCase().includes('coord') || rawCategory.toLowerCase().includes('co-ord')) {
            category = 'Co-ord Sets';
          } else if (rawCategory.toLowerCase().includes('churidar') || rawCategory.toLowerCase().includes('suit')) {
            category = 'Churidar Sets';
          } else if (rawCategory.toLowerCase().includes('fusion')) {
            category = 'Fusion Wear';
          }

          const rawPrice = Number(getVal(['price', 'selling price', 'price (inr)', 'rate'])) || 3499;
          const rawOriginalPrice = Number(getVal(['originalprice', 'original price', 'mrp', 'regular price'])) || Math.round(rawPrice * 1.3);

          const fabric = String(getVal(['fabric', 'material', 'weave', 'fabric details']) || 'Authentic Kerala Kasavu Handloom with Fine Zari').trim();
          const color = String(getVal(['color', 'colour', 'shade']) || 'Ivory & Gold').trim();
          const description = String(getVal(['description', 'details', 'about']) || `${name} - Handcrafted Kerala boutique edition.`).trim();
          
          const rawInStock = String(getVal(['instock', 'in stock', 'status', 'stock'])).trim().toLowerCase();
          const inStock = rawInStock === 'no' || rawInStock === 'false' || rawInStock === 'sold out' ? false : true;

          const rawImagesStr = String(getVal(['images', 'photos', 'image', 'image url', 'photo', 'url']) || fallbackImage).trim();
          const parsedImagesList = rawImagesStr.includes(',')
            ? rawImagesStr.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5)
            : [rawImagesStr || fallbackImage];
          const primaryImage = parsedImagesList[0] || fallbackImage;

          return {
            id: 'yrk-import-' + Date.now() + '-' + index,
            code,
            name,
            category,
            price: rawPrice,
            originalPrice: rawOriginalPrice,
            fabric,
            color,
            description,
            inStock,
            isNewArrival: true,
            isBestseller: false,
            blouseIncluded: true,
            image: primaryImage,
            images: parsedImagesList
          };
        });

        resolve(parsedProducts);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}
