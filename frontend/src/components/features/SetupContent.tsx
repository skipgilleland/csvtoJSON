// src/components/features/SetupContent.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Eye, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useFileUpload } from '../../hooks/useFileUpload';
import type { FileState } from '../../types';

interface SetupContentProps {
  onJsonUpload: (content: string) => void;
  onCsvUpload: (content: string) => void;
  showJsonModal: boolean;
  setShowJsonModal: (show: boolean) => void;
  showCsvModal: boolean;
  setShowCsvModal: (show: boolean) => void;
  jsonFileState: FileState;
  csvFileState: FileState;
}

const SetupContent: React.FC<SetupContentProps> = ({
  onJsonUpload,
  onCsvUpload,
  showJsonModal,
  setShowJsonModal,
  showCsvModal,
  setShowCsvModal,
  jsonFileState,
  csvFileState,
}) => {
  const [error, setError] = useState<string | null>(null);

  const { handleFileUpload: handleJsonFile } = useFileUpload(
    (content) => {
      try {
        onJsonUpload(content);
        setError(null);
      } catch (err) {
        setError('Error processing JSON file');
      }
    },
    'json'
  );

  const { handleFileUpload: handleCsvFile } = useFileUpload(
    (content) => {
      try {
        onCsvUpload(content);
        setError(null);
      } catch (err) {
        setError('Error processing CSV file');
      }
    },
    'csv'
  );

  const handleJsonUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      await handleJsonFile(event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading JSON file');
    }
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      await handleCsvFile(event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading CSV file');
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Template Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                JSON Template
              </h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleJsonUpload}
                  className="hidden"
                  id="json-upload"
                />
                <label
                  htmlFor="json-upload"
                  className="cursor-pointer text-center block"
                >
                  {jsonFileState.isLoading ? (
                    <LoadingSpinner />
                  ) : jsonFileState.fileName ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <span className="text-gray-600">
                        {jsonFileState.fileName}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-blue-600 hover:text-blue-500">
                        Upload JSON Template
                      </span>
                    </>
                  )}
                </label>
              </div>
              {jsonFileState.content && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => setShowJsonModal(true)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                    View JSON
                  </button>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Sample CSV
              </h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer text-center block"
                >
                  {csvFileState.isLoading ? (
                    <LoadingSpinner />
                  ) : csvFileState.fileName ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <span className="text-gray-600">
                        {csvFileState.fileName}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-blue-600 hover:text-blue-500">
                        Upload Sample CSV
                      </span>
                    </>
                  )}
                </label>
              </div>
              {csvFileState.content && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => setShowCsvModal(true)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                    View CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupContent;