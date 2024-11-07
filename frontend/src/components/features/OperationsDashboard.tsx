// src/components/features/OperationsDashboard.tsx

import React, { useState } from 'react';
import { Upload, Eye, Play, FileText, AlertCircle, Download } from 'lucide-react';

// Define these types if not already defined elsewhere
interface SavedMapping {
  id: string;
  name: string;
  mappingFields: any[];
  jsonTemplate: any;
  createdAt: string;
}

interface FileState {
  isLoading: boolean;
  content: string;
  fileName: string | null;
}

interface FileViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
}

// Simple FileViewModal component
const FileViewModal: React.FC<FileViewModalProps> = ({ isOpen, onClose, content, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-3/4 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">{title}</h3>
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

// Simple hook for file handling
const useFileUpload = (onSuccess: (content: string) => void, fileType: string = 'csv') => {
  const [fileState, setFileState] = useState<FileState>({
    isLoading: false,
    content: '',
    fileName: null
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileState(prev => ({
      ...prev,
      isLoading: true,
      fileName: file.name
    }));

    try {
      const text = await file.text();
      setFileState(prev => ({
        ...prev,
        isLoading: false,
        content: text
      }));
      onSuccess(text);
    } catch (error) {
      setFileState(prev => ({
        ...prev,
        isLoading: false,
        content: ''
      }));
      console.error(`Error processing ${fileType.toUpperCase()}:`, error);
    }
  };

  return { fileState, handleFileUpload, setFileState };
};

interface OperationsDashboardProps {
  savedMappings: SavedMapping[];
  onMappingSelect: (id: string) => void;
  onProcessFile: (jsonContent: string) => Promise<void>;
}

const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  savedMappings = [],
  onMappingSelect,
  onProcessFile,
}) => {
  const [selectedMapping, setSelectedMapping] = useState<string>('');
  const [jsonContent, setJsonContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const {
    fileState,
    handleFileUpload: handleFileSelect,
    setFileState
  } = useFileUpload((content) => {
    try {
      setJsonContent(content);
      setError(null);
    } catch (err) {
      setError('Error processing file: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setJsonContent(null);
    }
  }, 'csv');

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
      const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      await handleFileSelect(event);
    }
  };

  const handleMappingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mappingId = e.target.value;
    setSelectedMapping(mappingId);
    if (mappingId) {
      onMappingSelect(mappingId);
      setFileState({
        isLoading: false,
        content: '',
        fileName: null
      });
      setJsonContent(null);
      setError(null);
    }
  };

  const handleProcess = async () => {
    if (!jsonContent) return;

    setIsProcessing(true);
    setError(null);

    try {
      await onProcessFile(jsonContent);
      setIsProcessing(false);
      setFileState({
        isLoading: false,
        content: '',
        fileName: null
      });
      setJsonContent(null);
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
      const downloadName = fileState.fileName
        ? `${fileState.fileName.replace('.csv', '')}_transformed.json`
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
    <div className="space-y-6 bg-white rounded-lg shadow-sm p-6">
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
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
              onChange={handleFileSelect}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-center flex flex-col items-center"
            >
              {fileState.fileName ? (
                <div className="flex items-center gap-2">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <span className="text-gray-600">{fileState.fileName}</span>
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
        title="JSON Preview"
      />
    </div>
  );
};

export default OperationsDashboard;