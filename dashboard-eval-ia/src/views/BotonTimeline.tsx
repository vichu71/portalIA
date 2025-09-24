import React from "react";
import { TimelineProps } from "../components/timeline/types/timeline";
import TimelineButton from "../components/timeline/views/TimelineButton";
import TimelineView from "../components/timeline/views/TimelineView";

/**
 * Componente principal del Timeline refactorizado
 * 
 * Cambios principales:
 * - Separación de responsabilidades en múltiples componentes
 * - Lógica extraída a hooks personalizados
 * - Utilidades de cálculo separadas
 * - Nuevo sistema de colores basado en estado + fechas
 * - Código más mantenible y testeable
 */
const BotonTimeline: React.FC<TimelineProps> = ({
  isActive,
  onClick,
  onToastMessage,
  onlyContent = false,
}) => {
  // Si solo queremos el contenido, mostrar directamente la vista
  if (onlyContent) {
    return (
      <TimelineView
        isActive={true}
        onToastMessage={onToastMessage}
      />
    );
  }

  // Renderizar botón + vista cuando está activo
  return (
    <>
      <TimelineButton isActive={isActive} onClick={onClick} />
      
      {isActive && (
        <div className="mt-10 relative">
          <div className="min-h-96">
            <TimelineView
              isActive={isActive}
              onToastMessage={onToastMessage}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default BotonTimeline;