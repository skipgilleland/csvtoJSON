// src/components/features/SFTPConfigUI.tsx

import React, { useState } from 'react';
import { Save, TestTube } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface SFTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  remotePath: string;
}

interface SFTPConfigUIProps {
  onUpload: (jsonContent: string) => Promise<void>;
  initialConfig?: Partial<SFTPConfig>;
}

const SFTPConfigUI: React.FC<SFTPConfigUIProps> = ({ onUpload, initialConfig }) => {
  const [config, setConfig] = useState<SFTPConfig>({
    host: initialConfig?.host || '',
    port: initialConfig?.port || 22,
    username: initialConfig?.username || '',
    password: initialConfig?.password || '',
    remotePath: initialConfig?.remotePath || '',
  });
  const [status, setStatus] = useState<'idle' | 'testing' | 'uploading'>('idle');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) || '' : value
    }));
  };

  const handleSaveConfig = async () => {
    try {
      const response = await fetch('/api/sftp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Failed to save configuration');
      
      setSuccess('Configuration saved successfully');
      setError('');
    } catch (err) {
      setError('Failed to save SFTP configuration');
      setSuccess('');
    }
  };

  const handleTestConnection = async () => {
    setStatus('testing');
    try {
      const response = await fetch('/api/sftp/test', {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Connection test failed');
      
      setSuccess('Connection test successful');
      setError('');
    } catch (err) {
      setError('SFTP connection test failed');
      setSuccess('');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="text-lg font-medium mb-4">SFTP Configuration</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Host
          </label>
          <input
            type="text"
            name="host"
            value={config.host}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            placeholder="sftp.example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Port
          </label>
          <input
            type="number"
            name="port"
            value={config.port}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={config.username}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={config.password}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Remote Path
          </label>
          <input
            type="text"
            name="remotePath"
            value={config.remotePath}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            placeholder="/upload/json"
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSaveConfig}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <Save className="w-4 h-4" />
          Save Configuration
        </button>

        <button
          onClick={handleTestConnection}
          disabled={status === 'testing'}
          className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:bg-gray-300"
        >
          <TestTube className="w-4 h-4" />
          {status === 'testing' ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
    </div>
  );
};

export default SFTPConfigUI;