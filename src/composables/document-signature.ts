import $api from '@/plugins/api';
import type { PaginatedResponse } from '@/types/common.type';
import type {
  CreateDocumentSignaturePayload,
  CreateDocumentSignatureReqPayload,
  NewSignature,
  SignatureRequest
} from '@/types/esignature.type';

export function useDocumentSignature() {
  const signatureStatuses = [
    { name: 'Signed', value: 'SIGNED' },
    { name: 'Partially Signed', value: 'PARTIALLY_SIGNED' },
    { name: 'Pending', value: 'PENDING' }
    // { name: 'Cancelled', value: 'CANCELLED' },
  ];

  const getAll = async ({
    page,
    limit,
    filters,
    sortBy,
    isPortal
  }: {
    page?: number;
    limit?: number;
    filters?: string;
    sortBy?: string;
    isPortal?: boolean;
  }) => {
    const { data } = await $api.get<PaginatedResponse<NewSignature>>(
      `${isPortal ? `portal/document-signature` : `document-signature`}`,
      {
        params: {
          page,
          limit,
          filters,
          sortBy
        }
      }
    );
    return data;
  };
  const getOne = async (id: string, isPortalUser?: boolean) => {
    if (!id)
      return;
    const { data } = await $api.get<SignatureRequest>(
      `${
        isPortalUser
          ? `portal/document-signature/${id}`
          : `document-signature/${id}`
      }`
    );
    return data;
  };
  const getOneByFile = async (id: string, isPortalUser?: boolean) => {
    const { data } = await $api.get<SignatureRequest>(
      `${
        isPortalUser
          ? `portal/document-signature/file/${id}`
          : `document-signature/file/${id}`
      }`
    );
    return data;
  };
  const createDocumentSignatureRequest = async (
    payload: CreateDocumentSignatureReqPayload
  ) => {
    const { data } = await $api.post<SignatureRequest>(
      'document-signature',
      payload
    );
    return data;
  };
  const updateDocumentSignatureRequest = async ({
    id,
    payload,
    isPortal
  }: {
    id: string;
    payload: Partial<CreateDocumentSignatureReqPayload>;
    isPortal?: boolean;
  }) => {
    const { data } = await $api.patch<SignatureRequest>(
      `${
        isPortal
          ? `portal/document-signature/${id}`
          : `document-signature/${id}`
      }`,
      payload
    );
    return data;
  };
  const cancelDocumentSignatureRequest = async (id: string) => {
    const { data } = await $api.delete<SignatureRequest>(
      `document-signature/${id}`
    );
    return data;
  };
  const remindDocumentSignature = async (id: string) => {
    const { data } = await $api.patch<SignatureRequest>(
      `document-signature/${id}/remind`
    );
    return data;
  };

  const addSignature = async ({
    id,
    payload,
    isPortalUser,
    signatureId
  }: {
    id: string;
    signatureId: string;
    payload: Partial<CreateDocumentSignaturePayload>;
    isPortalUser?: boolean;
  }) => {
    const { data } = await $api.patch<NewSignature>(
      `${
        isPortalUser
          ? `portal/document-signature/${id}/signature/${signatureId}`
          : `document-signature/${id}/signature/${signatureId}`
      }`,
      payload
    );
    return data;
  };
  const updateSignature = async ({
    id,
    payload,
    isPortalUser
  }: {
    id: string;
    payload: Partial<CreateDocumentSignatureReqPayload>;
    isPortalUser?: boolean;
  }) => {
    const { data } = await $api.post<SignatureRequest>(
      `${
        isPortalUser
          ? `portal/document-signature/signature/${id}`
          : `document-signature/signature/${id}`
      }`,
      payload
    );
    return data;
  };
  const removeSignature = async (id: string) => {
    const { data } = await $api.delete<SignatureRequest>(
      `document-signature/signature/${id}`
    );
    return data;
  };

  return {
    signatureStatuses,
    getAll,
    getOne,
    getOneByFile,
    createDocumentSignatureRequest,
    updateDocumentSignatureRequest,
    cancelDocumentSignatureRequest,
    remindDocumentSignature,
    addSignature,
    updateSignature,
    removeSignature
  };
}
