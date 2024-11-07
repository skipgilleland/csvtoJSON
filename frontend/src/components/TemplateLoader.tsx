import React, { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface TemplateField {
  path: string;
  type: string;
  example: string;
}

interface TemplateLoaderProps {
  onTemplateLoaded: (fields: TemplateField[]) => void;
}

const TemplateLoader: React.FC<TemplateLoaderProps> = ({ onTemplateLoaded }) => {
  const [error, setError] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>('');

  const extractFields = (obj: any, prefix = ''): TemplateField[] => {
    let fields: TemplateField[] = [];

    const processValue = (value: any, path: string) => {
      if (Array.isArray(value)) {
        // Handle arrays - process first item as template
        if (value.length > 0) {
          fields = fields.concat(extractFields(value[0], `${path}[0]`));
        }
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested objects
        Object.entries(value).forEach(([key, val]) => {
          const newPath = path ? `${path}.${key}` : key;
          processValue(val, newPath);
        });
      } else {
        // Handle primitive values
        fields.push({
          path: path,
          type: typeof value,
          example: String(value)
        });
      }
    };

    Object.entries(obj).forEach(([key, value]) => {
      const newPath = prefix ? `${prefix}.${key}` : key;
      processValue(value, newPath);
    });

    return fields;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) {
        console.log('No file selected');
        return;
      }

      if (!file.name.endsWith('.json')) {
        setError('Please upload a JSON file');
        return;
      }

      setTemplateName(file.name);
      const content = await file.text();
      console.log('File content:', content.substring(0, 100) + '...'); // Log first 100 chars
      
      const template = JSON.parse(content);
      console.log('Parsed template:', template);
      
      // Extract all possible fields from the template
      const fields = extractFields(template);
      console.log('Extracted fields:', fields);
      
      onTemplateLoaded(fields);
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid format';
      console.error('Template loading error:', err);
      setError('Error loading template: ' + errorMessage);
    }
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
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          {templateName ? (
            <div>
              <FileText className="w-5 h-5 inline-block mr-2 text-blue-500" />
              <span className="text-gray-700">{templateName}</span>
            </div>
          ) : (
            <>
              <p className="text-gray-600 font-medium mb-2">Upload JSON Template</p>
              <p className="text-sm text-gray-500">
                Upload a sample JSON file to define the output structure
              </p>
            </>
          )}
        </label>
      </div>

      {error && (
        <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      {templateName && !error && (
        <div className="mt-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Template loaded successfully
        </div>
      )}
    </div>
  );
};

export default TemplateLoader;