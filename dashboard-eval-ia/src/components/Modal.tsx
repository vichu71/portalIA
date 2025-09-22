import React from 'react';

interface ModalProps {
  message: string;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ message, onClose }) => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%',
      height: '100%', backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', padding: '2rem',
        borderRadius: '8px', width: '400px', textAlign: 'center'
      }}>
        <p>{message}</p>
        <button onClick={onClose} style={{ marginTop: '1rem' }}>Cerrar</button>
      </div>
    </div>
  );
};

export default Modal;
