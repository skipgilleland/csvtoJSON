// CSVTransformer.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import MappingConfig from './MappingConfig';
import { mergeWithTemplate, TemplateField, validateMappings } from '../defaultTemplate';

interface CSVRow {
  [key: string]: string;
}

interface ParsedData {
  headers: string[];
  rows: string[][];
}

interface MappingField {
  sourceField: string;
  targetPath: string;
  isStatic: boolean;
  staticValue?: string;
}

interface CSVTransformerProps {
  previewData: string;
  isLargeFile: boolean;
  onTransformed: (jsonContent: string) => void;
  templateFields: TemplateField[];
  onMappingChange: (mappings: any[]) => void;
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
  const [error, setError] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [currentMappings, setCurrentMappings] = useState<MappingField[]>(initialMappings);
  const [showValidation, setShowValidation] = useState(false);

  const transformData = useCallback((mappings: MappingField[], data: CSVRow) => {
    const mappedValues: Record<string, any> = {};
    mappings.forEach(mapping => {
      if (mapping.sourceField && mapping.targetPath) {
        let value = data[mapping.sourceField];
        
        // Convert value based on the template field type
        const templateField = templateFields.find(field => field.path === mapping.targetPath);
        if (templateField) {
          switch (templateField.type) {
            case 'number':
              value = Number(value) || 0;
              break;
            case 'boolean':
              value = value.toLowerCase() === 'true';
              break;
          }
        }
        
        mappedValues[mapping.targetPath] = value;
      }
    });
    return mappedValues;
  }, [templateFields]);

  const parseCSV = useCallback((csvText: string) => {
    try {
      const cleanText = csvText.replace(/^\uFEFF/, '').trim();
      const lines = cleanText.split(/\r?\n/);
      
      if (lines.length === 0) {
        throw new Error('CSV file appears to be empty');
      }

      const headers = lines[0].split(',').map(header => 
        header.trim().replace(/^["']|["']$/g, '')
      );

      const rows = lines.slice(1).map(line => {
        const row: string[] = [];
        let field = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            if (i + 1 < line.length && line[i + 1] === '"') {
              field += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            row.push(field.trim());
            field = '';
          } else {
            field += char;
          }
        }
        
        row.push(field.trim());
        return row;
      }).filter(row => row.length === headers.length);

      setParsedData({ headers, rows });
      return { headers, rows };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      throw new Error(`Error parsing CSV data: ${errorMessage}`);
    }
  }, []);

  const validateAndTransform = useCallback((mappings: MappingField[]) => {
    if (!parsedData || parsedData.rows.length === 0) {
      setError('No data to transform');
      return;
    }

    try {
      const firstRowData = parsedData.rows[0].reduce<Record<string, string>>((acc, value, index) => {
        acc[parsedData.headers[index]] = value;
        return acc;
      }, {});

      const mappedValues = transformData(mappings, firstRowData);

      // Only validate if we have at least one complete mapping
      const hasCompleteMappings = mappings.some(m => m.sourceField && m.targetPath);
      
      if (hasCompleteMappings && showValidation) {
        const validation = validateMappings(mappedValues);
        if (!validation.valid) {
          setValidationErrors(validation.missingFields);
          setError('Invalid mapping configuration. Please check required fields.');
          return;
        }
      }

      // Clear validation errors if we're not showing validation
      if (!showValidation) {
        setValidationErrors([]);
        setError('');
      }

      // Always transform and update JSON output if we have any valid mappings
      if (hasCompleteMappings) {
        const mergedJson = mergeWithTemplate(mappedValues);
        onTransformed(JSON.stringify(mergedJson, null, 2));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error transforming data: ${errorMessage}`);
    }
  }, [parsedData, transformData, onTransformed, showValidation]);

  useEffect(() => {
    if (previewData) {
      try {
        parseCSV(previewData);
        setError('');
        setShowValidation(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
      }
    }
  }, [previewData, parseCSV]);

  const handleMappingChange = useCallback((mappings: MappingField[]) => {
    setCurrentMappings(mappings);
    onMappingChange(mappings);

    // If this is the first mapping, don't show validation yet
    if (mappings.length === 1 && !showValidation) {
      setValidationErrors([]);
      setError('');
    }

    validateAndTransform(mappings);
  }, [onMappingChange, validateAndTransform, showValidation]);

  useEffect(() => {
    if (initialMappings.length > 0 && parsedData) {
      setCurrentMappings(initialMappings);
      validateAndTransform(initialMappings);
    }
  }, [initialMappings, parsedData, validateAndTransform]);

  const handleValidateClick = () => {
    setShowValidation(true);
    validateAndTransform(currentMappings);
  };

  if (!parsedData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {error && showValidation && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
            {validationErrors.length > 0 && (
              <ul className="list-disc list-inside text-sm mt-2">
                {validationErrors.map((field, index) => (
                  <li key={index}>Missing mapping for: {field}</li>
                ))}
              </ul>
            )}
          </div>
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
                {parsedData.headers.map((header, index) => (
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
                {parsedData.rows[0]?.map((cell, index) => (
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
        headers={parsedData.headers}
        templateFields={templateFields}
        onMappingChange={handleMappingChange}
        previewData={parsedData.rows[0]?.reduce((acc, val, idx) => {
          acc[parsedData.headers[idx]] = val;
          return acc;
        }, {} as Record<string, string>)}
        currentMappings={currentMappings}
      />

      {currentMappings.length > 0 && !showValidation && (
        <button
          onClick={handleValidateClick}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Validate Mappings
        </button>
      )}
    </div>
  );
};

export default CSVTransformer;