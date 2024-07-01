export interface AuditLog {
  id: string;
  orgId: string;
  resourceId: string;
  resource: string;
  event: string;
  subEvent?: string[];
  actorType: string;
  actorId: string;
  clientId?: string;
  createdAt: string;
  description?: string;
}
