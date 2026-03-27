export interface Assignor {
  id: string;
  document: string;
  email: string;
  phone: string;
  name: string;
}

export interface Payable {
  id: string;
  value: number;
  emissionDate: string;
  assignorId: string;
  assignor?: Assignor;
}

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface CreatePayablePayload {
  payable: {
    id: string;
    value: number;
    emissionDate: string;
    assignor: string;
  };
  assignor: Assignor;
}
