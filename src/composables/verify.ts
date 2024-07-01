import $api from '@/plugins/api';
import type { MetaObj } from '@/types/common.type';
import type {
  SingleOrg,
  VerifyPayload,
  VerifyUser,
  VerifyUserDetails
} from '@/types/verify.type';

const { metaFilter } = useUtilityFns();

export function useAuthVerify() {
  const resendVerificationLink = async (payload: { email: string }) => {
    const { data } = await $api.post<VerifyUser>(
      'auth/resendVerificationLink',
      payload
    );
    return data;
  };
  const verifySignUp = async (payload: VerifyPayload) => {
    const { data } = await $api.post<VerifyUser>('auth/verify', payload);
    return data;
  };
  const singleOrgDetails = async (id: string) => {
    const { data } = await $api.get<SingleOrg>(`auth/org-details/${id}`);
    const city = metaFilter(data.meta, 'city');
    const state = metaFilter(data.meta, 'state');
    const email = metaFilter(data.meta, 'email');
    return { ...data, city, state, email };
  };
  const verifyUserDetails = async (key: string) => {
    const { data } = await $api.get<VerifyUserDetails>(`auth/verify/${key}`);
    let orgCity, orgState, orgEmail, clientCity, clientState, clientEmail;

    if (data.type === 'ORG_USER' || data.type === 'OUTSOURCED_ORG_USER') {
      orgCity = metaFilter(data.org.meta, 'city');
      orgState = data.stateName;
      orgEmail = metaFilter(data.org.meta, 'email');
    }
    else {
      orgCity = metaFilter(
        (data.userClients[0].client.org as { meta: MetaObj[] })?.meta,
        'city'
      );
      orgEmail = metaFilter(
        (data.userClients[0].client.org as { meta: MetaObj[] })?.meta,
        'email'
      );
      clientCity = metaFilter(data.userClients[0].client?.meta, 'city');
      clientState = data.stateName;
      // clientState = metaFilter(data.userClients[0].client?.meta, 'state');
      clientEmail = metaFilter(data.userClients[0].client?.meta, 'email');
    }
    return {
      ...data,
      orgCity,
      orgState,
      orgEmail,
      clientCity,
      clientState,
      clientEmail
    };
  };

  return {
    verifySignUp,
    singleOrgDetails,
    verifyUserDetails,
    resendVerificationLink
  };
}
