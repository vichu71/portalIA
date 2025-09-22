import React, { useState } from 'react';
import { subirArchivos } from '../services/api';

interface FileUploaderProps {
  onUploadSuccess: (fileNames: string[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setSelectedFiles(files);
    setFileNames(files ? Array.from(files).map(f => f.name) : []);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setIsUploading(true);
    try {
      const archivos = await subirArchivos(selectedFiles);
      onUploadSuccess(archivos);
      setSelectedFiles(null);
      setFileNames([]);
    } catch (error) {
      alert("Error al subir archivos: " + error);
    } finally {
      setIsUploading(false);
    }
  };

  const commonButtonStyle = {
    padding: '0.5rem 1rem',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '0.5rem'
  };

  return (
    <div style={{
      padding: '1rem',
      border: '1px dashed #ccc',
      borderRadius: '8px',
      background: '#f9f9f9',
      marginBottom: '1rem'
    }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
        Selecciona archivos para subir:
      </label>

      <label style={{
        ...commonButtonStyle,
        backgroundColor: '#007bff',
        display: 'inline-block'
      }}>
        📎 Elegir archivos
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </label>

      {fileNames.length > 0 && (
        <>
          <ul style={{
            fontSize: '0.9rem',
            marginTop: '0.5rem',
            paddingLeft: '1rem',
            listStyle: 'disc'
          }}>
            {fileNames.map((name, idx) => (
              <li key={idx}>{name}</li>
            ))}
          </ul>

          <button
            onClick={handleUpload}
            disabled={isUploading}
            style={{
              ...commonButtonStyle,
              backgroundColor: '#28a745'
            }}
          >
            {isUploading ? 'Subiendo...' : 'Subir archivos'}
          </button>
        </>
      )}
    </div>
  );
};

export default FileUploader;
