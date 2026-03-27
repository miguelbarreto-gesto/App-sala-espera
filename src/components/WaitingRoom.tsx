import type { Seat as SeatType, Patient } from '../types';
import { Seat } from './Seat';

interface WaitingRoomProps {
  seats: SeatType[];
  patients: Patient[];
  onDropPatient: (patientId: string, seatId: string) => void;
  onSendToConsultation: (patientId: string) => void;
  onRemovePatient: (seatId: string) => void;
}

export function WaitingRoom({ seats, patients, onDropPatient, onSendToConsultation, onRemovePatient }: WaitingRoomProps) {
  const maxRow = Math.max(...seats.map(s => s.row));
  const maxCol = Math.max(...seats.map(s => s.col));

  const grid: (SeatType | null)[][] = [];
  for (let r = 0; r <= maxRow; r++) {
    grid[r] = [];
    for (let c = 0; c <= maxCol; c++) {
      grid[r][c] = seats.find(s => s.row === r && s.col === c) || null;
    }
  }

  function getPatientForSeat(seat: SeatType): Patient | undefined {
    if (!seat.patientId) return undefined;
    return patients.find(p => p.id === seat.patientId);
  }

  return (
    <div className="waiting-room">
      <h2>🏥 Sala de Espera</h2>
      <div className="room-layout">
        {grid.map((row, rowIdx) => (
          <div key={rowIdx} className="seat-row">
            {row.map((seat, colIdx) =>
              seat ? (
                <Seat
                  key={seat.id}
                  seat={seat}
                  patient={getPatientForSeat(seat)}
                  onDropPatient={onDropPatient}
                  onSendToConsultation={onSendToConsultation}
                  onRemovePatient={onRemovePatient}
                />
              ) : (
                <div key={`empty-${rowIdx}-${colIdx}`} className="seat-spacer" />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
