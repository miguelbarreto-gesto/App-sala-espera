import type { Patient, SalesforceWorklistItem, SalesforceStatusUpdate, PatientStatus } from '../types';

const SF_BASE_URL = import.meta.env.VITE_SALESFORCE_API_URL || '/api/salesforce';
const SF_TOKEN = import.meta.env.VITE_SALESFORCE_TOKEN || '';

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  ...(SF_TOKEN ? { 'Authorization': `Bearer ${SF_TOKEN}` } : {}),
};

// API 1: Get patients from Salesforce worklist
export async function fetchWorklistPatients(): Promise<Patient[]> {
  try {
    const response = await fetch(`${SF_BASE_URL}/worklist`, { headers });
    if (!response.ok) throw new Error('Failed to fetch worklist');
    const data: SalesforceWorklistItem[] = await response.json();
    return data.map(mapSalesforceToPatient);
  } catch {
    console.warn('Salesforce worklist API not available, using mock data');
    return getMockPatients();
  }
}

// API 2: Get patient status updates from Salesforce
export async function fetchPatientStatuses(): Promise<SalesforceStatusUpdate[]> {
  try {
    const response = await fetch(`${SF_BASE_URL}/statuses`, { headers });
    if (!response.ok) throw new Error('Failed to fetch statuses');
    return response.json();
  } catch {
    console.warn('Salesforce status API not available');
    return [];
  }
}

// Apply status updates to patients
export function applyStatusUpdates(patients: Patient[], updates: SalesforceStatusUpdate[]): Patient[] {
  if (updates.length === 0) return patients;

  return patients.map(patient => {
    const update = updates.find(u => u.patientId === patient.id);
    if (!update) return patient;

    return {
      ...patient,
      status: update.status,
      checkedInAt: update.status === 'checked_in' && !patient.checkedInAt
        ? new Date(update.timestamp).getTime()
        : patient.checkedInAt,
    };
  });
}

// Notify Salesforce that patient status changed
export async function updatePatientStatus(patientId: string, status: PatientStatus): Promise<void> {
  try {
    await fetch(`${SF_BASE_URL}/patients/${patientId}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status }),
    });
  } catch {
    console.warn('Could not update patient status in Salesforce:', patientId);
  }
}

// Fetch patient photo from Salesforce
export async function fetchPatientPhoto(patientId: string): Promise<string> {
  try {
    const response = await fetch(`${SF_BASE_URL}/patients/${patientId}/photo`, { headers });
    if (!response.ok) throw new Error('Failed to fetch photo');
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return `https://ui-avatars.com/api/?name=${patientId}&background=random&size=120`;
  }
}

function mapSalesforceToPatient(item: SalesforceWorklistItem): Patient {
  return {
    id: item.Patient__r.Id,
    name: item.Patient__r.Name,
    photoUrl: item.Patient__r.Photo_URL__c || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.Patient__r.Name)}&background=random&size=120`,
    appointmentTime: item.Appointment_Time__c,
    doctor: item.Doctor__r.Name,
    seatId: null,
    status: item.Status__c || 'checked_in',
    checkedInAt: Date.now(),
  };
}

function getMockPatients(): Patient[] {
  const now = Date.now();
  return [
    {
      id: '1',
      name: 'Maria Silva',
      photoUrl: 'https://ui-avatars.com/api/?name=Maria+Silva&background=E8B4B8&color=fff&size=120',
      appointmentTime: '09:00',
      doctor: 'Dr. Santos',
      seatId: null,
      status: 'checked_in',
      checkedInAt: now - 45 * 60 * 1000, // 45 min ago
    },
    {
      id: '2',
      name: 'Joao Oliveira',
      photoUrl: 'https://ui-avatars.com/api/?name=Joao+Oliveira&background=A8D8EA&color=fff&size=120',
      appointmentTime: '09:15',
      doctor: 'Dra. Costa',
      seatId: null,
      status: 'checked_in',
      checkedInAt: now - 30 * 60 * 1000, // 30 min ago
    },
    {
      id: '3',
      name: 'Ana Pereira',
      photoUrl: 'https://ui-avatars.com/api/?name=Ana+Pereira&background=B5EAD7&color=fff&size=120',
      appointmentTime: '09:30',
      doctor: 'Dr. Santos',
      seatId: null,
      status: 'checked_in',
      checkedInAt: now - 20 * 60 * 1000, // 20 min ago
    },
    {
      id: '4',
      name: 'Carlos Ferreira',
      photoUrl: 'https://ui-avatars.com/api/?name=Carlos+Ferreira&background=FFD6A5&color=fff&size=120',
      appointmentTime: '09:45',
      doctor: 'Dra. Lima',
      seatId: null,
      status: 'checked_in',
      checkedInAt: now - 10 * 60 * 1000, // 10 min ago
    },
    {
      id: '5',
      name: 'Beatriz Rodrigues',
      photoUrl: 'https://ui-avatars.com/api/?name=Beatriz+Rodrigues&background=C9B1FF&color=fff&size=120',
      appointmentTime: '10:00',
      doctor: 'Dr. Santos',
      seatId: null,
      status: 'checked_in',
      checkedInAt: now - 5 * 60 * 1000, // 5 min ago
    },
    {
      id: '6',
      name: 'Pedro Almeida',
      photoUrl: 'https://ui-avatars.com/api/?name=Pedro+Almeida&background=FFDAC1&color=fff&size=120',
      appointmentTime: '10:15',
      doctor: 'Dra. Costa',
      seatId: null,
      status: 'checked_in',
      checkedInAt: now - 2 * 60 * 1000, // 2 min ago
    },
  ];
}
