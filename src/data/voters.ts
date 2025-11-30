export type Voter = {
  id: string;
  employeeCode: string;
  fullName: string;
  hasVoted: boolean;
  votedAt?: string;
};

// Datos simulados de votantes
export const voters: Voter[] = [
  {
    id: "v1",
    employeeCode: "EMP001",
    fullName: "Ana García",
    hasVoted: true,
    votedAt: "2025-01-15T10:30:00",
  },
  {
    id: "v2",
    employeeCode: "EMP002",
    fullName: "Carlos Rodríguez",
    hasVoted: true,
    votedAt: "2025-01-15T11:15:00",
  },
  {
    id: "v3",
    employeeCode: "EMP003",
    fullName: "María López",
    hasVoted: true,
    votedAt: "2025-01-15T14:20:00",
  },
  {
    id: "v4",
    employeeCode: "EMP004",
    fullName: "Juan Martínez",
    hasVoted: true,
    votedAt: "2025-01-16T09:45:00",
  },
  {
    id: "v5",
    employeeCode: "EMP005",
    fullName: "Laura Sánchez",
    hasVoted: true,
    votedAt: "2025-01-16T10:30:00",
  },
  {
    id: "v6",
    employeeCode: "EMP006",
    fullName: "Pedro Fernández",
    hasVoted: false,
  },
  {
    id: "v7",
    employeeCode: "EMP007",
    fullName: "Sofía González",
    hasVoted: false,
  },
  {
    id: "v8",
    employeeCode: "EMP008",
    fullName: "Miguel Torres",
    hasVoted: true,
    votedAt: "2025-01-16T15:10:00",
  },
  {
    id: "v9",
    employeeCode: "EMP009",
    fullName: "Carmen Ruiz",
    hasVoted: true,
    votedAt: "2025-01-16T16:00:00",
  },
  {
    id: "v10",
    employeeCode: "EMP010",
    fullName: "Roberto Díaz",
    hasVoted: false,
  },
  {
    id: "v11",
    employeeCode: "EMP011",
    fullName: "Elena Moreno",
    hasVoted: true,
    votedAt: "2025-01-17T08:30:00",
  },
  {
    id: "v12",
    employeeCode: "EMP012",
    fullName: "Diego Herrera",
    hasVoted: true,
    votedAt: "2025-01-17T09:15:00",
  },
];
