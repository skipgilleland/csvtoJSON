// FileUpload.tsx
import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import CSVTransformer from './CSVTransformer';
import { TemplateField } from '../defaultTemplate';

interface FileUploadProps {
  onJsonTransformed: (jsonContent: string) => void;
  templateFields: TemplateField[];
  onMappingChange: (mappings: any[]) => void;
  currentMappings?: any[];
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onJsonTransformed, 
  templateFields,
  onMappingChange,
  currentMappings = []
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLargeFile, setIsLargeFile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 5MB threshold for client-side processing
  const SIZE_THRESHOLD = 5 * 1024 * 1024;

  const handleFile = async (uploadedFile: File) => {
    setError('');
    setIsLargeFile(false);
    
    if (!uploadedFile) return;
    
    if (!uploadedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFile(uploadedFile);
    await handleFilePreview(uploadedFile);
  };

  const handleFilePreview = async (uploadedFile: File) => {
    setIsProcessing(true);
    try {
      if (uploadedFile.size > SIZE_THRESHOLD) {
        // Large file - show first few lines only
        const chunk = await uploadedFile.slice(0, 1024).text();
        const lines = chunk.split('\n').slice(0, 5).join('\n');
        setPreview(lines);
        setIsLargeFile(true);
      } else {
        // Small file - show entire content
        const content = await uploadedFile.text();
        setPreview(content);
        setIsLargeFile(false);
      }
    } catch (err) {
      setError('Error reading file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleFile(files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      await handleFile(files[0]);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview('');
    setError('');
    setIsProcessing(false);
    setIsDragActive(false);
    setIsLargeFile(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
          ${error ? 'border-red-300' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".csv"
          onChange={handleChange}
        />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-blue-500">Drop the CSV file here</p>
        ) : (
          <div>
            <p className="text-gray-600">Drag and drop a CSV file here, or click to select</p>
            <p className="text-sm text-gray-400 mt-2">Files under {(SIZE_THRESHOLD / 1024 / 1024)}MB will be processed locally</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
          <button
            onClick={resetForm}
            className="absolute top-3 right-3 text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {file && !error && (
        <>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-500" />
              <span className="font-medium">{file.name}</span>
              <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
            </div>
            {isLargeFile && (
              <p className="text-sm text-amber-600">
                Note: This is a large file. Only showing preview of first few rows.
              </p>
            )}
          </div>

          {isProcessing ? (
            <div className="animate-pulse bg-gray-100 h-32 rounded" />
          ) : (
            <CSVTransformer 
              previewData={preview}
              isLargeFile={isLargeFile}
              onTransformed={onJsonTransformed}
              templateFields={templateFields}
              onMappingChange={onMappingChange}
              initialMappings={currentMappings}
            />
          )}
        </>
      )}
    </div>
  );
};

export default FileUpload;