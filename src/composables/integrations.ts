import $api from '@/plugins/api';
import type { ImportedClientResponse } from '@/types/client.type';
import type { XeroClient } from '@/types/integration.type';
import type {
  Integration,
  IntegrationIcon,
  IntegrationsData,
  PaypalPayload
} from '@/types/integrations.type';

export function useIntegrations() {
  const integrationIcons: IntegrationIcon = {
    'BRIGHTDESK': {
      type: 'iconify',
      value: 'fluent:person-support-16-filled'
    },
    'BROADCASTS': {
      type: 'iconify',
      value: 'fluent:arrow-growth-20-filled'
    },
    'CLIENT': {
      type: 'iconify',
      value: 'ph:handshake'
    },
    'CLIENT_BILLING': {
      type: 'iconify',
      value: 'la:file-invoice-dollar'
    },
    'DOCUMENTS': {
      type: 'iconify',
      value: 'heroicons:folder'
    },
    'HRMS': {
      type: 'iconify',
      value: 'fluent-mdl2:workforce-management'
    },
    'TEAM': {
      type: 'iconify',
      value: 'ant-design:team-outlined'
    },
    'CALENDLY': {
      type: 'image',
      value: '/images/icons/calendly.png'
    },
    'CLIENT_PORTAL': {
      type: 'image',
      value: '/images/logos/client-portal.png'
    },
    'DATA_EXTRACTION': {
      type: 'iconify',
      value: 'ph:gear'
    },
    'ESIGN': {
      type: 'iconify',
      value: 'tabler:signature'
    },
    'PAYPAL': {
      type: 'image',
      value: '/images/icons/paypal.svg'
    },
    'STRIPE': {
      type: 'image',
      value: '/images/icons/stripe.svg'
    },
    'QUICKBOOKS': {
      type: 'image',
      value: '/images/icons/quickbooks.jpg'
    },
    'SMART_FOLDER': {
      type: 'image',
      value: '/images/icons/smart-folder.svg'
    },
    'WORK': {
      type: 'iconify',
      value: 'ps:work-case'
    },
    'XERO': {
      type: 'image',
      value: '/images/icons/xero.png'
    },
    'LAWYER': {
      type: 'icon',
      value: '👨‍⚖️',
      iconClass: 'text-6xl'
    },
    'ACCOUNTING': {
      type: 'icon',
      value: '💰',
      iconClass: 'text-6xl'
    },
    'BUSINESS': {
      type: 'icon',
      value: '💼',
      iconClass: 'text-6xl'
    },
    'REAL_ESTATE_AGENCIES': {
      type: 'icon',
      value: '🏠',
      iconClass: 'text-6xl'
    },
    'EDUCATIONAL_CENTERS': {
      type: 'icon',
      value: '🎓',
      iconClass: 'text-6xl'
    },
    'WELLNESS_&_FITNESS_CENTER': {
      type: 'icon',
      value: '💪',
      iconClass: 'text-6xl'
    },
    'EVENT_MANAGEMENT_COMPANIES': {
      type: 'icon',
      value: '🎪',
      iconClass: 'text-6xl'
    },
    'PROPERTY_MANAGEMENT': {
      type: 'icon',
      value: '🏘️',
      iconClass: 'text-6xl'
    },
    'INSURANCE_AGENCY': {
      type: 'icon',
      value: '👪',
      iconClass: 'text-6xl'
    },
    'HOME_SERVICES': {
      type: 'icon',
      value: '🏠',
      iconClass: 'text-6xl'
    },
    'FULL_SERVICE_ACCOUNTING_FIRMS': {
      type: 'icon',
      value: '💹',
      iconClass: 'text-6xl'
    },
    'TAX_ACCOUNTING_FIRMS': {
      type: 'icon',
      value: '💰',
      iconClass: 'text-6xl'
    },
    'BOOKKEEPING_FIRMS': {
      type: 'icon',
      value: '🛍️',
      iconClass: 'text-6xl'
    },
    'AUDIT_AND_ASSURANCE_FIRMS': {
      type: 'icon',
      value: '💹',
      iconClass: 'text-6xl'
    },
    'FORENSIC_ACCOUNTING_FIRMS': {
      type: 'icon',
      value: '🏦',
      iconClass: 'text-6xl'
    },
    'CONSULTING_FIRMS': {
      type: 'icon',
      value: '🤝',
      iconClass: 'text-6xl'
    },
    'VIRTUAL_ONLINE_ACCOUNTING_FIRMS': {
      type: 'icon',
      value: '👩‍💻',
      iconClass: 'text-6xl'
    },
    'SMALL_BUSINESS_ACCOUNTING_FIRMS': {
      type: 'icon',
      value: '💼',
      iconClass: 'text-6xl'
    },
    'CORPORATE_LAW_FIRMS': {
      type: 'icon',
      value: '⚖️',
      iconClass: 'text-6xl'
    },
    'LITIGATION_LAW_FIRMS': {
      type: 'icon',
      value: '⚖️',
      iconClass: 'text-6xl'
    },
    'INTELLECTUAL_PROPERTY_LAW_FIRMS': {
      type: 'icon',
      value: '⚖️',
      iconClass: 'text-6xl'
    },
    'FAMILY_LAW_FIRMS': {
      type: 'icon',
      value: '⚖️',
      iconClass: 'text-6xl'
    },
    'CRIMINAL_DEFENSE_LAW_FIRMS': {
      type: 'icon',
      value: '⚖️',
      iconClass: 'text-6xl'
    },
    'IMMIGRATION_LAW_FIRMS': {
      type: 'icon',
      value: '⚖️',
      iconClass: 'text-6xl'
    },
    'OTHER_ACCOUNTING': {
      type: 'icon',
      value: '🌐',
      iconClass: 'text-6xl'
    },
    'OTHER_BUSINESS': {
      type: 'icon',
      value: '🌐',
      iconClass: 'text-6xl'
    },
    'OTHER_LAWYER': {
      type: 'icon',
      value: '🌐',
      iconClass: 'text-6xl'
    },
    'OTHER': {
      type: 'icon',
      value: '🌐',
      iconClass: 'text-6xl'
    },
    'REQUEST_AND_CONTRACT': {
      type: 'iconify',
      value: 'fa6-brands:wpforms',
      iconClass: 'text-6xl'
    },
    'KNOWLEDGE_BOT': {
      type: 'iconify',
      value: 'oi:book',
      iconClass: 'text-6xl'
    }

  };

  const recommendedIntegrations = ['WORK', 'DOCUMENTS', 'DATA_EXTRACTION'];

  const getOrgIntegration = async (integrationId: Integration['id']) => {
    const { data } = await $api.get<{
      id: string;
      credentials: any;
      isCompleted?: boolean;
    }>(`integrations/org-integration/${integrationId}`);
    return data;
  };

  const getIntegrations = async () => {
    const { data } = await $api.get<IntegrationsData>(`integrations`);
    const integrationsRecommended = data.allIntegrations.filter(
      (integration: Integration) => {
        return recommendedIntegrations.includes(integration.id);
      }
    );
    const internalIntegrations = data.allIntegrations.filter(
      (integration: Integration) => {
        return (
          !integration.isExternal
          && !recommendedIntegrations.includes(integration.id)
        );
      }
    );
    const externalIntegrations = data.allIntegrations.filter(
      (integration: Integration) => {
        return integration.isExternal;
      }
    );
    const updatedExternalIntegrations = await Promise.all(
      externalIntegrations.map(async (integration: Integration) => {
        const integrationRes = await getOrgIntegration(integration.id);
        const updatedIntegration = {
          ...integration,
          isCompleted: integrationRes && integrationRes.isCompleted
        };
        return updatedIntegration;
      })
    );
    return {
      ...data,
      allIntegrations: [
        ...integrationsRecommended,
        ...internalIntegrations,
        ...updatedExternalIntegrations
      ]
    };
  };

  const getQuickbooksUrl = async () => {
    const { data } = await $api.get<{ link: string }>(
      'integrations/quickbooks/auth/url'
    );
    return data;
  };
  const getQuickbooksClients = async () => {
    const { data } = await $api.get<ImportedClientResponse>(
      'integrations/quickbooks/clients'
    );
    return data;
  };
  const storeCalendlyUrl = async (payload: { url: string }) => {
    const { data } = await $api.post('integrations/calendly/url', payload);
    return data;
  };
  const getCalendlyUrl = async (userId?: string, isPortalUser?: boolean) => {
    const { data } = await $api.get<{ url: string }>(
      `${
        isPortalUser ? `portal/integrations/${userId}/` : 'integrations/'
      }calendly/url`
    );
    return data;
  };
  const storePaypalCreds = async (payload: PaypalPayload) => {
    const { data } = await $api.post('integrations/paypal', payload);
    return data;
  };

  const storeStripeKey = async (payload: { apiKey: string }) => {
    const { data } = await $api.post('integrations/stripe', payload);
    return data;
  };

  const getPaypalCreds = async () => {
    const { data } = await $api.get('integrations/paypal');
    return data;
  };

  const getXeroContacts = async () => {
    const { data } = await $api.get<XeroClient[]>('integrations/xero/contacts');
    return data;
  };

  const getQbContacts = async () => {
    const { data } = await $api.get<ImportedClientResponse>(
      'integrations/quickbooks/contacts'
    );
    return data;
  };

  const fetchXeroInvoices = async () => {
    const { data } = await $api.get('integrations/xero/invoices');
    return data;
  };

  /* const getPendingOrgIntegrations = async () => {
    const { data } = await $api.get(
      'org-integrations/pending-org-integrations'
    );
    return data;
  };

  const getOrgIntegrations = async () => {
    const { data } = await $api.get('org-integrations');
    return data;
  };

  const markStepCompleteForOrgIntegration = async ({
    id,
    stepId,
    payload,
  }: {
    id: string;
    stepId: string;
    payload: { status: number };
  }) => {
    const { data } = await $api.patch(
      `org-integrations/${id}/mark-step-complete/${stepId}`,
      payload
    );
    return data;
  }; */
  return {
    getIntegrations,
    getQuickbooksUrl,
    getQuickbooksClients,
    getCalendlyUrl,
    storeCalendlyUrl,
    getOrgIntegration,
    getXeroContacts,
    getQbContacts,
    fetchXeroInvoices,
    storePaypalCreds,
    storeStripeKey,
    getPaypalCreds,
    integrationIcons,
    recommendedIntegrations
  };
}
