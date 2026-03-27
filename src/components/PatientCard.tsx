import type { Patient } from '../types';

interface PatientCardProps {
  patient: Patient;
  onSendToConsultation?: (patientId: string) => void;
  isInSeat?: boolean;
}

export function PatientCard({ patient, onSendToConsultation, isInSeat }: PatientCardProps) {
  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('patientId', patient.id);
    e.dataTransfer.effectAllowed = 'move';
    const el = e.currentTarget as HTMLElement;
    el.classList.add('dragging');
  }

  function handleDragEnd(e: React.DragEvent) {
    const el = e.currentTarget as HTMLElement;
    el.classList.remove('dragging');
  }

  return (
    <div
      className={`patient-card ${isInSeat ? 'in-seat' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <img
        src={patient.photoUrl}
        alt={patient.name}
        className="patient-photo"
        draggable={false}
      />
      <div className="patient-info">
        <span className="patient-name">{patient.name}</span>
        <span className="patient-time">{patient.appointmentTime}</span>
        <span className="patient-doctor">{patient.doctor}</span>
      </div>
      {isInSeat && onSendToConsultation && (
        <button
          className="btn-consultation"
          onClick={() => onSendToConsultation(patient.id)}
          title="Enviar para consulta"
        >
          🏥
        </button>
      )}
    </div>
  );
}
