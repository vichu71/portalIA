import React, { useState } from 'react';
import BackendStatus from './components/BackendStatus';
import Modal from './components/Modal';
import { askModel, crearIndice, limpiarDocumentos, preguntarDocumentos } from './services/api';
import VistaCompleta from './views/VistaCompleta';
import VistaFaiss from './views/VistaFaiss';
import VistaModelos from './views/VistaModelos';
import VistaProyectos from './views/VistaProyectos';




const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'modelos' | 'faiss' | 'todo' | 'proyectos'>('proyectos');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [metrics, setMetrics] = useState({ responseText: '', responseTime: 0, tokensUsed: 0, cost: 0 });
  const [archivosSubidos, setArchivosSubidos] = useState<string[]>([]);
  const [indiceReloadKey, setIndiceReloadKey] = useState(0);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'ok' | 'error' | 'cargando'>('cargando');

  const handlePromptSubmit = async (prompt: string) => {
    setIsProcessing(true);
    const startTime = performance.now();
    setMetrics({ responseText: 'Procesando...', responseTime: 0, tokensUsed: 0, cost: 0 });

    try {
      let response = '';
      if (selectedModel === 'faiss-docs') {
        const result = await preguntarDocumentos(prompt);
        response = result.respuesta || 'Sin respuesta';
      } else {
        response = await askModel(selectedModel, prompt);
      }

      const endTime = performance.now();
      const tokens = Math.floor((prompt.length + response.length) / 4);
      const cost = selectedModel === 'gpt-4' ? tokens * 0.00003 : 0;

      setMetrics({
        responseText: response,
        responseTime: Math.round(endTime - startTime),
        tokensUsed: tokens,
        cost: parseFloat(cost.toFixed(4)),
      });

    } catch (error: any) {
      let msg = 'Error desconocido';
      if (error?.response?.data) {
        try {
          const data = typeof error.response.data === 'string'
            ? JSON.parse(error.response.data)
            : error.response.data;
          msg = data.error || 'Error inesperado.';
        } catch {
          msg = error.response.data;
        }
      }

      if (msg.includes('could not open') || msg.includes('index.faiss') || msg.includes('índice cargado')) {
        setErrorModal('⚠️ No hay documentos cargados. Por favor, sube archivos y crea el índice antes de preguntar.');
      } else {
        setErrorModal('❌ Error al consultar el modelo: ' + msg);
      }

      setMetrics({ responseText: '', responseTime: 0, tokensUsed: 0, cost: 0 });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCrearIndice = async () => {
    try {
      const msg = await crearIndice();
      setSuccessModal(`✅ ${msg}`);
      setIndiceReloadKey(prev => prev + 1);
    } catch (e) {
      setErrorModal('Error al crear índice: ' + e);
    }
  };

  const handleLimpiar = async () => {
    try {
      const msg = await limpiarDocumentos();
      setSuccessModal(`🧹 ${msg}`);
      setArchivosSubidos([]);
      setIndiceReloadKey(prev => prev + 1);
    } catch (e) {
      setErrorModal('Error al limpiar documentos: ' + e);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <BackendStatus onStatusChange={setBackendStatus} />
  
      <div style={{ display: 'flex', borderBottom: '2px solid #ccc', marginBottom: '1rem' }}>
        <button onClick={() => setActiveTab('proyectos')} style={getTabStyle(activeTab === 'proyectos')}>📌 Proyectos</button>
        <button onClick={() => setActiveTab('modelos')} style={getTabStyle(activeTab === 'modelos')}>🧠 Modelos IA</button>
        <button onClick={() => setActiveTab('faiss')} style={getTabStyle(activeTab === 'faiss')}>📁 Documentos / FAISS</button>
        <button onClick={() => setActiveTab('todo')} style={getTabStyle(activeTab === 'todo')}>🧩 Vista completa</button>
      </div>

  
      {/* Estado del backend */}
      {backendStatus === 'cargando' && <p>Verificando conexión con backend...</p>}
      {backendStatus === 'error' && <p style={{ color: 'red' }}>❌ Sin conexión con el backend</p>}
  
      {backendStatus === 'ok' && (
        <>
          {activeTab === 'todo' && (
            <VistaCompleta
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              onSubmitPrompt={handlePromptSubmit}
              isProcessing={isProcessing}
              archivosSubidos={archivosSubidos}
              setArchivosSubidos={setArchivosSubidos}
              handleCrearIndice={handleCrearIndice}
              handleLimpiar={handleLimpiar}
              indiceReloadKey={indiceReloadKey}
              metrics={metrics}
            />
          )}
  
          {activeTab === 'faiss' && (
            <VistaFaiss
              archivosSubidos={archivosSubidos}
              setArchivosSubidos={setArchivosSubidos}
              handleCrearIndice={handleCrearIndice}
              handleLimpiar={handleLimpiar}
              indiceReloadKey={indiceReloadKey}
            />
          )}
  
          {activeTab === 'modelos' && (
          <VistaModelos
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            onSubmitPrompt={handlePromptSubmit}
            isProcessing={isProcessing}
            metrics={metrics}
          />
        )}
        {activeTab === 'proyectos' && (
          <VistaProyectos />
        )}


        </>
      )}
  
      {errorModal && <Modal message={errorModal} onClose={() => setErrorModal(null)} />}
      {successModal && <Modal message={successModal} onClose={() => setSuccessModal(null)} />}
    </div>
  );
  
};

const getTabStyle = (active: boolean) => ({
  padding: '0.75rem 1.5rem',
  border: 'none',
  borderBottom: active ? '3px solid #007bff' : '3px solid transparent',
  backgroundColor: 'transparent',
  fontWeight: active ? 'bold' : 'normal',
  color: active ? '#007bff' : '#555',
  cursor: 'pointer'
});

export default App;
