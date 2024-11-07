// MappingManager.tsx
import React, { useState, useEffect } from 'react';
import { Save, Trash2, Edit2, CheckCircle } from 'lucide-react';

interface MappingConfig {
  id: string;
  name: string;
  mappings: any[];
  createdAt: string;
  lastModified: string;
}

interface MappingManagerProps {
  currentMappings: any[];
  onLoadMapping: (mappings: any[]) => void;
}

const MappingManager: React.FC<MappingManagerProps> = ({ currentMappings, onLoadMapping }) => {
  const [savedMappings, setSavedMappings] = useState<MappingConfig[]>([]);
  const [mappingName, setMappingName] = useState('');
  const [editMode, setEditMode] = useState<string | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<string | null>(null);

  // Load saved mappings from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('savedMappings');
    if (saved) {
      setSavedMappings(JSON.parse(saved));
    }
  }, []);

  const handleSaveMapping = () => {
    if (!mappingName.trim()) {
      alert('Please enter a name for this mapping configuration');
      return;
    }

    if (currentMappings.length === 0) {
      alert('No mappings to save');
      return;
    }

    const newMapping: MappingConfig = {
      id: Date.now().toString(),
      name: mappingName,
      mappings: currentMappings,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    const updatedMappings = [...savedMappings, newMapping];
    setSavedMappings(updatedMappings);
    localStorage.setItem('savedMappings', JSON.stringify(updatedMappings));
    setMappingName('');
  };

  const handleDeleteMapping = (id: string) => {
    const updatedMappings = savedMappings.filter(mapping => mapping.id !== id);
    setSavedMappings(updatedMappings);
    localStorage.setItem('savedMappings', JSON.stringify(updatedMappings));
    if (selectedMapping === id) {
      setSelectedMapping(null);
    }
  };

  const handleEditMapping = (id: string) => {
    setEditMode(id);
    const mappingToEdit = savedMappings.find(mapping => mapping.id === id);
    if (mappingToEdit) {
      setMappingName(mappingToEdit.name);
    }
  };

  const handleUpdateMapping = (id: string) => {
    const updatedMappings = savedMappings.map(mapping => {
      if (mapping.id === id) {
        return {
          ...mapping,
          name: mappingName,
          lastModified: new Date().toISOString()
        };
      }
      return mapping;
    });

    setSavedMappings(updatedMappings);
    localStorage.setItem('savedMappings', JSON.stringify(updatedMappings));
    setEditMode(null);
    setMappingName('');
  };

  const handleLoadMapping = (mappingId: string) => {
    const mappingToLoad = savedMappings.find(mapping => mapping.id === mappingId);
    if (mappingToLoad) {
      onLoadMapping(mappingToLoad.mappings);
      setSelectedMapping(mappingId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <input
          type="text"
          value={mappingName}
          onChange={(e) => setMappingName(e.target.value)}
          placeholder="Enter mapping name"
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={handleSaveMapping}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <Save className="w-4 h-4" />
          Save Current Mapping
        </button>
      </div>

      {savedMappings.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Saved Mappings</h3>
          <div className="space-y-2">
            {savedMappings.map((mapping) => (
              <div
                key={mapping.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                {editMode === mapping.id ? (
                  <input
                    type="text"
                    value={mappingName}
                    onChange={(e) => setMappingName(e.target.value)}
                    className="flex-1 p-1 border rounded mr-2"
                    autoFocus
                  />
                ) : (
                  <div className="flex-1">
                    <div className="font-medium">{mapping.name}</div>
                    <div className="text-xs text-gray-500">
                      Last modified: {new Date(mapping.lastModified).toLocaleString()}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {editMode === mapping.id ? (
                    <button
                    onClick={() => handleUpdateMapping(mapping.id)}
                    className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Save
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleLoadMapping(mapping.id)}
                      className={`px-3 py-1 rounded ${
                        selectedMapping === mapping.id
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {selectedMapping === mapping.id ? 'Active' : 'Load'}
                    </button>
                    <button
                      onClick={() => handleEditMapping(mapping.id)}
                      className="text-gray-500 hover:text-blue-600"
                      title="Edit mapping name"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMapping(mapping.id)}
                      className="text-gray-500 hover:text-red-600"
                      title="Delete mapping"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {savedMappings.length === 0 && (
      <div className="text-center text-gray-500 py-4">
        No saved mappings yet. Create a mapping and save it to reuse later.
      </div>
    )}
  </div>
);
};

export default MappingManager;