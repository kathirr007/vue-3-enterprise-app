import $api from '@/plugins/api';
import type { OrgCategoryId } from '@/types/app.type';
import type {
  OrgCategory
} from '@/types/integrations.type';
import type {
  Org,
  OrgCreatePayload
} from '@/types/myaccount.type';

export function useOrgOnboarding() {
  const baseUrl = 'orgs';
  const getRating = async () => {
    const { data } = await $api.get<{ feedbackRating: number; feedbackCount: number }>(`${baseUrl}/rating`);
    return data;
  };
  const getAllCategories = async () => {
    const { data } = await $api.get<OrgCategory[]>(`${baseUrl}/categories`);
    return data;
  };

  const getOneCategory = async (id: OrgCategoryId) => {
    const { data } = await $api.get<OrgCategory>(
      `${baseUrl}/category/${id}`
    );
    return data;
  };
  const attachSubCategory = async (payload: { subcategoryIds: string[] }) => {
    const { data } = await $api.post<OrgCategory>(
      `${baseUrl}/attach-subcategory`, payload
    );
    return data;
  };

  const updateOrg = async (
    { id, payload }: { id: string;
      payload: Partial<OrgCreatePayload>; }
  ) => {
    const { data } = await $api.patch<Org>(
      `${baseUrl}/set-up`,
      payload
    );
    return data;
  };

  return {
    getRating,
    getAllCategories,
    getOneCategory,
    attachSubCategory,
    updateOrg
  };
}
