// src/components/features/MappingConfig.tsx

import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Settings2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { MappingField } from '../../types';

interface TemplateField {
  path: string;
  type: string;
  example: string;
  required?: boolean;
  description?: string;
}

interface MappingConfigProps {
  headers: string[];
  templateFields: TemplateField[];
  onMappingChange: (mappings: MappingField[]) => void;
  previewData?: Record<string, string>;
  currentMappings?: MappingField[];
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: TemplateField[];
  placeholder: string;
  sourceField?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  sourceField
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizeString = (str: string) => {
    return str.toLowerCase()
      .replace(/[\s_\[\]\.]/g, '')
      .replace(/^.*payees\d+/, 'payee');
  };

  useEffect(() => {
    if (sourceField && !value) {
      const normalizedSource = normalizeString(sourceField);
      const bestMatch = options.find(option => {
        const fieldName = option.path.split('.').pop() || '';
        return normalizeString(fieldName) === normalizedSource;
      });

      if (bestMatch) {
        onChange(bestMatch.path);
      }
    }
  }, [sourceField, options, onChange, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 300;

      setDropdownPosition(
        spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? 'top' : 'bottom'
      );
    }
  }, [isOpen]);

  const filteredOptions = options.filter(option =>
    option.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.path === value);

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="w-full p-2 border rounded bg-white flex items-center justify-between cursor-pointer hover:border-blue-400"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.path : placeholder}
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            width: containerRef.current?.offsetWidth,
            left: containerRef.current?.getBoundingClientRect().left,
            [dropdownPosition === 'top' ? 'bottom' : 'top']: 
              dropdownPosition === 'top' 
                ? window.innerHeight - (containerRef.current?.getBoundingClientRect().top || 0)
                : containerRef.current?.getBoundingClientRect().bottom,
            maxHeight: '300px',
            zIndex: 1000,
          }}
          className="bg-white border rounded-md shadow-lg overflow-hidden"
        >
          <div className="sticky top-0 bg-white border-b z-10 p-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-9 pr-4 py-2 border rounded focus:outline-none focus:border-blue-500"
                placeholder="Search fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="overflow-y-auto" style={{ maxHeight: '250px' }}>
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-gray-500 text-center">No matching fields</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.path}
                  className={`p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 ${
                    value === option.path ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    onChange(option.path);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <div className="font-medium flex items-center gap-2">
                    {option.path}
                    {option.required && (
                      <span className="text-red-500 text-sm">*Required</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Type: {option.type}
                  </div>
                  {option.example && (
                    <div className="text-sm text-gray-500 mt-1">
                      Example: {option.example}
                    </div>
                  )}
                  {option.description && (
                    <div className="text-sm text-gray-500 mt-1">
                      {option.description}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MappingConfig: React.FC<MappingConfigProps> = ({
  headers,
  templateFields,
  onMappingChange,
  previewData = {},
  currentMappings = []
}) => {
  const [mappings, setMappings] = useState<MappingField[]>(currentMappings);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (currentMappings.length > 0) {
      setMappings(currentMappings);
    }
  }, [currentMappings]);

  useEffect(() => {
    if (mappings.length === 0 && headers.length > 0) {
      const initialMappings = headers.map(header => ({
        sourceField: header,
        targetPath: '',
        isStatic: false,
        staticValue: ''
      }));
      setMappings(initialMappings);
      onMappingChange(initialMappings);
    }
  }, [headers, onMappingChange]);

  const updateMapping = (index: number, field: Partial<MappingField>) => {
    const newMappings = mappings.map((mapping, i) => {
      if (i === index) {
        return { ...mapping, ...field };
      }
      return mapping;
    });
    setMappings(newMappings);
    onMappingChange(newMappings);
  };

  const addMapping = () => {
    const newMapping: MappingField = {
      sourceField: '',
      targetPath: '',
      isStatic: false,
      staticValue: ''
    };
    const newMappings = [...mappings, newMapping];
    setMappings(newMappings);
    onMappingChange(newMappings);
  };

  const removeMapping = (index: number) => {
    const newMappings = mappings.filter((_, i) => i !== index);
    setMappings(newMappings);
    onMappingChange(newMappings);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Field Mapping Configuration</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <Settings2 className="w-4 h-4" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>
      </div>

      <div className="space-y-3">
        {mappings.map((mapping, index) => (
          <div key={index} className="grid grid-cols-12 gap-3 items-start bg-gray-50 p-4 rounded-lg">
            <div className="col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CSV Field
              </label>
              <select
                value={mapping.sourceField}
                onChange={(e) => updateMapping(index, { sourceField: e.target.value })}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">Select CSV field</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
              {mapping.sourceField && previewData && (
                <div className="mt-1 text-xs text-gray-500">
                  Preview: {previewData[mapping.sourceField]}
                </div>
              )}
            </div>

            <div className="col-span-1 flex justify-center items-center pt-6">
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>

            <div className="col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                JSON Field
              </label>
              <SearchableSelect
                value={mapping.targetPath}
                onChange={(value) => updateMapping(index, { targetPath: value })}
                options={templateFields}
                placeholder="Select JSON field"
                sourceField={mapping.sourceField}
              />
            </div>

            <div className="col-span-1 flex justify-center pt-6">
              <button
                onClick={() => removeMapping(index)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove mapping"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addMapping}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-600 px-4 py-2 rounded-lg border-2 border-dashed border-blue-200 hover:border-blue-300 w-full justify-center transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Field Mapping
        </button>
      </div>
    </div>
  );
};

export default MappingConfig;