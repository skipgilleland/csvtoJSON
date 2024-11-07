// src/hooks/useFileUpload.ts

import { useState } from 'react';
import { FileState } from '../types';

interface UseFileUploadReturn {
  fileState: FileState;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  setFileState: React.Dispatch<React.SetStateAction<FileState>>;
}

export const useFileUpload = (
  onSuccess?: (content: string) => void,
  fileType: 'json' | 'csv' = 'json'
): UseFileUploadReturn => {
  const [fileState, setFileState] = useState<FileState>({
    isLoading: false,
    content: '',
    fileName: null,
  });

  const validateFile = (file: File): boolean => {
    // Add file size validation (e.g., 10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
    }

    // Validate file type
    if (fileType === 'json' && !file.type.includes('json') && !file.name.endsWith('.json')) {
      throw new Error('Invalid file type. Please upload a JSON file');
    }

    if (fileType === 'csv' && !file.type.includes('csv') && !file.name.endsWith('.csv')) {
      throw new Error('Invalid file type. Please upload a CSV file');
    }

    return true;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Validate file before processing
      validateFile(file);

      setFileState(prev => ({
        ...prev,
        isLoading: true,
        fileName: file.name,
      }));

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;

          if (fileType === 'json') {
            try {
              const json = JSON.parse(content);
              const formattedContent = JSON.stringify(json, null, 2);
              
              setFileState(prev => ({
                ...prev,
                isLoading: false,
                content: formattedContent,
              }));
              
              onSuccess?.(formattedContent);
            } catch (jsonError) {
              throw new Error('Invalid JSON format. Please check the file content.');
            }
          } else {
            // Basic CSV validation
            const lines = content.trim().split('\n');
            if (lines.length < 2) {
              throw new Error('CSV file must contain at least a header row and one data row');
            }

            const headerColumns = lines[0].split(',').length;
            const isValid = lines.every(line => line.split(',').length === headerColumns);
            
            if (!isValid) {
              throw new Error('Invalid CSV format. All rows must have the same number of columns');
            }

            setFileState(prev => ({
              ...prev,
              isLoading: false,
              content,
            }));
            
            onSuccess?.(content);
          }
        } catch (error) {
          throw error;
        }
      };

      reader.onerror = () => {
        throw new Error('Error reading file');
      };

      // Start reading the file
      if (fileType === 'json') {
        reader.readAsText(file);
      } else {
        reader.readAsText(file, 'UTF-8');
      }

    } catch (error) {
      setFileState(prev => ({
        ...prev,
        isLoading: false,
        content: '',
        fileName: null,
      }));

      // Log error and re-throw for handling in the component
      console.error(`Error processing ${fileType.toUpperCase()} file:`, error);
      throw error;
    }
  };

  const resetFileState = () => {
    setFileState({
      isLoading: false,
      content: '',
      fileName: null,
    });
  };

  return { 
    fileState, 
    handleFileUpload, 
    setFileState,
    resetFileState 
  };
};

// Optional: Add type guards for better type safety
export const isJsonContent = (content: string): boolean => {
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
};

export const isCsvContent = (content: string): boolean => {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return false;
  
  const headerColumns = lines[0].split(',').length;
  return lines.every(line => line.split(',').length === headerColumns);
};