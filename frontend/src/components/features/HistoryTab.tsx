import React from 'react';
import { Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

interface HistoryEntry {
  id: string;
  filename: string;
  status: 'created' | 'processed' | 'failed';
  createdAt: string;
  processedAt?: string;
  errorMessage?: string;
}

interface HistoryTabProps {
  history?: HistoryEntry[];
}

const HistoryTab: React.FC<HistoryTabProps> = ({ history = [] }) => {
  const getStatusIcon = (status: HistoryEntry['status']) => {
    switch (status) {
      case 'created':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'processed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return dateString;
    }
  };

  if (!Array.isArray(history)) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Processing History</h2>
        </div>
        <div className="py-8 text-center text-gray-500">
          No processing history available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Processing History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Filename</th>
              <th className="py-2 px-4 text-left">Created</th>
              <th className="py-2 px-4 text-left">Processed</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  No processing history available
                </td>
              </tr>
            ) : (
              history.map((entry) => (
                <tr key={entry.id} className="border-b">
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(entry.status)}
                      <span className="capitalize">{entry.status}</span>
                    </div>
                  </td>
                  <td className="py-2 px-4">{entry.filename}</td>
                  <td className="py-2 px-4">{formatDate(entry.createdAt)}</td>
                  <td className="py-2 px-4">
                    {entry.processedAt ? formatDate(entry.processedAt) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryTab;