import $api from '@/plugins/api';
import type {
  ChangePasswordPayload,
  SignInPayload,
  SignInResponse
} from '@/types/auth.type';
import type { APIActions } from '@/types/common.type';
import type {
  CreateMfaDto,
  IntervalOption,
  MFAProvider,
  MFASecret,
  Meta,
  Org,
  OrgCreatePayload
} from '@/types/myaccount.type';
import type { AxiosError } from 'axios';
import { useMutation } from 'vue-query';

export async function useOrgDetails(isPortalUser?: boolean, orgId?: string) {
  const { data } = await $api.get<Org>(
    `${isPortalUser ? 'portal/' : ''}orgs${orgId ? `/${orgId}` : ''}`
  );

  if (data.meta) {
    data.meta.forEach((e: Meta) => {
      data[e.metaKey as keyof typeof data] = e.metaValue;
    });
  }
  return data;
}

export async function useOrgUpdate(updateOrgDto: Partial<OrgCreatePayload>) {
  const { data } = await $api.patch<Org>(`orgs`, updateOrgDto);
  return data;
}

export async function useOrgDelete() {
  const { data } = await $api.delete<Org>(`orgs`);
  return data;
}

export async function useChangePassword(
  payload: ChangePasswordPayload,
  isPortal?: boolean
) {
  const { data } = await $api.post(
    `${isPortal ? 'portal/' : ''}me/changepassword`,
    payload
  );
  return data;
}

export async function useLogoRemove(id: string | null) {
  const data = await $api.delete(`orgs/logo/${id}`);
  return data;
}
export function useAutoLogout(val: boolean) {
  const intervalOptions: IntervalOption[] = [
    {
      label: '30 Minutes',
      value: '30',
      securitySetting: val === true
    },
    {
      label: '1 Hour',
      value: '60',
      securitySetting: val === true || val === false
    },
    {
      label: '4 Hours',
      value: '240',
      securitySetting: val === true
    },

    {
      label: '3 Hours',
      value: '180',
      securitySetting: val === false
    },
    {
      label: '6 Hours',
      value: '360',
      securitySetting: val === false
    },
    {
      label: '8 Hours',
      value: '480',
      securitySetting: val === true
    },
    {
      label: '12 Hours',
      value: '720',
      securitySetting: val === true || val === false
    },
    {
      label: '24 Hours',
      value: '1440',
      securitySetting: val === true || val === false,
      default: true
    },
    {
      label: '3 Days',
      value: '4320',
      securitySetting: val === false
    },
    {
      label: '5 Days',
      value: '7200',
      securitySetting: val === false
    },
    {
      label: '7 Days',
      value: '10080',
      securitySetting: val === false
    }
  ];
  return { intervalOptions };
}

export async function postDeviceToken(payload: {
  token: string;
  isPushNotificationsEnabled?: boolean;
}) {
  const { data } = await $api.post('users/register-device-token', payload);
  return data;
}

export function useMFA() {
  const qrcodeUrl = ref();
  const emailOtpMessage = ref();
  const showOtpForm = ref(false);
  const mfaProvider = ref<MFAProvider>();
  const isMFAEnabled = ref(false);
  const enableMFADialog = ref<boolean>(false);
  const disableMFADialog = ref<boolean>(false);
  const activeAction = ref<APIActions>();
  const isOtpInvalid = ref(false);

  const { initToast } = useToasts();

  const showToast = (actionType: APIActions) => {
    initToast({
      actionType,
      summary: `${actionType} MFA`,
      detail: `Multi Factor Authentication ${actionType}d successfully`
    });
    activeAction.value = undefined;
  };

  const generateMFASecret = async (payload: CreateMfaDto) => {
    const { data } = await $api.post<MFASecret>(
      `auth/mfa/generate-secret`,
      payload
    );
    return data;
  };
  const activateMFA = async (payload: Partial<CreateMfaDto>) => {
    const data = await $api.post(`auth/mfa/activate`, payload);
    return data;
  };
  const deactivateMFA = async () => {
    const data = await $api.post(`auth/mfa/deactivate`);
    return data;
  };

  const mfaSignIn = async (payload: SignInPayload & { totp?: string }) => {
    const { data } = await $api.post<SignInResponse>(
      `auth/mfa-signin`,
      payload
    );
    return data;
  };

  const handleMfaSecret = (data: MFASecret & { mfaProvider: MFAProvider }) => {
    qrcodeUrl.value = data.dataUrl;
    emailOtpMessage.value = data.message;
    showOtpForm.value = true;
    mfaProvider.value = data.mfaProvider;
  };

  const { mutateAsync: handleActivateMFA, isLoading: submittingOtp }
    = useMutation(
      ({
        payload,
        actionType
      }: {
        payload: Partial<CreateMfaDto>;
        actionType: APIActions;
      }) => {
        activeAction.value = actionType;
        return actionType === 'Enable' ? activateMFA(payload) : deactivateMFA();
      },
      {
        onSuccess: (data: any) => {
          if (data) {
            qrcodeUrl.value = undefined;
            isMFAEnabled.value = activeAction.value === 'Enable';
            disableMFADialog.value = false;
            enableMFADialog.value = false;
            showToast(activeAction.value as APIActions);
            // emit('success');
          }
        },
        onError: (err: AxiosError) => {
          isOtpInvalid.value = true;
          console.log(err);
        }
      }
    );

  const submitTOTP = async (otp: string, email: string) => {
    const payload = {
      email,
      TOTP: otp,
      provider: mfaProvider.value
    };
    isOtpInvalid.value = false;
    await handleActivateMFA({
      payload,
      actionType: 'Enable'
    });
  };

  const handleBack = () => {
    showOtpForm.value = false;
    isOtpInvalid.value = false;
  };

  return {
    emailOtpMessage,
    qrcodeUrl,
    showOtpForm,
    mfaProvider,
    submittingOtp,
    isMFAEnabled,
    enableMFADialog,
    disableMFADialog,
    activeAction,
    isOtpInvalid,
    submitTOTP,
    handleBack,
    generateMFASecret,
    activateMFA,
    deactivateMFA,
    handleMfaSecret,
    handleActivateMFA,
    mfaSignIn
  };
}
