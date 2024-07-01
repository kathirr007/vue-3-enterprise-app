import $api from '@/plugins/api';
import type { MetaObj } from '@/types/common.type';
import type { LoggedInUserData } from '@/types/me.type';
import type { FullNameObj, User } from '@/types/teams.type';

export function useMe() {
  const baseUrl = 'me';

  const { fullName } = useVueFilters();
  const { isFalsy } = useUtilityFns();

  const getCurrentUser = async (isPortalUser?: boolean) => {
    const { data } = await $api.get<LoggedInUserData>(`${isPortalUser ? 'portal/' : ''}${baseUrl}`);
    const { planPermission, user } = data;
    if ((user as User).meta && ((user as User)?.meta as MetaObj[])?.length > 0) {
      (user as User)?.meta?.forEach((meta: MetaObj) => {
        (user as User)[meta.metaKey] = meta.metaValue;
      });
    }
    if ((user as User).orgRole) {
      (user as User).orgUserRoleId = (user as User)?.orgRole?.id;
    }
    if ((user as User).designation) {
      (user as User).designationId = (user as User)?.designation?.id;
    }
    if ((user as User).invitedBy) {
      (user as User).invitedBy = fullName((user as User).invitedBy as FullNameObj) as string;
    }
    if ((user as User).manager) {
      (user as User).reportTo = (user as User)?.manager?.id;
      (user as User).managerId = (user as User)?.manager?.id;
    }
    (user as User).salary = !isFalsy((user as User).salary) ? Number((user as User).salary) : 0;

    return { planPermission, user };
  };
  // const isTimerActive = computed(() => timerList().)

  return {
    getCurrentUser
  };
}
