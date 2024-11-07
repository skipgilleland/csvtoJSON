import React, { useState, useCallback } from 'react';
import { Upload, Eye, Play, FileText, AlertCircle, Download } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MappingField {
  jsonPath: string;
  csvField: string | null;
  isStatic: boolean;
  staticValue: string;
}

interface SavedMapping {
  id: string;
  name: string;
  mappingFields: MappingField[];
  jsonTemplate: any;
  createdAt: string;
}

interface OperationsDashboardProps {
  savedMappings: SavedMapping[];
  onMappingSelect: (id: string) => void;
  onProcessFile: (jsonContent: string) => Promise<void>;
}

const FileViewModal = ({ 
  isOpen, 
  onClose, 
  content 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  content: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-3/4 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">JSON Preview</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="p-4 flex-1 overflow-auto">
          <pre className="bg-gray-50 p-4 rounded text-sm font-mono">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
};

const OperationsDashboard = ({
  savedMappings = [],
  onMappingSelect,
  onProcessFile,
}: OperationsDashboardProps) => {
  const [selectedMapping, setSelectedMapping] = useState<string>('');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [jsonContent, setJsonContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const transformCsvToJson = useCallback((csvContent: string, mapping: SavedMapping) => {
    try {
      // Split CSV into lines and get headers
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV file must contain headers and at least one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const dataRows = lines.slice(1);
      
      // Transform each row into JSON
      const jsonResults = dataRows.map(row => {
        const values = row.split(',').map(cell => cell.trim());
        const csvData: { [key: string]: string } = {};
        
        headers.forEach((header, index) => {
          csvData[header] = values[index] || '';
        });

        // Create a deep copy of the template for each row
        const rowResult = JSON.parse(JSON.stringify(mapping.jsonTemplate));

        // Apply the mappings for this row
        mapping.mappingFields.forEach((field: MappingField) => {
          if (field.isStatic) {
            setNestedValue(rowResult, field.jsonPath, field.staticValue);
          } else if (field.csvField && csvData[field.csvField] !== undefined) {
            setNestedValue(rowResult, field.jsonPath, csvData[field.csvField]);
          }
        });

        return rowResult;
      });

      return JSON.stringify(jsonResults, null, 2);
    } catch (error) {
      console.error('Transform error:', error);
      throw new Error('Failed to transform CSV to JSON: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, []);

  const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
      }
      current = current[key];
    }
    
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (!selectedMapping) {
      setError('Please select a mapping configuration first');
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    try {
      console.log('Reading file:', file.name);
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          console.log('File content loaded, length:', text.length);
          setFileContent(text);
          setUploadedFileName(file.name);
          
          const mapping = savedMappings.find(m => m.id === selectedMapping);
          if (!mapping) {
            setError('Selected mapping configuration not found');
            return;
          }

          const json = transformCsvToJson(text, mapping);
          console.log('JSON transformed successfully');
          setJsonContent(json);
          setError(null);
        } catch (err) {
          console.error('Processing error:', err);
          setError('Error processing file: ' + (err instanceof Error ? err.message : 'Unknown error'));
          setJsonContent(null);
        }
      };

      reader.onerror = (e) => {
        console.error('File read error:', e);
        setError('Error reading file: ' + (e.target?.error?.message || 'Unknown error'));
      };

      reader.readAsText(file);
    } catch (err) {
      console.error('File handling error:', err);
      setError('Error handling file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [selectedMapping, savedMappings, transformCsvToJson]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleMappingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mappingId = e.target.value;
    setSelectedMapping(mappingId);
    if (mappingId) {
      onMappingSelect(mappingId);
      setFileContent(null);
      setJsonContent(null);
      setError(null);
      setUploadedFileName(null);
    }
  };

  const handleProcess = async () => {
    if (!jsonContent) return;

    setIsProcessing(true);
    setError(null);

    try {
      await onProcessFile(jsonContent);
      setIsProcessing(false);
      setFileContent(null);
      setJsonContent(null);
      setUploadedFileName(null);
    } catch (error) {
      console.error('Processing error:', error);
      setError('Failed to process file: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsProcessing(false);
    }
  };

  const handleDownloadJson = () => {
    if (!jsonContent) return;

    try {
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const downloadName = uploadedFileName 
        ? `${uploadedFileName.replace('.csv', '')}_transformed.json`
        : `transformed_${new Date().toISOString()}.json`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download JSON: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Template Selection</h2>
        <select 
          className="w-full p-2 border rounded-md shadow-sm"
          value={selectedMapping}
          onChange={handleMappingChange}
        >
          <option value="">Select a template...</option>
          {savedMappings.map(mapping => (
            <option key={mapping.id} value={mapping.id}>
              {mapping.name} - {new Date(mapping.createdAt).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Upload CSV</h2>
        <div
          className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-center flex flex-col items-center"
            >
              {uploadedFileName ? (
                <div className="flex items-center gap-2">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <span className="text-gray-600">{uploadedFileName}</span>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <span className="text-blue-600 hover:text-blue-500">
                    Click to upload
                  </span>
                  <span className="text-gray-500"> or drag and drop</span>
                  <p className="text-xs text-gray-500 mt-1">CSV files only</p>
                </>
              )}
            </label>
          </div>
        </div>
      </div>

      {jsonContent && (
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </button>
          <button
            onClick={handleDownloadJson}
            className="inline-flex items-center px-4 py-2 border border-green-500 text-green-500 rounded-md hover:bg-green-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download JSON
          </button>
          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            <Play className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Process'}
          </button>
        </div>
      )}

      <FileViewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        content={jsonContent || ''}
      />
    </div>
  );
};

export default OperationsDashboard;