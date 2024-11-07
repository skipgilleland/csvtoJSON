import HistoryTab from './components/HistoryTab';
import { Settings2, LayoutDashboard, Upload, FileText, CheckCircle, AlertCircle, Eye, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


interface MappingField {
  jsonPath: string;
  csvField: string | null;
  isStatic: boolean;
  staticValue: string;
}

interface CSVData {
  headers: string[];
  preview: string[];
}

interface FileState {
  isLoading: boolean;
  content: string;
  fileName: string | null;
}

interface SavedMapping {
  id: string;
  name: string;
  mappingFields: MappingField[];
  jsonTemplate: any;
  createdAt: string;
}

interface HistoryEntry {
    id: string;
    filename: string;
    status: 'created' | 'processed' | 'failed';
    createdAt: string;
    processedAt?: string;
    errorMessage?: string;
  }

// Modal component for viewing file content
const FileViewModal = ({ 
  isOpen, 
  onClose, 
  content, 
  title 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  content: string; 
  title: string; 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
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

// Loading Spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);

function App() {
    const [currentView, setCurrentView] = useState<'dashboard' | 'setup' | 'history'>('dashboard');
  const [jsonTemplate, setJsonTemplate] = useState<any>(null);
  const [csvData, setCSVData] = useState<CSVData | null>(null);
  const [mappingFields, setMappingFields] = useState<MappingField[]>([]);
  const [transformHistory, setTransformHistory] = useState<HistoryEntry[]>([]);
  const [sftpConfig, setSftpConfig] = useState({
    host: '',
    port: '22',
    username: '',
    password: ''
  });

  // States for loading and modals
  const [jsonFileState, setJsonFileState] = useState<FileState>({
    isLoading: false,
    content: '',
    fileName: null
  });
  const [csvFileState, setCsvFileState] = useState<FileState>({
    isLoading: false,
    content: '',
    fileName: null
  });
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [savedMappings, setSavedMappings] = useState<SavedMapping[]>([]);
  const [mappingName, setMappingName] = useState('');
  const [jsonPreview, setJsonPreview] = useState('');

  useEffect(() => {
    const loadedMappings = localStorage.getItem('mappingConfigurations');
    const loadedHistory = localStorage.getItem('transformHistory');
    
    if (loadedMappings) {
      setSavedMappings(JSON.parse(loadedMappings));
    }
    if (loadedHistory) {
      setTransformHistory(JSON.parse(loadedHistory));
    }
  }, []);

  // Load saved mappings on component mount
  useEffect(() => {
    const loadedMappings = localStorage.getItem('mappingConfigurations');
    if (loadedMappings) {
      setSavedMappings(JSON.parse(loadedMappings));
    }
  }, []);

  // Update JSON preview when mappings change
  useEffect(() => {
    const preview = generatePreviewJson();
    setJsonPreview(preview);
  }, [mappingFields, csvData]);

  // Extract fields from JSON template
  const extractJsonFields = (obj: any, prefix = ''): string[] => {
    let fields: string[] = [];
    
    for (const key in obj) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (Array.isArray(obj[key])) {
          if (obj[key].length > 0 && typeof obj[key][0] === 'object') {
            fields = [...fields, ...extractJsonFields(obj[key][0], `${newPrefix}[0]`)];
          }
        } else {
          fields = [...fields, ...extractJsonFields(obj[key], newPrefix)];
        }
      } else {
        fields.push(newPrefix);
      }
    }
    
    return fields;
  };

  // Function to generate preview JSON
  const generatePreviewJson = () => {
    if (!jsonTemplate || !mappingFields.length) return '';

    const previewData = JSON.parse(JSON.stringify(jsonTemplate)); // Deep clone
    
    const setValue = (obj: any, path: string, value: any) => {
      const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
      let current = obj;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current)) {
          current[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
        }
        current = current[key];
      }
      
      const lastKey = keys[keys.length - 1];
      current[lastKey] = value;
    };

    mappingFields.forEach(field => {
      const value = field.isStatic 
        ? field.staticValue
        : (field.csvField && csvData?.preview[csvData.headers.indexOf(field.csvField)]) || '';
      setValue(previewData, field.jsonPath, value);
    });

    return JSON.stringify(previewData, null, 2);
  };

  // Handle mapping changes
  const handleMappingChange = (index: number, changes: Partial<MappingField>) => {
    setMappingFields(prevFields => 
      prevFields.map((field, i) => 
        i === index ? { ...field, ...changes } : field
      )
    );
  };
