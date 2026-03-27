import { useRef, useState } from 'react';
import type { Seat } from '../types';

interface FloorPlanEditorProps {
  floorPlanUrl: string | null;
  seats: Seat[];
  onFloorPlanUpload: (url: string) => void;
  onAddSeat: (x: number, y: number) => void;
  onRemoveSeat: (seatId: string) => void;
  onClose: () => void;
}

export function FloorPlanEditor({ floorPlanUrl, seats, onFloorPlanUpload, onAddSeat, onRemoveSeat, onClose }: FloorPlanEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const [isPlacingMode, setIsPlacingMode] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onFloorPlanUpload(url);
  }

  function handleImageClick(e: React.MouseEvent) {
    if (!isPlacingMode || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAddSeat(x, y);
  }

  return (
    <div className="floor-plan-editor-overlay">
      <div className="floor-plan-editor">
        <div className="editor-header">
          <h2>Configurar Planta da Sala</h2>
          <button className="btn-close-editor" onClick={onClose}>✕</button>
        </div>

        <div className="editor-toolbar">
          <button className="btn-upload" onClick={() => fileInputRef.current?.click()}>
            Carregar Planta
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {floorPlanUrl && (
            <button
              className={`btn-place ${isPlacingMode ? 'active' : ''}`}
              onClick={() => setIsPlacingMode(!isPlacingMode)}
            >
              {isPlacingMode ? 'Parar de Colocar' : 'Colocar Lugares'}
            </button>
          )}
        </div>

        {isPlacingMode && (
          <p className="editor-hint">Clique na planta para adicionar um lugar. Clique com botao direito num lugar para remover.</p>
        )}

        <div className="editor-canvas" ref={imageRef} onClick={handleImageClick}>
          {floorPlanUrl ? (
            <>
              <img src={floorPlanUrl} alt="Planta da clínica" className="floor-plan-image" draggable={false} />
              {seats.map(seat => (
                <div
                  key={seat.id}
                  className={`editor-seat-marker ${seat.patientId ? 'occupied' : ''}`}
                  style={{ left: `${seat.col}%`, top: `${seat.row}%` }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onRemoveSeat(seat.id);
                  }}
                >
                  {seat.label}
                </div>
              ))}
            </>
          ) : (
            <div className="upload-placeholder">
              <div className="upload-icon">🗺️</div>
              <p>Carregue a planta da sua clinica</p>
              <p className="upload-hint">Formatos: PNG, JPG, SVG</p>
            </div>
          )}
        </div>

        <div className="editor-footer">
          <span>{seats.length} lugares configurados</span>
          <button className="btn-save" onClick={onClose}>Guardar e Fechar</button>
        </div>
      </div>
    </div>
  );
}
