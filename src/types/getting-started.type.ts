export interface GettingStarted {
  id: string;
  resource: GettingStartedStepResource;
  resourceId: string;
  status: number;
  data: JSON;
  step: {
    id: string;
    title: string;
    subtitle: string;
    action: string;
    route: string;
    isRequired: boolean;
    sortOrder: number;
    hidden: boolean;
  };
}

export type GettingStartedStepResource =
  | 'PROJECT'
  | 'TEAM_MEMBER'
  | 'CLIENT_USER'
  | 'CLIENT'
  | 'SERVICE';
