import React, { useEffect, useState } from 'react';
import { estadoIndice } from '../services/api';

interface Props {
  reloadKey?: number;
}

const IndiceStatus: React.FC<Props> = ({ reloadKey }) => {
  const [estado, setEstado] = useState<{ documentos: number; estado: string; ultima_modificacion?: string }>({
    documentos: 0,
    estado: "desconocido"
  });

  useEffect(() => {
    estadoIndice().then(setEstado).catch(err => {
      console.error("Error al obtener estado del índice:", err);
      setEstado({ documentos: 0, estado: "error" });
    });
  }, [reloadKey]); // 🔁 se actualiza cuando cambia reloadKey

  return (
    <div>
      <h3>Estado del índice</h3>
      <p>Estado: {estado.estado}</p>
      <p>Documentos: {estado.documentos}</p>
      {estado.ultima_modificacion && <p>Última modificación: {estado.ultima_modificacion}</p>}
    </div>
  );
};

export default IndiceStatus;