// Save mapping configuration
const saveMappingConfiguration = () => {
  if (!mappingName.trim()) {
    alert('Please enter a name for this mapping configuration');
    return;
  }

  const newMapping: SavedMapping = {
    id: Date.now().toString(),
    name: mappingName,
    mappingFields,
    jsonTemplate,
    createdAt: new Date().toISOString()
  };

  const updatedMappings = [...savedMappings, newMapping];
  setSavedMappings(updatedMappings);
  localStorage.setItem('mappingConfigurations', JSON.stringify(updatedMappings));
  setMappingName('');
};

// Load mapping configuration
const loadMappingConfiguration = (id: string) => {
  const mapping = savedMappings.find(m => m.id === id);
  if (mapping) {
    setMappingFields(mapping.mappingFields);
    setJsonTemplate(mapping.jsonTemplate);
    setJsonFileState(prev => ({
      ...prev,
      content: JSON.stringify(mapping.jsonTemplate, null, 2),
      fileName: 'Loaded template'
    }));
  }
};

// Handle JSON template upload
const handleJsonUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    try {
      setJsonFileState(prev => ({
        ...prev,
        isLoading: true,
        fileName: file.name
      }));
      
      const text = await file.text();
      const json = JSON.parse(text);
      
      setJsonTemplate(json);
      setJsonFileState(prev => ({
        ...prev,
        isLoading: false,
        content: JSON.stringify(json, null, 2)
      }));
      
      const fields = extractJsonFields(json);
      const initialMapping = fields.map(field => ({
        jsonPath: field,
        csvField: null,
        isStatic: false,
        staticValue: ''
      }));
      setMappingFields(initialMapping);
    } catch (error) {
      setJsonFileState(prev => ({
        ...prev,
        isLoading: false,
        content: ''
      }));
      console.error('Error parsing JSON:', error);
    }
  }
};

// Handle CSV upload
const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    try {
      setCsvFileState(prev => ({
        ...prev,
        isLoading: true,
        fileName: file.name
      }));
      
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const previewRows = lines.slice(1, 4).map(line => 
        line.split(',').map(cell => cell.trim())
      );
      
      setCSVData({
        headers,
        preview: previewRows[0] || []
      });
      
      setCsvFileState(prev => ({
        ...prev,
        isLoading: false,
        content: text
      }));
    } catch (error) {
      setCsvFileState(prev => ({
        ...prev,
        isLoading: false,
        content: ''
      }));
      console.error('Error parsing CSV:', error);
    }
  }
};

// Render dashboard content
const renderDashboardContent = () => (
  <div className="space-y-6">
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Template Selection</h2>
      <select 
        className="w-full p-2 border rounded-md shadow-sm"
        defaultValue=""
        onChange={(e) => e.target.value && loadMappingConfiguration(e.target.value)}
      >
        <option value="" disabled>Select a template...</option>
        {savedMappings.map(mapping => (
          <option key={mapping.id} value={mapping.id}>
            {mapping.name} - {new Date(mapping.createdAt).toLocaleDateString()}
          </option>
        ))}
      </select>
    </div>

    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Upload CSV</h2>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
        <div className="flex flex-col items-center">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".csv"
            onChange={handleCsvUpload}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer text-center"
          >
            <span className="text-blue-600 hover:text-blue-500">
              Click to upload
            </span>
            <span className="text-gray-500"> or drag and drop</span>
            <p className="text-xs text-gray-500 mt-1">CSV files only</p>
          </label>
        </div>
      </div>
    </div>
  </div>
);

