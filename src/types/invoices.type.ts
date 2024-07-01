import type { Client } from './client.type';

export interface Invoice {
  id: string;
  invoiceDate: string;
  invoiceNumber: string;
  invoiceId?: string;
  client: Client;
  clientId: string;
  dueDate: string;
  totalAmount: string;
  balanceAmount: string;
  status: string;
}
