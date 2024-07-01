import $api from '@/plugins/api';
import type { PaginatedResponse } from '@/types/common.type';
import type {
  BrightDirectory,
  BrightDirectoryUpdatePayload,
  DirectoryServices,
  DirectoryState,
  LeadDirectory,
} from '@/types/brightdirectory.type';
import type { ClientState } from '@/types/client.type';

export async function useCreateListing(payload: BrightDirectoryUpdatePayload) {
  const data = await $api.post<BrightDirectory>(
    `bright-directory/listings`,
    payload
  );
  return data;
}

export async function useUpdateListing(
  id: string,
  payload: Partial<BrightDirectoryUpdatePayload>
) {
  const { data } = await $api.put<BrightDirectory>(
    `bright-directory/listings/${id}`,
    payload
  );
  return data;
}

export async function useListingDirectory(id: string) {
  const { data } = await $api.get<BrightDirectory>(
    `bright-directory/listings/${id}`
  );
  if (data.services?.length) {
    data.services = data.services.map((val) => (val as DirectoryServices).id);
  }
  if (data.state) {
    data.stateId = (data.state as DirectoryState).id;
  }
  if (data.title) {
    data.subject = data.title;
  }
  if (data.foundedYear) {
    data.foundedYear = data.foundedYear.toString();
  }
  return data;
}
export async function useServiceListDirectory() {
  const { data } = await $api.get<DirectoryServices[]>(
    `bright-directory/services`
  );
  return data;
}

export async function useStateListDirectory() {
  const { data } = await $api.get<ClientState>(`bright-directory/states`);
  return data;
}

export async function useLeadDirectoryList({
  id,
  page,
  limit,
  archived,
}: {
  id: string;
  page?: number;
  limit?: number;
  archived?: boolean;
}) {
  const { data } = await $api.get<PaginatedResponse<LeadDirectory>>(
    `bright-directory/listings/${id}/leads`,
    {
      params: {
        page,
        limit,
        archived,
      },
    }
  );
  return data;
}
