// TestApp.tsx
import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import TemplateLoader from './components/TemplateLoader';
import SFTPConfigUI from './components/SFTPConfigUI';
import MappingManager from './components/MappingManager';
import { defaultTemplateFields, defaultTemplate, extractAdditionalFields } from './defaultTemplate';

const TestApp: React.FC = () => {
  const [templateFields, setTemplateFields] = useState(defaultTemplateFields);
  const [jsonContent, setJsonContent] = useState<string>('');
  const [currentMappings, setCurrentMappings] = useState<any[]>([]);

  const handleTemplateLoaded = (uploadedTemplate: any) => {
    // Extract any additional fields from uploaded template
    const additionalFields = extractAdditionalFields(uploadedTemplate);
    setTemplateFields([...defaultTemplateFields, ...additionalFields]);
  };

  const handleJsonTransformed = (content: string) => {
    setJsonContent(content);
  };

  const handleMappingChange = (mappings: any[]) => {
    setCurrentMappings(mappings);
  };

  const handleLoadMapping = (mappings: any[]) => {
    setCurrentMappings(mappings);
  };

  const handleSFTPUpload = async (content: string) => {
    // Implement SFTP upload logic here
    try {
      const response = await fetch('http://localhost:3000/api/sftp/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          filename: `transform_${new Date().toISOString()}.json`
        }),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Handle successful upload
      alert('File uploaded successfully!');
    } catch (error) {
      alert('Failed to upload file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Optional Template Upload Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-blue-600 mb-2">
              Optional: Upload Custom Template
            </h1>
            <p className="text-gray-600">
              Upload a custom JSON template to add additional mappable fields
            </p>
          </div>
          <TemplateLoader onTemplateLoaded={handleTemplateLoaded} />
        </div>

        {/* CSV Upload Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-blue-600 mb-2">
              CSV to JSON Transformer
            </h1>
            <p className="text-gray-600">
              Upload your CSV file and map fields to the required structure
            </p>
          </div>
          
          <FileUpload 
            onJsonTransformed={handleJsonTransformed}
            templateFields={templateFields}
            onMappingChange={handleMappingChange}
            currentMappings={currentMappings}
          />
        </div>

        {/* Mapping Manager Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Saved Mappings
          </h2>
          <MappingManager 
            currentMappings={currentMappings}
            onLoadMapping={handleLoadMapping}
          />
        </div>

        {/* JSON Preview Section */}
        {jsonContent && (
          <>
            <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Generated JSON
              </h2>
              <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
                {jsonContent}
              </pre>
            </div>

            {/* SFTP Upload Section */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Upload to SFTP
              </h2>
              <SFTPConfigUI onUpload={() => handleSFTPUpload(jsonContent)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TestApp;