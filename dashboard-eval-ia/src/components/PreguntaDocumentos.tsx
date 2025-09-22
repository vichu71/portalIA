import React, { useState } from 'react';
import { preguntarDocumentos, preguntarDocumentosSimple } from '../services/api';

interface Props {
  onStart?: () => void;
  onEnd?: () => void;
}

const PreguntaDocumentos: React.FC<Props> = ({ onStart, onEnd }) => {
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [cargando, setCargando] = useState(false);
  const [soloRespuesta, setSoloRespuesta] = useState(true);

  const handleSend = async () => {
    if (!pregunta.trim()) return;

    setCargando(true);
    setRespuesta('');
    onStart?.();

    try {
      const result = soloRespuesta
        ? await preguntarDocumentosSimple(pregunta)
        : await preguntarDocumentos(pregunta);

      setRespuesta(result.respuesta || 'Sin respuesta');
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Error al procesar la solicitud';
      setRespuesta('❌ ' + msg);
    } finally {
      setCargando(false);
      onEnd?.();
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <label>
          <input
            type="checkbox"
            checked={soloRespuesta}
            onChange={() => setSoloRespuesta(prev => !prev)}
            style={{ marginRight: '0.5rem' }}
          />
          Mostrar solo la respuesta (sin contexto)
        </label>
      </div>

      <textarea
        rows={4}
        placeholder="Haz una pregunta sobre los documentos..."
        value={pregunta}
        onChange={(e) => setPregunta(e.target.value)}
        style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginBottom: '0.5rem' }}
      />

      <button
        onClick={handleSend}
        disabled={cargando}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: '#007bff',
          color: 'white',
          cursor: cargando ? 'not-allowed' : 'pointer'
        }}
      >
        {cargando ? 'Consultando...' : 'Preguntar'}
      </button>

      {respuesta && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            whiteSpace: 'pre-wrap'
          }}
        >
          {respuesta}
        </div>
      )}
    </div>
  );
};

export default PreguntaDocumentos;
