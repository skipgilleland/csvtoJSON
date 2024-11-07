// src/components/features/ConfigurationSetup.tsx

import React, { useState } from 'react';
import { Tabs } from '@/components/ui/tabs';
import { Upload, Save, TestTube } from 'lucide-react';

interface ConfigurationSetupProps {
  onMappingCreated: (mapping: any) => void;
}

const ConfigurationSetup: React.FC<ConfigurationSetupProps> = ({
  onMappingCreated
}) => {
  const [activeTab, setActiveTab] = useState('json-template');
  const [sftpConfig, setSftpConfig] = useState({
    host: '',
    port: '22',
    username: '',
    password: '',
    remotePath: ''
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSftpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle SFTP configuration submission
    try {
      await fetch('/api/sftp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sftpConfig)
      });
      // Handle success
    } catch (error) {
      // Handle error
      console.error('SFTP config error:', error);
    }
  };

  const testSftpConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await fetch('/api/sftp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sftpConfig)
      });

      if (response.ok) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('SFTP test error:', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('json-template')}
            className={`${
              activeTab === 'json-template'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            JSON Template
          </button>
          <button
            onClick={() => setActiveTab('sftp-config')}
            className={`${
              activeTab === 'sftp-config'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            SFTP Configuration
          </button>
        </nav>
      </div>

      {/* JSON Template Tab */}
      {activeTab === 'json-template' && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">JSON Template Configuration</h3>
          
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              id="json-upload"
              className="hidden"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Handle JSON file upload
                }
              }}
            />
            <label
              htmlFor="json-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="h-12 w-12 text-gray-400 mb-3" />
              <span className="text-blue-600 hover:text-blue-500">Upload JSON template</span>
              <span className="mt-2 text-sm text-gray-500">
                Upload a sample JSON file to define the output structure
              </span>
            </label>
          </div>
        </div>
      )}

      {/* SFTP Configuration Tab */}
      {activeTab === 'sftp-config' && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">SFTP Configuration</h3>
          
          <form onSubmit={handleSftpSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Host
                </label>
                <input
                  type="text"
                  value={sftpConfig.host}
                  onChange={(e) => setSftpConfig({ ...sftpConfig, host: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Port
                </label>
                <input
                  type="text"
                  value={sftpConfig.port}
                  onChange={(e) => setSftpConfig({ ...sftpConfig, port: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  value={sftpConfig.username}
                  onChange={(e) => setSftpConfig({ ...sftpConfig, username: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={sftpConfig.password}
                  onChange={(e) => setSftpConfig({ ...sftpConfig, password: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Remote Path
                </label>
                <input
                  type="text"
                  value={sftpConfig.remotePath}
                  onChange={(e) => setSftpConfig({ ...sftpConfig, remotePath: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="/path/to/upload/directory"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={testSftpConnection}
                disabled={isTestingConnection}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </button>
            </div>

            {connectionStatus === 'success' && (
              <div className="mt-2 text-sm text-green-600">
                Connection test successful!
              </div>
            )}
            {connectionStatus === 'error' && (
              <div className="mt-2 text-sm text-red-600">
                Connection test failed. Please check your settings and try again.
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default ConfigurationSetup;