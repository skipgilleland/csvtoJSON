import './App.css'
import FileUpload from './components/FileUpload'
import SFTPConfigUI from './components/SFTPConfigUI'

function App() {
  const handleSFTPUpload = async (jsonContent: string) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `transform_${timestamp}.json`;
      
      const response = await fetch('http://localhost:3000/api/sftp/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: jsonContent,
          filename
        })
      });

      if (!response.ok) throw new Error('Upload failed');
    } catch (error) {
      console.error('SFTP upload error:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-4">
              CSV to JSON Transformer
            </h1>
            <p className="text-gray-600">
              Upload your CSV file to transform it into JSON format
            </p>
          </div>
          
          <FileUpload />
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
          <SFTPConfigUI onUpload={handleSFTPUpload} />
        </div>
      </div>
    </div>
  )
}

export default App