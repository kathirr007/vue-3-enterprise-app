import $api from '@/plugins/api';
import type { EntityObj } from '@/types/common.type';

const { isPortalUser } = useCurrentUserData();

export async function useCountriesList() {
  const { data } = await $api.get<{ country: string }[]>(
    `${isPortalUser.value ? 'portal/' : ''}countries`
  );
  return data;
}
export async function useCountryStatesList({ country }: { country: string }) {
  const { data } = await $api.get<Pick<EntityObj, 'id' | 'name'>[]>(
    `${isPortalUser.value ? 'portal/' : ''}countries/${country}/states`
  );
  return data;
}
