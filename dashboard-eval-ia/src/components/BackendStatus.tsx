import React, { useEffect } from 'react';
import { pingBackend } from '../services/api';

interface Props {
  onStatusChange: (status: "ok" | "error" | "cargando") => void;
}

const BackendStatus: React.FC<Props> = ({ onStatusChange }) => {
  useEffect(() => {
    const checkStatus = async () => {
      const estado = await pingBackend();
      onStatusChange(estado);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [onStatusChange]);

  return null;
};

export default BackendStatus;
