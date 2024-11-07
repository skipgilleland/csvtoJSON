import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Processing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            No processing history available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Processing History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4 text-left">Filename</th>
                <th className="py-2 px-4 text-left">Created</th>
                <th className="py-2 px-4 text-left">Processed</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
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
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        {entry.status === 'failed' && entry.errorMessage && (
                          <button
                            className="text-red-500 hover:text-red-700 flex items-center gap-1"
                            title={entry.errorMessage}
                          >
                            <AlertCircle className="w-4 h-4" />
                            View Error
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoryTab;