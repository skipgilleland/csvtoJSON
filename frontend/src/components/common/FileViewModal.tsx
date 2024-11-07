import React from 'react';

interface FileViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
}

export const FileViewModal: React.FC<FileViewModalProps> = ({
  isOpen,
  onClose,
  content,
  title
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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