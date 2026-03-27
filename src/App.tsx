import { useState, useEffect, useCallback } from 'react';
import type { Patient, Seat } from './types';
import { fetchWorklistPatients, updatePatientStatus } from './services/api';
import { getWaitingLevel, getWaitingMinutes, getWaitingColor, getWaitingBgColor, getWaitingBorderColor } from './utils/waitingTime';
import './App.css';

const DEFAULT_SEATS: Seat[] = [
  { id: 'A1', label: '1', row: 0, col: 0, patientId: null },
  { id: 'A2', label: '2', row: 0, col: 1, patientId: null },
  { id: 'A3', label: '3', row: 0, col: 2, patientId: null },
  { id: 'B1', label: '4', row: 1, col: 0, patientId: null },
  { id: 'B2', label: '5', row: 1, col: 1, patientId: null },
  { id: 'B3', label: '6', row: 1, col: 2, patientId: null },
  { id: 'C1', label: '7', row: 2, col: 0, patientId: null },
  { id: 'C2', label: '8', row: 2, col: 1, patientId: null },
  { id: 'C3', label: '9', row: 2, col: 2, patientId: null },
];

type View = 'room' | 'patients';

export default function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [seats, setSeats] = useState<Seat[]>(DEFAULT_SEATS);
  const [consultations, setConsultations] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [view, setView] = useState<View>('room');
  const [, setTick] = useState(0);

  useEffect(() => {
    fetchWorklistPatients().then(setPatients);
  }, []);

  // Update waiting times every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const unassigned = patients.filter(p => p.seatId === null && p.status === 'checked_in');

  const handleSelectPatient = useCallback((patientId: string) => {
    setSelectedPatientId(prev => prev === patientId ? null : patientId);
    setView('room');
  }, []);

  const handleTapSeat = useCallback((seatId: string) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat) return;

    // If a patient is selected and seat is empty, place them
    if (selectedPatientId && !seat.patientId) {
      setSeats(prev => prev.map(s =>
        s.id === seatId ? { ...s, patientId: selectedPatientId } : s
      ));
      setPatients(prev => prev.map(p =>
        p.id === selectedPatientId ? { ...p, seatId, status: 'waiting' as const } : p
      ));
      setSelectedPatientId(null);
      return;
    }

    // If seat is occupied and no patient selected, select that patient
    if (seat.patientId && !selectedPatientId) {
      setSelectedPatientId(seat.patientId);
      return;
    }

    // If a patient is selected and we tap an occupied seat, swap
    if (selectedPatientId && seat.patientId) {
      // Deselect
      setSelectedPatientId(null);
    }
  }, [seats, selectedPatientId]);

  const handleRemoveFromSeat = useCallback((seatId: string) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat?.patientId) return;
    const pid = seat.patientId;

    setSeats(prev => prev.map(s => s.id === seatId ? { ...s, patientId: null } : s));
    setPatients(prev => prev.map(p =>
      p.id === pid ? { ...p, seatId: null, status: 'checked_in' as const } : p
    ));
    setSelectedPatientId(null);
  }, [seats]);

  const handleSendToConsultation = useCallback((patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    setSeats(prev => prev.map(s => s.patientId === patientId ? { ...s, patientId: null } : s));
    setPatients(prev => prev.filter(p => p.id !== patientId));
    setConsultations(prev => [...prev, { ...patient, status: 'in_consultation' }]);
    updatePatientStatus(patientId, 'in_consultation');
    setSelectedPatientId(null);
  }, [patients]);

  const getPatientForSeat = (seat: Seat) => patients.find(p => p.id === seat.patientId);
  const occupiedCount = seats.filter(s => s.patientId !== null).length;

  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-top">
          <h1>Sala de Espera</h1>
          <div className="header-stats">
            <span className="badge badge-blue">{occupiedCount}/{seats.length}</span>
            <span className="badge badge-orange">{unassigned.length} espera</span>
            {consultations.length > 0 && <span className="badge badge-green">{consultations.length} consulta</span>}
          </div>
        </div>
        {/* Legend */}
        <div className="legend">
          <span><i className="dot dot-green"></i>&lt;15m</span>
          <span><i className="dot dot-yellow"></i>15-29m</span>
          <span><i className="dot dot-orange"></i>30-44m</span>
          <span><i className="dot dot-red"></i>45+m</span>
        </div>
      </header>

      {/* Selection Banner */}
      {selectedPatient && (
        <div className="selection-banner">
          <img src={selectedPatient.photoUrl} alt="" className="selection-photo" />
          <span className="selection-name">{selectedPatient.name}</span>
          <span className="selection-hint">
            {selectedPatient.seatId ? 'Toque noutro lugar ou acao' : 'Toque num lugar livre'}
          </span>
          <button className="btn-cancel" onClick={() => setSelectedPatientId(null)}>Cancelar</button>
        </div>
      )}

      {/* Tab Navigation */}
      <nav className="tabs">
        <button className={`tab ${view === 'room' ? 'active' : ''}`} onClick={() => setView('room')}>
          Sala ({occupiedCount}/{seats.length})
        </button>
        <button className={`tab ${view === 'patients' ? 'active' : ''}`} onClick={() => setView('patients')}>
          Pacientes ({unassigned.length})
        </button>
      </nav>

      {/* Room View */}
      {view === 'room' && (
        <div className="room-view">
          <div className="seats-grid">
            {seats.map(seat => {
              const patient = getPatientForSeat(seat);
              const isSelected = selectedPatientId && !patient && selectedPatientId !== null;
              const isPatientSelected = patient && selectedPatientId === patient.id;
              const waitLevel = patient ? getWaitingLevel(patient.checkedInAt) : 'ok';
              const waitMins = patient ? getWaitingMinutes(patient.checkedInAt) : 0;

              return (
                <div
                  key={seat.id}
                  className={`seat ${patient ? 'occupied' : 'empty'} ${isSelected ? 'highlight' : ''} ${isPatientSelected ? 'selected' : ''}`}
                  style={patient ? {
                    borderColor: getWaitingBorderColor(waitLevel),
                    background: getWaitingBgColor(waitLevel),
                  } : {}}
                  onClick={() => handleTapSeat(seat.id)}
                >
                  {patient ? (
                    <div className="seat-content">
                      <img src={patient.photoUrl} alt={patient.name} className="seat-photo" />
                      <div className="seat-name">{patient.name.split(' ')[0]}</div>
                      <div className="seat-wait" style={{ color: getWaitingColor(waitLevel) }}>
                        {waitMins}m
                      </div>
                      {isPatientSelected && (
                        <div className="seat-actions">
                          <button className="btn-action btn-consult" onClick={(e) => { e.stopPropagation(); handleSendToConsultation(patient.id); }}>
                            Consulta
                          </button>
                          <button className="btn-action btn-remove" onClick={(e) => { e.stopPropagation(); handleRemoveFromSeat(seat.id); }}>
                            Remover
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="seat-empty-content">
                      <div className="seat-number">{seat.label}</div>
                      <div className="seat-free">Livre</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* In Consultation */}
          {consultations.length > 0 && (
            <div className="section">
              <h3 className="section-title">Em Consulta</h3>
              <div className="consult-list">
                {consultations.map(p => (
                  <div key={p.id} className="consult-item">
                    <img src={p.photoUrl} alt="" className="consult-photo" />
                    <div className="consult-info">
                      <span className="consult-name">{p.name}</span>
                      <span className="consult-doctor">{p.doctor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Patients View */}
      {view === 'patients' && (
        <div className="patients-view">
          {unassigned.length === 0 ? (
            <div className="empty-msg">Todos os pacientes estao alocados</div>
          ) : (
            <div className="patients-list">
              {unassigned.map(patient => {
                const isSelected = selectedPatientId === patient.id;
                const waitLevel = getWaitingLevel(patient.checkedInAt);
                const waitMins = getWaitingMinutes(patient.checkedInAt);

                return (
                  <div
                    key={patient.id}
                    className={`patient-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectPatient(patient.id)}
                  >
                    <img src={patient.photoUrl} alt="" className="patient-photo" />
                    <div className="patient-details">
                      <div className="patient-name">{patient.name}</div>
                      <div className="patient-meta">
                        {patient.appointmentTime} &middot; {patient.doctor}
                      </div>
                    </div>
                    <div className="patient-wait" style={{ color: getWaitingColor(waitLevel), borderColor: getWaitingBorderColor(waitLevel) }}>
                      {waitMins}m
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Seated patients */}
          {patients.filter(p => p.seatId !== null).length > 0 && (
            <div className="section">
              <h3 className="section-title">Ja sentados</h3>
              <div className="patients-list">
                {patients.filter(p => p.seatId !== null).map(patient => {
                  const seat = seats.find(s => s.patientId === patient.id);
                  return (
                    <div key={patient.id} className="patient-row seated" onClick={() => handleSelectPatient(patient.id)}>
                      <img src={patient.photoUrl} alt="" className="patient-photo" />
                      <div className="patient-details">
                        <div className="patient-name">{patient.name}</div>
                        <div className="patient-meta">{patient.doctor}</div>
                      </div>
                      <div className="patient-seat-badge">Lugar {seat?.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
