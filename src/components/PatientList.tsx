import type { Patient } from '../types';
import { PatientCard } from './PatientCard';

interface PatientListProps {
  patients: Patient[];
}

export function PatientList({ patients }: PatientListProps) {
  const unassigned = patients.filter(p => p.seatId === null && p.status === 'checked_in');

  return (
    <div className="patient-list">
      <h2>📋 Pacientes ({unassigned.length})</h2>
      <p className="hint">Arraste o paciente para um lugar</p>
      <div className="patient-list-items">
        {unassigned.length === 0 ? (
          <div className="empty-list">Todos os pacientes estão alocados</div>
        ) : (
          unassigned.map(patient => (
            <PatientCard key={patient.id} patient={patient} />
          ))
        )}
      </div>
    </div>
  );
}
