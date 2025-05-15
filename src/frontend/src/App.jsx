import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const [stats, setStats] = useState({
    total_files: 0,
    duplicate_files: 0,
    space_wasted: 0,
    files: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    scanFiles();
  }, []);

  useEffect(() => {
    const filtered = stats.files.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFiles(filtered);
  }, [searchQuery, stats.files]);

  const scanFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:5000/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ directory: '/Users/akashreddy/Downloads/Data' }) // Updated path
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data); // Add this line to debug
      if (data.error) {
        throw new Error(data.error);
      }
      setStats(data);
      setFilteredFiles(data.files); // Add this line to ensure files are set
    } catch (error) {
      console.error('Error scanning files:', error);
      setError('Failed to scan files. Please make sure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (filePath) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: filePath })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }
      
      await scanFiles(); // Refresh the file list after deletion
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file. Please try again.');
    }
  };

  const handleDownload = (filePath) => {
    window.open(`http://127.0.0.1:5000/download?path=${encodeURIComponent(filePath)}`, '_blank');
  };

  return (
    <div className="App">
      <header>
        <div>
          <h1>DDAS</h1>
          <p className="subtitle">Data Download Duplication Alert System</p>
        </div>
      </header>

      <div className="stats-container">
        <div className="stat-box">
          <h2>Total Files</h2>
          <p className="blue">{stats.total_files}</p>
        </div>
        <div className="stat-box">
          <h2>Duplicate Files</h2>
          <p className="orange">{stats.duplicate_files}</p>
        </div>
        <div className="stat-box">
          <h2>Space Wasted</h2>
          <p className="red">{formatSize(stats.space_wasted)}</p>
        </div>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isLoading}
        />
        <button 
          onClick={scanFiles} 
          disabled={isLoading}
          className={isLoading ? 'loading' : ''}
        >
          {isLoading ? 'Scanning...' : 'Scan for Duplicates'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="files-table">
        <table>
          <thead>
            <tr>
              <th>FILE NAME</th>
              <th>LOCATION</th>
              <th>SIZE</th>
              <th>DATE ADDED</th>
              <th>STATUS</th>
              <th>ORIGINAL FILE</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.map((file, index) => {
              // Find if this file is an original for any duplicates
              const isOriginalForDuplicates = filteredFiles.some(f => 
                f.status === 'DUPLICATE' && 
                f.size === file.size && 
                new Date(f.date_added) > new Date(file.date_added)
              );

              // Find original file for duplicates by comparing timestamps
              const originalFile = file.status === 'DUPLICATE' ? 
                filteredFiles.find(f => 
                  f.size === file.size && 
                  new Date(f.date_added) < new Date(file.date_added)
                ) : null;

              return (
                <tr key={index}>
                  <td>{file.name}</td>
                  <td>{file.location || 'Root Directory'}</td>
                  <td>{formatSize(file.size)}</td>
                  <td>{file.date_added}</td>
                  <td>
                    <span className={file.status.toLowerCase()}>
                      {file.status === 'UNIQUE' && isOriginalForDuplicates ? 'ORIGINAL' : file.status}
                    </span>
                  </td>
                  <td>
                    {file.status === 'DUPLICATE' && originalFile ? 
                      `${originalFile.name} (${originalFile.date_added})` : 
                      ''}
                  </td>
                  <td className="actions">
                    <button 
                      className="delete" 
                      onClick={() => handleDelete(file.location ? `${file.location}/${file.name}` : file.name)}
                      title="Delete file"
                    >
                      🗑️
                    </button>
                    <button 
                      className="download"
                      onClick={() => handleDownload(file.location ? `${file.location}/${file.name}` : file.name)}
                      title="Download file"
                    >
                      ⬇️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
