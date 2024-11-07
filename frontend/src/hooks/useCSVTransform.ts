// src/hooks/useCSVTransform.ts

import { useState, useCallback } from 'react';
import { CSVData, MappingField } from '../types';

interface UseCSVTransformReturn {
  csvData: CSVData | null;
  processCSV: (content: string) => void;
  transformToJson: (mappings: MappingField[]) => string;
  error: string | null;
}

export const useCSVTransform = (): UseCSVTransformReturn => {
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processCSV = useCallback((content: string) => {
    try {
      const lines = content.trim().split('\n');
      if (lines.length === 0) {
        throw new Error('CSV file appears to be empty');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const preview = lines[1]?.split(',').map(cell => cell.trim()) || [];

      setCsvData({
        headers,
        preview
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing CSV');
      setCsvData(null);
    }
  }, []);

  const transformToJson = useCallback((mappings: MappingField[]): string => {
    if (!csvData) return '';

    try {
      const result: Record<string, any> = {};
      
      mappings.forEach(mapping => {
        if (mapping.sourceField && mapping.targetPath) {
          const value = mapping.isStatic 
            ? mapping.staticValue 
            : csvData.preview[csvData.headers.indexOf(mapping.sourceField)];
          
          const path = mapping.targetPath.split('.');
          let current = result;
          
          path.forEach((key, index) => {
            if (index === path.length - 1) {
              current[key] = value;
            } else {
              current[key] = current[key] || {};
              current = current[key];
            }
          });
        }
      });

      return JSON.stringify(result, null, 2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error transforming to JSON');
      return '';
    }
  }, [csvData]);

  return {
    csvData,
    processCSV,
    transformToJson,
    error
  };
};