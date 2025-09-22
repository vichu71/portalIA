import React, { useState, useEffect } from "react";
import { 
  DocumentTextIcon, 
  MagnifyingGlassIcon,
  CalendarIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";
import { 
  getDailyNotes,
  getDailyNotesByMonth,
  getDailyNotesByYear,
  searchDailyNotesByContent,
  getDailyNoteStats,
  createOrUpdateDailyNote,
  deleteDailyNoteByDate,
  DailyNote,
  DailyNoteStats 
} from "../services/dailyNoteService";

interface BotonDashboardNotasProps {
  isActive: boolean;
  onClick: () => void;
  onToastMessage: (message: string) => void;
  onlyContent?: boolean;
}

const BotonDashboardNotas: React.FC<BotonDashboardNotasProps> = ({
  isActive,
  onClick,
  onToastMessage,
  onlyContent = false,
}) => {
  // Estados para datos
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [stats, setStats] = useState<DailyNoteStats | null>(null);
  const [filteredNotes, setFilteredNotes] = useState<DailyNote[]>([]);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all"); // all, this_month, this_year, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [sortBy, setSortBy] = useState<string>("date_desc"); // date_desc, date_asc, length_desc, length_asc
  
  // Estados de carga
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Estados de interfaz
  const [showFilters, setShowFilters] = useState(false);
  const [editingNoteDate, setEditingNoteDate] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNoteDate, setNewNoteDate] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  // Cargar datos iniciales
  useEffect(() => {
    if (isActive) {
      loadNotes();
      loadStats();
    }
  }, [isActive]);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    applyFilters();
  }, [notes, searchTerm, dateFilter, customStartDate, customEndDate, sortBy]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const allNotes = await getDailyNotes();
      setNotes(allNotes);
    } catch (error) {
      console.error("Error cargando notas:", error);
      onToastMessage("Error al cargar las notas");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const noteStats = await getDailyNoteStats();
      setStats(noteStats);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...notes];

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(note => 
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.date.includes(searchTerm)
      );
    }

    // Filtro por fecha
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (dateFilter) {
      case "this_month":
        filtered = filtered.filter(note => {
          const noteDate = new Date(note.date);
          return noteDate.getFullYear() === currentYear && noteDate.getMonth() === currentMonth;
        });
        break;
      case "this_year":
        filtered = filtered.filter(note => {
          const noteDate = new Date(note.date);
          return noteDate.getFullYear() === currentYear;
        });
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          filtered = filtered.filter(note => 
            note.date >= customStartDate && note.date <= customEndDate
          );
        }
        break;
    }

    // Ordenamiento
    switch (sortBy) {
      case "date_desc":
        filtered.sort((a, b) => b.date.localeCompare(a.date));
        break;
      case "date_asc":
        filtered.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case "length_desc":
        filtered.sort((a, b) => b.content.length - a.content.length);
        break;
      case "length_asc":
        filtered.sort((a, b) => a.content.length - b.content.length);
        break;
    }

    setFilteredNotes(filtered);
  };

  const handleEditNote = (note: DailyNote) => {
    setEditingNoteDate(note.date);
    setEditingContent(note.content);
  };

  const handleSaveEdit = async () => {
    if (!editingNoteDate) return;
    
    try {
      const result = await createOrUpdateDailyNote({
        date: editingNoteDate,
        content: editingContent.trim()
      });

      if (result) {
        setNotes(prevNotes => 
          prevNotes.map(note => 
            note.date === editingNoteDate ? result : note
          )
        );
        onToastMessage("Nota actualizada correctamente");
      }

      setEditingNoteDate(null);
      setEditingContent("");
    } catch (error) {
      console.error("Error actualizando nota:", error);
      onToastMessage("Error al actualizar la nota");
    }
  };

  const handleDeleteNote = async (date: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta nota?")) {
      return;
    }

    try {
      await deleteDailyNoteByDate(date);
      setNotes(prevNotes => prevNotes.filter(note => note.date !== date));
      await loadStats(); // Recargar estadísticas
      onToastMessage("Nota eliminada correctamente");
    } catch (error) {
      console.error("Error eliminando nota:", error);
      onToastMessage("Error al eliminar la nota");
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteDate.trim() || !newNoteContent.trim()) {
      onToastMessage("La fecha y el contenido son obligatorios");
      return;
    }

    try {
      const result = await createOrUpdateDailyNote({
        date: newNoteDate,
        content: newNoteContent.trim()
      });

      if (result) {
        setNotes(prevNotes => [...prevNotes, result]);
        await loadStats(); // Recargar estadísticas
        onToastMessage("Nota creada correctamente");
      }

      setShowCreateModal(false);
      setNewNoteDate("");
      setNewNoteContent("");
    } catch (error) {
      console.error("Error creando nota:", error);
      onToastMessage("Error al crear la nota");
    }
  };

  const exportNotes = () => {
    const dataStr = JSON.stringify(filteredNotes, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notas_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onToastMessage("Notas exportadas correctamente");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPreviewText = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  // Estadísticas calculadas en tiempo real
  const liveStats = {
    totalVisible: filteredNotes.length,
    avgLength: filteredNotes.length > 0 
      ? Math.round(filteredNotes.reduce((sum, note) => sum + note.content.length, 0) / filteredNotes.length)
      : 0,
    longestNote: filteredNotes.reduce((max, note) => 
      note.content.length > max.content.length ? note : max, 
      filteredNotes[0] || { content: "", date: "" }
    ),
    shortestNote: filteredNotes.reduce((min, note) => 
      note.content.length < min.content.length ? note : min,
      filteredNotes[0] || { content: "", date: "" }
    )
  };

  if (onlyContent) {
    return (
      <>
        <h3 className="text-4xl font-bold text-blue-700 text-center mb-6">
          📊 Dashboard de Notas
        </h3>

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Estadísticas principales */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
                <div className="text-sm text-blue-600">Total de notas</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-700">{stats.este_mes}</div>
                <div className="text-sm text-green-600">Este mes</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">{stats.esta_semana}</div>
                <div className="text-sm text-purple-600">Esta semana</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <div className="text-2xl font-bold text-orange-700">{stats.promedio_caracteres}</div>
                <div className="text-sm text-orange-600">Promedio caracteres</div>
              </div>
            </div>
          )}

          {/* Barra de herramientas */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Búsqueda */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en contenido o fecha..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                    showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FunnelIcon className="w-4 h-4" />
                  Filtros
                </button>
                <button
                  onClick={exportNotes}
                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Exportar
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Nueva
                </button>
              </div>
            </div>

            {/* Panel de filtros expandible */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Período
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todas las fechas</option>
                    <option value="this_month">Este mes</option>
                    <option value="this_year">Este año</option>
                    <option value="custom">Rango personalizado</option>
                  </select>
                </div>

                {dateFilter === "custom" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha inicio
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha fin
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordenar por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="date_desc">Fecha (más recientes)</option>
                    <option value="date_asc">Fecha (más antiguas)</option>
                    <option value="length_desc">Longitud (más largas)</option>
                    <option value="length_asc">Longitud (más cortas)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Estadísticas en tiempo real de resultados filtrados */}
          {filteredNotes.length > 0 && filteredNotes.length < notes.length && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 flex items-center gap-4">
                <span>Mostrando {filteredNotes.length} de {notes.length} notas</span>
                <span>•</span>
                <span>Promedio: {liveStats.avgLength} caracteres</span>
                {liveStats.longestNote?.date && (
                  <>
                    <span>•</span>
                    <span>Más larga: {liveStats.longestNote.content.length} caracteres ({liveStats.longestNote.date})</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Lista de notas */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Cargando notas...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {notes.length === 0 ? (
                  <>
                    <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p>No hay notas creadas aún</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Crear primera nota
                    </button>
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p>No se encontraron notas con los filtros aplicados</p>
                  </>
                )}
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.date}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        <CalendarIcon className="w-4 h-4 inline mr-2" />
                        {formatDate(note.date)}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{note.content.length} caracteres</span>
                        {note.updatedAt && (
                          <span>Actualizada: {new Date(note.updatedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditNote(note)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar nota"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.date)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar nota"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {editingNoteDate === note.date ? (
                    <div className="space-y-3">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => {
                            setEditingNoteDate(null);
                            setEditingContent("");
                          }}
                          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-gray-700 leading-relaxed cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                      onClick={() => handleEditNote(note)}
                      title="Click para editar"
                    >
                      {getPreviewText(note.content, 300)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal para crear nueva nota */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  📝 Nueva Nota
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={newNoteDate}
                    onChange={(e) => setNewNoteDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenido
                  </label>
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Escribe aquí el contenido de tu nota..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {newNoteContent.length} caracteres
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewNoteDate("");
                      setNewNoteContent("");
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateNote}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Crear Nota
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Botón de navegación cuando no está activo
  if (!isActive) {
    return (
      <div className="relative">
        <button
          onClick={onClick}
          className="w-24 h-24 flex flex-col items-center justify-center rounded-xl bg-blue-400 hover:bg-blue-500 shadow-lg text-white text-sm transition-all duration-200"
        >
          <ChartBarIcon className="w-7 h-7 mb-1" />
          <span className="font-medium">Dashboard</span>
        </button>
      </div>
    );
  }

  // Vista activa
  return (
    <>
      {/* Botón de navegación activo */}
      <div className="relative">
        <button
          onClick={onClick}
          className="w-24 h-24 flex flex-col items-center justify-center rounded-xl bg-blue-400 hover:bg-blue-500 shadow-lg text-white text-sm transition-all duration-200 relative z-10 ring-4 ring-offset-2 ring-blue-200 shadow-blue-200/70 shadow-xl"
          style={{ transform: "scale(1.2)" }}
        >
          <ChartBarIcon className="w-9 h-9 mb-1" />
          <span className="font-medium">Dashboard</span>
        </button>
      </div>

      {/* Contenido del dashboard */}
      <div className="mt-10 relative">
        <div className="min-h-96">
          {/* Aquí va el mismo contenido que en onlyContent */}
          <h3 className="text-4xl font-bold text-blue-700 text-center mb-6">
            📊 Dashboard de Notas
          </h3>
          {/* ... resto del contenido igual que en onlyContent ... */}
        </div>
      </div>
    </>
  );
};

export default BotonDashboardNotas;