// src/components/layout/MainLayout.tsx

import React from 'react';
import { Navigation } from './Navigation';
import { FileViewModal } from '../modals/FileViewModal';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import HistoryTab from '../features/HistoryTab';
import OperationsDashboard from '../features/OperationsDashboard';
import SetupContent from '../features/SetupContent';
import { FileState, SavedMapping, HistoryEntry, User } from '../../types';

interface MainLayoutProps {
  currentView: "dashboard" | "setup" | "history";
  setCurrentView: (view: "dashboard" | "setup" | "history") => void;
  user: User | null;
  handleLogout: () => void;
  transformHistory: HistoryEntry[];
  savedMappings: SavedMapping[];
  loadMappingConfiguration: (id: string) => void;
  handleSFTPUpload: (content: string) => Promise<void>;
  showJsonModal: boolean;
  setShowJsonModal: (show: boolean) => void;
  showCsvModal: boolean;
  setShowCsvModal: (show: boolean) => void;
  jsonFileState: FileState;
  csvFileState: FileState;
  onJsonUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onCsvUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentView,
  setCurrentView,
  user,
  handleLogout,
  transformHistory,
  savedMappings,
  loadMappingConfiguration,
  handleSFTPUpload,
  showJsonModal,
  setShowJsonModal,
  showCsvModal,
  setShowCsvModal,
  jsonFileState,
  csvFileState,
  onJsonUpload,
  onCsvUpload,
}) => {
  const renderContent = () => {
    switch (currentView) {
      case "history":
        return <HistoryTab history={transformHistory} />;
      
      case "dashboard":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Operations Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <OperationsDashboard
                savedMappings={savedMappings}
                onMappingSelect={loadMappingConfiguration}
                onProcessFile={handleSFTPUpload}
              />
            </CardContent>
          </Card>
        );
      
      case "setup":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Configuration Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <SetupContent
                onJsonUpload={onJsonUpload}
                onCsvUpload={onCsvUpload}
                showJsonModal={showJsonModal}
                setShowJsonModal={setShowJsonModal}
                showCsvModal={showCsvModal}
                setShowCsvModal={setShowCsvModal}
                jsonFileState={jsonFileState}
                csvFileState={csvFileState}
              />
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </main>

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
};

export default MainLayout;