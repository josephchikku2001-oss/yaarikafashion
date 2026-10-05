import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle2, 
  AlertCircle, FileText, ArrowRight, X, Sparkles 
} from 'lucide-react';
import { Product } from '../types';
import { parseExcelOrCsvFile, downloadExcelTemplate, exportProductsToCSV } from '../utils/excelUtils';

interface ExcelCsvImporterProps {
  onImportSuccess: (products: Product[]) => void;
  onCancel: () => void;
  fallbackImage: string;
}

export const ExcelCsvImporter: React.FC<ExcelCsvImporterProps> = ({
  onImportSuccess,
  onCancel,
  fallbackImage
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewProducts, setPreviewProducts] = useState<Product[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProcessFile = async (file: File) => {
    setError(null);
    setLoading(true);
    setFileName(file.name);

    try {
      const parsed = await parseExcelOrCsvFile(file, fallbackImage);
      if (parsed.length === 0) {
        throw new Error('No valid products found in the file.');
      }
      setPreviewProducts(parsed);
    } catch (err: any) {
      setError(err?.message || 'Failed to parse Excel/CSV file. Please check file format and columns.');
      setPreviewProducts(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleConfirmImport = () => {
    if (previewProducts && previewProducts.length > 0) {
      onImportSuccess(previewProducts);
    }
  };

  return (
    <div className="bg-white text-stone-900 rounded-xl shadow-2xl border border-stone-200 overflow-hidden">
      
      {/* Header */}
      <div className="p-4 md:p-6 bg-[#380718] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#520d26]">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-300" />
            <h3 className="font-serif-luxury text-xl md:text-2xl font-bold text-[#f5d78a]">
              Import Products via Excel / CSV Spreadsheet
            </h3>
          </div>
          <p className="text-xs text-amber-200/80 mt-1">
            Upload your Excel (.xlsx, .xls) or CSV spreadsheet to add multiple sarees, co-ords, and dresses at once.
          </p>
        </div>

        {/* Template Downloads */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadExcelTemplate}
            className="flex items-center gap-1.5 bg-[#e8a825] hover:bg-[#d99719] text-[#2c0512] font-bold text-xs px-3.5 py-2 rounded-lg shadow transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Excel Template</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Upload Dropzone */}
        {!previewProducts ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
              dragActive
                ? 'border-amber-500 bg-amber-50/50 scale-[0.99]'
                : 'border-stone-300 hover:border-amber-600 hover:bg-stone-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#d4a341]">
              <Upload className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="font-serif-luxury text-lg font-bold text-stone-800">
                Choose Excel (.xlsx) or CSV file or drag &amp; drop here
              </h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Supports standard columns: <strong>Code, Name, Category, Price, OriginalPrice, Fabric, Color, InStock, Description</strong>
              </p>
            </div>

            <div className="mt-2 inline-flex items-center gap-2 bg-[#380718] text-[#f5d78a] px-4 py-2 rounded-xl text-xs font-semibold shadow">
              <span>Select File from Computer</span>
            </div>

            {loading && (
              <div className="mt-3 text-xs font-semibold text-amber-700 animate-pulse">
                Parsing spreadsheet data, please wait...
              </div>
            )}
          </div>
        ) : (
          /* Preview Mode */
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Successfully parsed <strong>{previewProducts.length}</strong> products from <em>{fileName}</em>
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPreviewProducts(null);
                  setFileName(null);
                }}
                className="text-stone-500 hover:text-stone-800 underline text-[11px]"
              >
                Upload different file
              </button>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto max-h-[380px] border border-stone-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-700 font-bold uppercase sticky top-0 border-b border-stone-200">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Code</th>
                    <th className="p-2.5">Title</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Price</th>
                    <th className="p-2.5">Fabric</th>
                    <th className="p-2.5">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {previewProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/40">
                      <td className="p-2.5 text-stone-400 font-bold">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-bold text-amber-900">{p.code}</td>
                      <td className="p-2.5 font-semibold text-stone-800">{p.name}</td>
                      <td className="p-2.5 text-stone-600">{p.category}</td>
                      <td className="p-2.5 font-bold tabular-nums">₹{p.price.toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-stone-500 text-[11px] max-w-xs truncate">{p.fabric}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.inStock ? 'In Stock' : 'Sold Out'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-stone-500">
                Ready to append {previewProducts.length} items to your boutique catalog.
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#128c3e] hover:bg-[#0e7433] text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm &amp; Import All {previewProducts.length} Products</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Error Processing Spreadsheet:</div>
              <div className="text-rose-700 mt-0.5">{error}</div>
              <div className="mt-2 text-stone-600">
                Tip: Click <strong>"Download Excel Template"</strong> above to see the exact column format expected.
              </div>
            </div>
          </div>
        )}

        {/* Informational Guidance Box */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs text-stone-600 space-y-2">
          <div className="font-bold text-stone-800 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-amber-700" />
            <span>Excel / CSV Headers Reference:</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] pt-1">
            <div className="bg-white p-2 rounded border border-stone-200 font-mono">Code (e.g. YRK-101)</div>
            <div className="bg-white p-2 rounded border border-stone-200 font-mono">Name (Product Title)</div>
            <div className="bg-white p-2 rounded border border-stone-200 font-mono">Category (Sarees/Co-ords)</div>
            <div className="bg-white p-2 rounded border border-stone-200 font-mono">Price (Numeric in ₹)</div>
            <div className="bg-white p-2 rounded border border-stone-200 font-mono">OriginalPrice (MRP)</div>
            <div className="bg-white p-2 rounded border border-stone-200 font-mono">Fabric (Kasavu Handloom)</div>
            <div className="bg-white p-2 rounded border border-stone-200 font-mono">Color (Ivory & Gold)</div>
            <div className="bg-white p-2 rounded border border-stone-200 font-mono">InStock (YES / NO)</div>
          </div>
        </div>

      </div>

    </div>
  );
};
