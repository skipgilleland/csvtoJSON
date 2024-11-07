// src/components/features/TemplateLoader.tsx

import React from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useFileUpload } from '../../hooks/useFileUpload';

interface TemplateField {
  path: string;
  type: string;
  example: string;
  required?: boolean;
  description?: string;
}

interface TemplateLoaderProps {
  onTemplateLoaded: (fields: TemplateField[]) => void;
}

const TemplateLoader: React.FC<TemplateLoaderProps> = ({ onTemplateLoaded }) => {
  const { fileState, handleFileUpload } = useFileUpload((content) => {
    try {
      const template = JSON.parse(content);
      const fields = extractTemplateFields(template);
      onTemplateLoaded(fields);
    } catch (error) {
      console.error('Template processing error:', error);
    }
  }, 'json');

  const extractTemplateFields = (obj: any, prefix = ''): TemplateField[] => {
    let fields: TemplateField[] = [];

    const addField = (path: string, value: any) => {
      if (path) {
        fields.push({
          path,
          type: typeof value,
          example: String(value)
        });
      }
    };

    const processValue = (value: any, path: string) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          addField(path, value);
          if (typeof value[0] === 'object' && value[0] !== null) {
            Object.entries(value[0]).forEach(([key, val]) => {
              const newPath = `${path}[0].${key}`;
              processValue(val, newPath);
            });
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        addField(path, value);
        Object.entries(value).forEach(([key, val]) => {
          const newPath = path ? `${path}.${key}` : key;
          processValue(val, newPath);
        });
      } else {
        addField(path, value);
      }
    };

    Object.entries(obj).forEach(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      processValue(value, path);
    });

    return fields.sort((a, b) => a.path.localeCompare(b.path));
  };

  return (
    <div className="mb-6">
      <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
          id="template-upload"
        />
        <label htmlFor="template-upload" className="cursor-pointer block">
          {fileState.isLoading ? (
            <LoadingSpinner />
          ) : fileState.fileName ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span className="text-gray-700">{fileState.fileName}</span>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 font-medium mb-2">Upload JSON Template</p>
              <p className="text-sm text-gray-500">
                Upload a sample JSON file to define the output structure
              </p>
            </>
          )}
        </label>
      </div>

      {fileState.content && !fileState.isLoading && (
        <div className="mt-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Template loaded successfully
        </div>
      )}
    </div>
  );
};

export default TemplateLoader;