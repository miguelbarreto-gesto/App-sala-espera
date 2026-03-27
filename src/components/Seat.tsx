import { useState } from 'react';
import type { Seat as SeatType, Patient } from '../types';
import { PatientCard } from './PatientCard';
import { getWaitingLevel, getWaitingMinutes, getWaitingBgColor, getWaitingBorderColor, getWaitingColor } from '../utils/waitingTime';

interface SeatProps {
  seat: SeatType;
  patient: Patient | undefined;
  onDropPatient: (patientId: string, seatId: string) => void;
  onSendToConsultation: (patientId: string) => void;
  onRemovePatient: (seatId: string) => void;
}

export function Seat({ seat, patient, onDropPatient, onSendToConsultation, onRemovePatient }: SeatProps) {
  const [isOver, setIsOver] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
  }

  function handleDragLeave() {
    setIsOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsOver(false);
    const patientId = e.dataTransfer.getData('patientId');
    if (patientId) {
      onDropPatient(patientId, seat.id);
    }
  }

  const isOccupied = !!patient;
  const waitingLevel = patient ? getWaitingLevel(patient.checkedInAt) : 'ok';
  const waitingMinutes = patient ? getWaitingMinutes(patient.checkedInAt) : 0;

  const seatStyle = isOccupied ? {
    borderColor: getWaitingBorderColor(waitingLevel),
    backgroundColor: getWaitingBgColor(waitingLevel),
  } : {};

  return (
    <div
      className={`seat ${isOccupied ? 'occupied' : 'empty'} ${isOver ? 'drag-over' : ''}`}
      style={seatStyle}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="seat-label">{seat.label}</div>
      {patient ? (
        <div className="seat-patient">
          <PatientCard
            patient={patient}
            onSendToConsultation={onSendToConsultation}
            isInSeat
          />
          <div
            className="waiting-badge"
            style={{
              color: getWaitingColor(waitingLevel),
              borderColor: getWaitingBorderColor(waitingLevel),
            }}
          >
            {waitingMinutes} min
          </div>
          <button
            className="btn-remove"
            onClick={() => onRemovePatient(seat.id)}
            title="Remover do lugar"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="seat-empty">
          <div className="seat-icon">💺</div>
          <span>Livre</span>
        </div>
      )}
    </div>
  );
}
