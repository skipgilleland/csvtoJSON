import React from 'react';
import { Settings2, LayoutDashboard, Clock, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import HistoryTab from "./HistoryTab";
import OperationsDashboard from "./OperationsDashboard";
import { FileViewModal } from "./FileViewModal";  // We'll create this next

interface HistoryEntry {
  id: string;
  filename: string;
  status: "created" | "processed" | "failed";
  createdAt: string;
  processedAt?: string;
  errorMessage?: string;
}

interface SavedMapping {
  id: string;
  name: string;
  mappingFields: any[];  // You can define a more specific type if needed
  jsonTemplate: any;
  createdAt: string;
}

interface FileState {
  isLoading: boolean;
  content: string;
  fileName: string | null;
}

interface MainLayoutProps {
  currentView: "dashboard" | "setup" | "history";
  setCurrentView: (view: "dashboard" | "setup" | "history") => void;
  user: any;  // You might want to type this properly based on your user type
  handleLogout: () => void;
  transformHistory: HistoryEntry[];
  savedMappings: SavedMapping[];
  loadMappingConfiguration: (id: string) => void;
  handleSFTPUpload: (content: string) => void;
  renderSetupContent: () => JSX.Element;
  showJsonModal: boolean;
  setShowJsonModal: (show: boolean) => void;
  showCsvModal: boolean;
  setShowCsvModal: (show: boolean) => void;
  jsonFileState: FileState;
  csvFileState: FileState;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  currentView,
  setCurrentView,
  user,
  handleLogout,
  transformHistory,
  savedMappings,
  loadMappingConfiguration,
  handleSFTPUpload,
  renderSetupContent,
  showJsonModal,
  setShowJsonModal,
  showCsvModal,
  setShowCsvModal,
  jsonFileState,
  csvFileState,
}) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600">
                  CSV Transformer
                </span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className={`${
                    currentView === "dashboard"
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Operations Dashboard
                </button>
                <button
                  onClick={() => setCurrentView("setup")}
                  className={`${
                    currentView === "setup"
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  Configuration Setup
                </button>
                <button
                  onClick={() => setCurrentView("history")}
                  className={`${
                    currentView === "history"
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  History
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName} ({user?.role})
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {currentView === "history" ? (
          <HistoryTab history={transformHistory} />
        ) : currentView === "dashboard" ? (
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
        ) : (
          renderSetupContent()
        )}
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