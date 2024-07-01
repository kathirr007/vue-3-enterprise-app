type EntityType = 'TASK' | 'CLIENTTASK' | 'LEAD' | 'CANDIDATE';

export interface EntityStatus {
  id: string;
  name: string;
  entityType: EntityType;
  description?: string;
  status?: number;
  sortOrder?: number;
}

export interface EntityPriority extends EntityStatus {
  bgColor: string;
  textColor: string;
}
