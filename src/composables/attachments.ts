import $api from '@/plugins/api';
import type {
  Attachment,
  AttachmentContentType,
  AttachmentExtension,
  AttachmentResponse,
  CreateAttachment,
  DownloadFilesAndFolders,
  SaveAttachment
} from '@/types/attachment.type';
import type { FileObject, UploadFilesPayload } from '@/types/common.type';
import type { MailsAttachmentResponse } from '@/types/inbox.type';
import type { Webform } from '@/types/webforms.type';
import type { MaybeRef } from '@vueuse/core';
import axios from 'axios';

const { isPortalUser, currentUser } = useCurrentUserData();
const { getBlobFileFromUrl } = useUtilityFns();
export function useAttachments() {
  const fileSelected = ref();
  const filesSelected = ref<File[]>([]);
  const attachmentRes = ref<AttachmentResponse[]>([]);
  const uploadFileRef = ref<Record<string, any> | string>();
  const uploadDialog = ref(false);
  const uploadedFiles = ref<File[]>([]);
  const isDocument = ref(false);
  const isInbox = ref(false);
  const isSupportTask = ref(false);
  const clientId = ref('');
  const folderId = ref('');

  const { initToast } = useToasts();

  const { addDocumentTag } = useTags();

  const getAttachment = async (id: string) => {
    if (!id)
      return;
    const { data } = await $api.get<Attachment>(
      `${isPortalUser.value ? 'portal/' : ''}attachments/${id}`
    );
    return { ...data, link: data.url, filename: data.name };
  };

  const removeAttachment = async (id: string, isPublic?: boolean) => {
    const { data } = await $api.delete(
      `${isPortalUser.value ? 'portal/' : ''}attachments/${id}${
        isPublic ? '/open' : ''
      }`
    );
    return data;
  };
  const removePublicAttachment = async ({
    id,
    isPublic,
    payload
  }: {
    id: string;
    isPublic?: boolean;
    payload?: { userId: string; orgId: string };
  }) => {
    const { data } = await $api.patch(
      `${isPortalUser.value ? 'portal/' : ''}attachments/${id}${
        isPublic ? '/open' : ''
      }`,
      payload
    );
    return data;
  };

  const uploadAttachment = async (url: string, payload: UploadFilesPayload) => {
    const { data } = await axios.put(`${url}`, payload);
    return data;
  };

  const markAsUploaded = async ({
    id,
    payload,
    isPublic
  }: {
    id: string;
    payload?: { orgId: string };
    isPublic?: boolean;
  }) => {
    const { data } = await $api.post(
      `${isPortalUser.value ? 'portal/' : ''}attachments/${id}/uploaded${
        isPublic ? '/open' : ''
      }`,
      payload
    );
    return data;
  };

  const extractData = async ({
    fileId,
    clientId,
    isAutoExtraction,
    isAutoTag
  }: {
    fileId: string;
    clientId: string;
    isAutoExtraction: boolean;
    isAutoTag: boolean;
  }) => {
    const url = `${isPortalUser.value ? 'portal/' : ''}clients/${
      !isPortalUser.value ? `${clientId}/` : ''
    }files/${fileId}/extraction`;

    const { data } = await $api.post(url, {
      enableExtraction: !!isAutoExtraction,
      enableClassification: !!isAutoTag
    });
    return data;
  };

  const markGalleryDocumentAsUploaded = async ({
    id,
    isAutoTag,
    isAutoExtraction,
    tagId,
    isFromExtraction
  }: {
    id: string;
    isAutoTag?: boolean;
    isAutoExtraction?: boolean;
    tagId?: string;
    isFromExtraction?: boolean;
  }) => {
    const url = `gallery/files/${id}/uploaded${
      isFromExtraction ? `?isFromExtraction=${isFromExtraction}` : ''
    }`;
    const { data } = await $api.patch(url, {
      enableExtraction: !!isAutoExtraction,
      enableClassification: !!isAutoTag
    });
    return data;
  };

  const markClientDocumentAsUploaded = async ({
    id,
    isAutoExtraction,
    isAutoTag,
    tagId,
    isFromExtraction
  }: {
    id: string;
    isAutoTag?: boolean;
    isAutoExtraction?: boolean;
    isFromExtraction?: boolean;
    tagId?: string;
  }) => {
    const url = `${isPortalUser.value ? 'portal/' : ''}clients/${
      !isPortalUser.value ? `${clientId.value}/` : ''
    }files/${id}/uploaded${
      isFromExtraction ? `?isFromExtraction=${isFromExtraction}` : ''
    }`;
    const { data } = await $api.patch(url, {
      enableExtraction: !!isAutoExtraction,
      enableClassification: !!isAutoTag
    });
    if (tagId) {
      await addDocumentTag({
        clientId: clientId.value,
        fileId: data.id,
        tagId,
        isPortal: isPortalUser.value
      });
    }
    return data;
  };
  const markInboxAttachmentAsUploaded = async (id: string) => {
    const { data } = await $api.patch(
      `${isPortalUser.value ? 'portal/' : ''}inbox/attachments/${id}/uploaded`
    );
    return data;
  };

  const clearFiles = (
    fileUploadRef?: MaybeRef<Record<string, any>> | string,
    schemaFormRef?: Record<string, any>
  ) => {
    if (schemaFormRef && fileUploadRef) {
      schemaFormRef.refs[
        `${isRef(fileUploadRef) ? fileUploadRef.value : fileUploadRef}`
      ][0].isUploading = false;
      schemaFormRef.refs[
        `${isRef(fileUploadRef) ? fileUploadRef.value : fileUploadRef}`
      ][0].clear();
      fileSelected.value = undefined;
      filesSelected.value = [];
      attachmentRes.value = [];
    }
    else {
      if (isRef(fileUploadRef) && fileUploadRef?.value) {
        (fileUploadRef as MaybeRef<Record<string, any>>).value.isUploading
          = false;
        (fileUploadRef as MaybeRef<Record<string, any>>).value.clear();
        fileSelected.value = undefined;
        filesSelected.value = [];
        attachmentRes.value = [];
      }
    }
  };

  const getPath = async (path: string) => {
    const { data } = await $api.get(
      `${isPortalUser.value ? 'portal/' : ''}storage/local?path=${path}`
    );
    return data;
  };

  const getAttachmentUrl = (path: string, isPublic?: boolean) => {
    if (path) {
      return `${window.location.origin}/api/v1/${
        isPortalUser.value ? 'portal/' : ''
      }storage/local${isPublic ? '/public' : ''}?path=${path}`;
    }
    return '';
  };

  const createAttachment = async ({
    payloadData,
    showToast = true,
    fileUploadRef,
    schemaFormRef,
    returnUploadResponse = false,
    isPublic = false,
    isGalleryUpload,
    extraction,
    webform
  }: {
    payloadData: {
      payload: CreateAttachment;
      file: UploadFilesPayload;
      tagId?: string;
      isAutoTag?: boolean;
      isAutoExtraction?: boolean;
    };
    showToast?: boolean;
    isPublic?: boolean;
    fileUploadRef?: MaybeRef<Record<string, any>> | string;
    schemaFormRef?: Record<string, any>;
    returnUploadResponse?: boolean;
    isGalleryUpload?: boolean;
    extraction?: {
      isFromExtraction?: boolean;
      uploadFolderId?: any;
      uploadClientId?: any;
    };
    webform?: Partial<Webform>;
  }) => {
    // let data: AttachmentResponse;
    let url;
    if (extraction?.isFromExtraction) {
      folderId.value = extraction.uploadFolderId;
      clientId.value = extraction.uploadClientId;
    }
    if (isGalleryUpload) {
      url = `gallery/files${
        folderId.value ? `?folderId=${folderId.value}` : ''
      }`;
    }
    else if (isDocument.value)
      url = `${isPortalUser.value ? 'portal/' : ''}clients/${
        !isPortalUser.value ? `${clientId.value}/` : ''
      }files${folderId.value ? `?folderId=${folderId.value}` : ''}`;
    else if (isInbox.value)
      url = `${isPortalUser.value ? 'portal/' : ''}inbox/attachments`;
    else
      url = `${isPortalUser.value ? `portal/` : ''}attachments${
        isPublic ? '/open' : ''
      }`;

    let { data } = await $api.post(url, payloadData.payload);
    await uploadAttachment(data.url, payloadData.file);
    let attachmentResponse;
    if (isGalleryUpload) {
      attachmentResponse = data;
      const documentResponse = await markGalleryDocumentAsUploaded({
        id: data.id,
        isAutoTag: payloadData.isAutoTag,
        isAutoExtraction: payloadData.isAutoExtraction,
        tagId: payloadData.tagId,
        isFromExtraction: extraction?.isFromExtraction
      });
    }
    else if (isDocument.value) {
      const documentResponse = await markClientDocumentAsUploaded({
        id: data.id,
        isAutoTag: payloadData.isAutoTag,
        isAutoExtraction: payloadData.isAutoExtraction,
        tagId: payloadData.tagId,
        isFromExtraction: extraction?.isFromExtraction
      });
      attachmentResponse = documentResponse;
    }
    else if (isInbox.value) {
      const inboxAttachment = await markInboxAttachmentAsUploaded(data.id);
      attachmentResponse = inboxAttachment;
    }
    else {
      await markAsUploaded({
        id: data.id,
        payload: {
          orgId: payloadData.payload.orgId as string
        },
        isPublic
      });
      attachmentResponse = data;
    }
    if (showToast) {
      initToast({
        actionType: 'Update',
        title: 'File Upload',
        summary: 'File Upload',
        detail: `File <strong class="break-all">${
          (payloadData.file as unknown as File).name
        }</strong> uploaded successfully`
      });
    }
    clearFiles(fileUploadRef, schemaFormRef);
    data = { res: data, file: payloadData.file };
    return returnUploadResponse ? attachmentResponse : data;
  };

  const handlePostAttachment = async (
    res: AttachmentResponse | AttachmentResponse[],
    files: UploadFilesPayload | UploadFilesPayload[],
    fileUploadRef?: MaybeRef<Record<string, any>>,
    schemaFormRef?: Record<string, any>
  ) => {
    if (schemaFormRef && fileUploadRef) {
      if (schemaFormRef.refs[fileUploadRef.value]) {
        schemaFormRef.refs[fileUploadRef.value][0].isUploading = true;
      }
    }
    else {
      if (fileUploadRef) {
        fileUploadRef.value.isUploading = true;
      }
    }
    if (Array.isArray(files)) {
      await Promise.allSettled(
        (files as UploadFilesPayload[]).map(async (item, i) => {
          await uploadAttachment((res as AttachmentResponse[])[i].url, item);
          await markAsUploaded({ id: (res as AttachmentResponse[])[i].id });
        })
      );
    }
    else {
      await uploadAttachment(
        (res as AttachmentResponse).url,
        files as UploadFilesPayload
      );
      await markAsUploaded({ id: (res as AttachmentResponse).id });
    }

    initToast({
      actionType: 'Update',
      title: 'File Upload',
      summary: 'File Upload',
      detail: Array.isArray(files)
        ? `Total <strong>
          ${(files as unknown as File[]).length}
        </strong> File${files.length > 1 ? 's' : ''} uploaded successfully`
        : `File <strong class="break-all">${
            (files as unknown as File).name
          }</strong> uploaded successfully`
    });
    clearFiles(fileUploadRef, schemaFormRef);
  };

  const showFileErrorMessages = (messages: string[]) => {
    if (messages && messages.length) {
      messages.forEach((message) => {
        initToast({
          title: 'File Upload',
          actionType: 'Error',
          detail: `${message}`
        });
      });
    }
  };

  const createFilePayload = (val: FileObject) => {
    const payload: CreateAttachment = {
      filename: Array.isArray(val.files) ? val.files[0].name : val.files?.name,
      contentType: Array.isArray(val.files)
        ? (val.files[0].type as unknown as AttachmentContentType)
        : (val.files?.type as unknown as AttachmentContentType),
      extension: Array.isArray(val.files)
        ? (val.files[0].name.split('.').pop() as unknown as AttachmentExtension)
        : (val.files.name.split('.').pop() as unknown as AttachmentExtension),
      contentLength: Array.isArray(val.files)
        ? (val.files as File[])[0].size
        : val.files.size
    };
    fileSelected.value = Array.isArray(val.files)
      ? (val.files as File[])[0]
      : val.files;
    uploadFileRef.value = val.name;
    return { payload };
  };

  const makeParallelAPIReq = async ({
    payloadArr,
    isGalleryUpload,
    extraction
  }: {
    payloadArr: {
      file: File & {
        isAutoTag?: boolean;
        isAutoExtraction?: boolean;
        tagId?: string;
      };
      showToast?: boolean;
      isPublic?: boolean;
      webform?: Partial<Webform>;
    }[];
    isGalleryUpload?: boolean;
    extraction?: any;
  }) => {
    if (payloadArr.length === 0) {
      return;
    }
    const response:
      | MailsAttachmentResponse[]
      | { res: AttachmentResponse; file: File }[] = [];
    await Promise.allSettled(
      payloadArr.map(async (item) => {
        // filesSelected.value.push(item);
        fileSelected.value = item.file;
        const payload: CreateAttachment = {
          name: isDocument ? item.file.name : undefined,
          filename: item.file.name,
          contentType: item.file.type as unknown as AttachmentContentType,
          extension: item.file.name
            .split('.')
            .pop() as unknown as AttachmentExtension,
          contentLength: item.file.size,
          orgId: item.webform?.org.id,
          userId: item.webform?.createdBy?.id
        };
        // uploadFileRef.value
        const data = await createAttachment({
          payloadData: {
            payload,
            file: fileSelected.value,
            isAutoTag: item.file.isAutoTag,
            isAutoExtraction: item.file.isAutoExtraction,
            tagId: item.file.tagId
          },
          fileUploadRef: uploadFileRef,
          returnUploadResponse: !isSupportTask.value,
          isGalleryUpload,
          extraction,
          showToast: item.showToast
        });

        response.push(data);
      })
    );
    return response;
  };

  const onUpload = async ({
    payload,
    isGalleryUpload,
    extraction,
    showToast,
    isPublic,
    webform
  }: {
    payload: UploadFilesPayload;
    isGalleryUpload?: boolean;
    showToast?: boolean;
    isPublic?: boolean;
    extraction?: any;
    webform?: Partial<Webform>;
  }) => {
    if (uploadFileRef.value) {
      (uploadFileRef.value as Record<string, any>).isUploading = true;
    }
    if (Array.isArray(payload.files)) {
      uploadedFiles.value = [];
      const payloadArr = payload.files.map(file => ({
        file,
        showToast,
        isPublic,
        webform
      }));
      const data = await makeParallelAPIReq({
        payloadArr,
        isGalleryUpload,
        extraction
      });
      /* updateAttachment(
        currentAttachmentRef.value?.index as number,
        currentAttachmentRef.value?.taskType as TaskType,
        currentAttachmentRef.value?.isUpdate
      );
      if (!currentAttachmentRef.value?.isUpdate) {
        initToast({
          actionType: 'Update',
          summary: 'File Upload',
          detail: `Total <strong>${uploadedFiles.value?.length}</strong> File${
            uploadedFiles.value?.length > 1 ? 's' : ''
          } uploaded successfully`,
        });
      } */

      uploadDialog.value = false;
      return data;
    }
    else {
      const file = payload.files;
      const attachmentPayload: CreateAttachment = {
        name: isDocument ? file.name : undefined,
        filename: file.name,
        contentType: file.type as unknown as AttachmentContentType,
        extension: file.name.split('.').pop() as unknown as AttachmentExtension,
        contentLength: file.size,
        orgId: webform?.org.id,
        userId: webform?.createdBy?.id
      };
      const data = await createAttachment({
        payloadData: {
          payload: attachmentPayload,
          file: file as unknown as UploadFilesPayload,
          isAutoTag: (file as any).isAutoTag,
          isAutoExtraction: (file as any).isAutoExtraction,
          tagId: (file as any).tagId
        },
        fileUploadRef: uploadFileRef,
        returnUploadResponse: !isSupportTask.value,
        isGalleryUpload,
        extraction,
        showToast,
        isPublic
      });

      return data;
    }
  };

  const createSavePayload = async (
    attachmentId: string,
    folderId: string | null,
    attachment?: MailsAttachmentResponse
  ) => {
    const attachmentRes = attachment || ((await getAttachment(attachmentId)) as Attachment);
    const payload: SaveAttachment = {
      name: attachmentRes.name,
      filename: attachmentRes.name,
      contentType: ('mime' in attachmentRes
        ? attachmentRes.mime
        : 'mimeType' in attachmentRes
          ? attachmentRes.mimeType
          : undefined) as unknown as AttachmentContentType,
      extension: attachmentRes.name
        .split('.')
        .pop() as unknown as AttachmentExtension,
      contentLength: ('size' in attachmentRes
        ? attachmentRes.size
        : 'contentLength' in attachmentRes
          ? attachmentRes.contentLength
          : undefined) as unknown as number,
      path: attachmentRes.path,
      folderId: folderId === null ? undefined : folderId
    };
    return { payload, attachmentRes };
  };

  const saveAttachment = async (clientId: string, payload: SaveAttachment) => {
    const { data } = await $api.post(`clients/${clientId}/files/save`, payload);
    return data;
  };

  async function getBlobFromFileURL(fileURL: string) {
    try {
      const response = await axios.get(fileURL, {
        responseType: 'blob' // Ensure Axios interprets the response as a Blob
      });

      // Extract the Blob data from the response
      const blobData = new Blob([response.data], {
        type: response.headers['content-type']
      });

      return blobData;
    }
    catch (error) {
      console.error('Error fetching the file:', error);
      throw error;
    }
  }

  const downloadFileAs = async (url: string, filename?: string) => {
    if (!url) {
      throw new Error('Resource URL not provided! You need to provide one');
    }

    getBlobFromFileURL(url)
      .then((blob) => {
        const blobURL = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobURL;
        a.setAttribute('class', 'hidden');
        if (filename && filename.length)
          a.download = filename;
        document.body.appendChild(a);
        a.click();
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const downLoadFilesAndFoldersAs = async (
    clientId: string,
    payload: DownloadFilesAndFolders,
    isPortal?: boolean
  ) => {
    const { data } = await $api.post(
      `${
        isPortal ? `portal/clients/download` : `clients/${clientId}/download`
      }`,
      payload
    );
    return data;
  };

  return {
    extractData,
    createAttachment,
    uploadAttachment,
    markAsUploaded,
    handlePostAttachment,
    clearFiles,
    removeAttachment,
    removePublicAttachment,
    getPath,
    getAttachmentUrl,
    getAttachment,
    showFileErrorMessages,
    createFilePayload,
    fileSelected,
    uploadFileRef,
    filesSelected,
    attachmentRes,
    uploadDialog,
    onUpload,
    isDocument,
    clientId,
    folderId,
    isInbox,
    isSupportTask,
    saveAttachment,
    createSavePayload,
    downloadFileAs,
    getBlobFromFileURL,
    downLoadFilesAndFoldersAs
  };
}
