export type PatientStatus = 'checked_in' | 'waiting' | 'called' | 'in_consultation' | 'finished';

export interface Patient {
  id: string;
  name: string;
  photoUrl: string;
  appointmentTime: string;
  doctor: string;
  seatId: string | null;
  status: PatientStatus;
  checkedInAt: number | null; // timestamp when they checked in
}

export interface Seat {
  id: string;
  label: string;
  row: number;
  col: number;
  patientId: string | null;
}

export interface WaitingRoomState {
  patients: Patient[];
  seats: Seat[];
}

// Salesforce API types
export interface SalesforceWorklistItem {
  Id: string;
  Name: string;
  Patient__r: {
    Id: string;
    Name: string;
    Photo_URL__c: string;
  };
  Appointment_Time__c: string;
  Doctor__r: {
    Name: string;
  };
  Status__c: PatientStatus;
}

export interface SalesforceStatusUpdate {
  patientId: string;
  status: PatientStatus;
  timestamp: string;
}
