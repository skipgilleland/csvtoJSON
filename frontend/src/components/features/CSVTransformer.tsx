// src/components/features/CSVTransformer.tsx

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import MappingConfig from './MappingConfig';
import { useCSVTransform } from '../../hooks/useCSVTransform';
import { MappingField } from '../../types';

interface CSVTransformerProps {
  previewData: string;
  isLargeFile: boolean;
  onTransformed: (jsonContent: string) => void;
  templateFields: any[];
  onMappingChange: (mappings: MappingField[]) => void;
  initialMappings?: MappingField[];
}

const CSVTransformer: React.FC<CSVTransformerProps> = ({
  previewData,
  isLargeFile,
  onTransformed,
  templateFields,
  onMappingChange,
  initialMappings = []
}) => {
  const { csvData, processCSV, transformToJson, error } = useCSVTransform();
  const [showValidation, setShowValidation] = useState(false);
  const [currentMappings, setCurrentMappings] = useState<MappingField[]>(initialMappings);

  useEffect(() => {
    if (previewData) {
      processCSV(previewData);
    }
  }, [previewData, processCSV]);

  useEffect(() => {
    if (initialMappings.length > 0 && csvData) {
      setCurrentMappings(initialMappings);
      const jsonOutput = transformToJson(initialMappings);
      onTransformed(jsonOutput);
    }
  }, [initialMappings, csvData, transformToJson, onTransformed]);

  const handleMappingChange = (mappings: MappingField[]) => {
    setCurrentMappings(mappings);
    onMappingChange(mappings);
    const jsonOutput = transformToJson(mappings);
    onTransformed(jsonOutput);
  };

  if (!csvData) return null;

  return (
    <div className="space-y-6">
      {error && showValidation && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {isLargeFile && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          Note: This is a large file. Only the first row will be shown in the preview.
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded">
        <h3 className="text-lg font-medium mb-4">CSV Preview</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {csvData.headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                {csvData.preview.map((cell, index) => (
                  <td
                    key={index}
                    className="px-3 py-2 whitespace-nowrap text-sm text-gray-500"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <MappingConfig
        headers={csvData.headers}
        templateFields={templateFields}
        onMappingChange={handleMappingChange}
        previewData={csvData.preview.reduce((acc, val, idx) => {
          acc[csvData.headers[idx]] = val;
          return acc;
        }, {} as Record<string, string>)}
        currentMappings={currentMappings}
      />

      {currentMappings.length > 0 && !showValidation && (
        <button
          onClick={() => setShowValidation(true)}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Validate Mappings
        </button>
      )}
    </div>
  );
};

export default CSVTransformer;