import { useState, useEffect, useCallback } from 'react';
import type { Patient, Seat } from './types';
import { fetchWorklistPatients, fetchPatientStatuses, applyStatusUpdates, updatePatientStatus } from './services/api';
import { WaitingRoom } from './components/WaitingRoom';
import { PatientList } from './components/PatientList';
import { FloorPlanEditor } from './components/FloorPlanEditor';
import './App.css';

const DEFAULT_SEATS: Seat[] = [
  { id: 'A1', label: 'A1', row: 0, col: 0, patientId: null },
  { id: 'A2', label: 'A2', row: 0, col: 1, patientId: null },
  { id: 'A3', label: 'A3', row: 0, col: 2, patientId: null },
  { id: 'A4', label: 'A4', row: 0, col: 3, patientId: null },
  { id: 'B1', label: 'B1', row: 1, col: 0, patientId: null },
  { id: 'B2', label: 'B2', row: 1, col: 1, patientId: null },
  { id: 'B3', label: 'B3', row: 1, col: 2, patientId: null },
  { id: 'B4', label: 'B4', row: 1, col: 3, patientId: null },
  { id: 'C1', label: 'C1', row: 2, col: 0, patientId: null },
  { id: 'C2', label: 'C2', row: 2, col: 1, patientId: null },
  { id: 'C3', label: 'C3', row: 2, col: 2, patientId: null },
  { id: 'C4', label: 'C4', row: 2, col: 3, patientId: null },
];

const STATUS_POLL_INTERVAL = 30000;

function loadSavedState() {
  try {
    const saved = localStorage.getItem('waitingRoom');
    if (saved) {
      const data = JSON.parse(saved);
      return {
        seats: data.seats || DEFAULT_SEATS,
        floorPlanUrl: data.floorPlanUrl || null,
        useFloorPlan: data.useFloorPlan || false,
      };
    }
  } catch { /* ignore */ }
  return { seats: DEFAULT_SEATS, floorPlanUrl: null, useFloorPlan: false };
}

export default function App() {
  const savedState = loadSavedState();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [seats, setSeats] = useState<Seat[]>(savedState.seats);
  const [consultations, setConsultations] = useState<Patient[]>([]);
  const [floorPlanUrl, setFloorPlanUrl] = useState<string | null>(savedState.floorPlanUrl);
  const [useFloorPlan, setUseFloorPlan] = useState(savedState.useFloorPlan);
  const [showEditor, setShowEditor] = useState(false);
  const [, setTick] = useState(0);
  const [, setSeatCounter] = useState(seats.length + 1);

  // Save layout to localStorage
  useEffect(() => {
    const seatsToSave = seats.map(s => ({ ...s, patientId: null }));
    localStorage.setItem('waitingRoom', JSON.stringify({
      seats: seatsToSave,
      floorPlanUrl,
      useFloorPlan,
    }));
  }, [seats, floorPlanUrl, useFloorPlan]);

  useEffect(() => {
    fetchWorklistPatients().then(setPatients);
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const updates = await fetchPatientStatuses();
      if (updates.length > 0) {
        setPatients(prev => applyStatusUpdates(prev, updates));
      }
    }, STATUS_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDropPatient = useCallback((patientId: string, seatId: string) => {
    setSeats(prev => {
      const targetSeat = prev.find(s => s.id === seatId);
      if (targetSeat?.patientId && targetSeat.patientId !== patientId) return prev;

      const updated = prev.map(s =>
        s.patientId === patientId ? { ...s, patientId: null } : s
      );
      return updated.map(s =>
        s.id === seatId ? { ...s, patientId: patientId } : s
      );
    });

    setPatients(prev =>
      prev.map(p =>
        p.id === patientId ? { ...p, seatId: seatId, status: 'waiting' as const } : p
      )
    );
  }, []);

  const handleSendToConsultation = useCallback((patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    setSeats(prev =>
      prev.map(s => s.patientId === patientId ? { ...s, patientId: null } : s)
    );
    setPatients(prev => prev.filter(p => p.id !== patientId));
    setConsultations(prev => [...prev, { ...patient, status: 'in_consultation' }]);
    updatePatientStatus(patientId, 'in_consultation');
  }, [patients]);

  const handleRemovePatient = useCallback((seatId: string) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat?.patientId) return;
    const patientId = seat.patientId;

    setSeats(prev =>
      prev.map(s => s.id === seatId ? { ...s, patientId: null } : s)
    );
    setPatients(prev =>
      prev.map(p =>
        p.id === patientId ? { ...p, seatId: null, status: 'checked_in' as const } : p
      )
    );
  }, [seats]);

  const handleAddSeat = useCallback((x: number, y: number) => {
    setSeatCounter(prev => {
      const num = prev;
      const label = `L${num}`;
      setSeats(s => [...s, {
        id: label,
        label,
        row: y,  // In floor plan mode, row = y%, col = x%
        col: x,
        patientId: null,
      }]);
      return num + 1;
    });
  }, []);

  const handleRemoveSeat = useCallback((seatId: string) => {
    setSeats(prev => prev.filter(s => s.id !== seatId));
  }, []);

  const handleFloorPlanUpload = useCallback((url: string) => {
    setFloorPlanUrl(url);
    setUseFloorPlan(true);
    // Reset to empty seats when a new floor plan is uploaded
    setSeats([]);
    setSeatCounter(1);
  }, []);

  const occupiedCount = seats.filter(s => s.patientId !== null).length;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sala de Espera</h1>
        <div className="stats">
          <span className="stat">
            <strong>{occupiedCount}</strong> / {seats.length} lugares ocupados
          </span>
          <span className="stat">
            <strong>{patients.filter(p => p.seatId === null && p.status === 'checked_in').length}</strong> por alocar
          </span>
          <span className="stat">
            <strong>{consultations.length}</strong> em consulta
          </span>
        </div>
        <div className="header-actions">
          <div className="legend">
            <span className="legend-item"><span className="legend-dot" style={{ background: '#38a169' }}></span>&lt;15m</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#d69e2e' }}></span>15-29m</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#dd6b20' }}></span>30-44m</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#e53e3e' }}></span>45+m</span>
          </div>
          <button className="btn-config" onClick={() => setShowEditor(true)}>
            Configurar Planta
          </button>
        </div>
      </header>

      <div className="app-content">
        <aside className="sidebar">
          <PatientList patients={patients} />

          {consultations.length > 0 && (
            <div className="consultations">
              <h2>Em Consulta</h2>
              {consultations.map(p => (
                <div key={p.id} className="consultation-item">
                  <img src={p.photoUrl} alt={p.name} />
                  <div>
                    <span className="patient-name">{p.name}</span>
                    <span className="patient-doctor">{p.doctor}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        <main className="main-area">
          <WaitingRoom
            seats={seats}
            patients={patients}
            floorPlanUrl={floorPlanUrl}
            useFloorPlan={useFloorPlan}
            onDropPatient={handleDropPatient}
            onSendToConsultation={handleSendToConsultation}
            onRemovePatient={handleRemovePatient}
          />
        </main>
      </div>

      {showEditor && (
        <FloorPlanEditor
          floorPlanUrl={floorPlanUrl}
          seats={seats}
          onFloorPlanUpload={handleFloorPlanUpload}
          onAddSeat={handleAddSeat}
          onRemoveSeat={handleRemoveSeat}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