// Render setup content
const renderSetupContent = () => (
  <div className="space-y-8">
    {/* Template Configuration */}
    <Card>
      <CardHeader>
        <CardTitle>Template Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-8">
          {/* JSON Template Upload */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">JSON Template</h3>
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
                    <span className="text-gray-600">{jsonFileState.fileName}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-blue-600 hover:text-blue-500">Upload JSON Template</span>
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

          {/* CSV Upload */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sample CSV</h3>
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
                    <span className="text-gray-600">{csvFileState.fileName}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-blue-600 hover:text-blue-500">Upload Sample CSV</span>
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

        {/* Field Mapping */}
        {jsonTemplate && csvData && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Field Mapping</h3>
            <div className="space-y-4">
              {mappingFields.map((field, index) => (
                <div key={field.jsonPath} className="flex items-center space-x-4">
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.jsonPath}
                    </label>
                  </div>
                  <div className="w-1/3 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={field.isStatic}
                      onChange={e => handleMappingChange(index, { isStatic: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {field.isStatic ? (
                      <input
                        type="text"
                        value={field.staticValue}
                        onChange={e => handleMappingChange(index, { staticValue: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter static value"
                      />
                    ) : (
                      <select
                        value={field.csvField || ''}
                        onChange={e => handleMappingChange(index, { csvField: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select CSV field</option>
                        {csvData.headers.map(header => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="w-1/3">
                    <span className="text-sm text-gray-500">
                      Preview: {field.isStatic 
                        ? field.staticValue 
                        : (field.csvField && csvData.preview[csvData.headers.indexOf(field.csvField)]) || 'No preview'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Save Mapping Configuration */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3">Save Mapping Configuration</h4>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={mappingName}
                  onChange={(e) => setMappingName(e.target.value)}
                  placeholder="Enter configuration name"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  onClick={saveMappingConfiguration}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save Mapping
                </button>
              </div>
            </div>

            {/* JSON Preview */}
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">JSON Preview</h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-sm font-mono">
                  {jsonPreview}
                </pre>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

{/* SFTP Configuration */}
<Card>
  <CardHeader>
    <CardTitle>SFTP Configuration</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Host</label>
        <input
          type="text"
          value={sftpConfig.host}
          onChange={e => setSftpConfig(prev => ({ ...prev, host: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Port</label>
        <input
          type="text"
          value={sftpConfig.port}
          onChange={e => setSftpConfig(prev => ({ ...prev, port: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Username</label>
        <input
          type="text"
          value={sftpConfig.username}
          onChange={e => setSftpConfig(prev => ({ ...prev, username: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={sftpConfig.password}
          onChange={e => setSftpConfig(prev => ({ ...prev, password: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex justify-end">
      <button
        onClick={() => {
          // Save SFTP configuration
          console.log('Saving SFTP config:', sftpConfig);
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Save SFTP Configuration
      </button>

    </div>
  </CardContent>
</Card>

{/* File View Modals */}
<FileViewModal
  isOpen={showJsonModal}
  onClose={() => setShowJsonModal(false)}
  content={jsonFileState.content}
  title="JSON Template"
/>
<FileViewModal
  isOpen={showCsvModal}
  onClose={() => setShowCsvModal(false)}
  content={csvFileState.content}
  title="CSV Content"
/>
     
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600">CSV Transformer</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`${
                    currentView === 'dashboard'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Operations Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('setup')}
                  className={`${
                    currentView === 'setup'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  Configuration Setup
                </button>
                <button
  onClick={() => setCurrentView('history')}
  className={`${
    currentView === 'history'
      ? 'border-blue-500 text-gray-900'
      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
>
  <Clock className="w-4 h-4 mr-2" />
  History
</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
  {currentView === 'history' ? (
    <HistoryTab history={transformHistory} />
  ) : currentView === 'dashboard' ? (
    <Card>
      <CardHeader>
        <CardTitle>Operations Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        {renderDashboardContent()}
      </CardContent>
    </Card>
  ) : (
    renderSetupContent()
  )}
</main>
    </div>
  );
}

export default App;
