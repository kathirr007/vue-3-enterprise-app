<script setup lang="ts">
import type { Client, ClientUser, HandleStepFunc } from '@/types/client.type';
import type { Webform } from '@/types/webforms.type';
import type {
  APIActions,
  ExtractedType,
  PaginatedResponse
} from '@/types/common.type';
import type { DocumentFile } from '@/types/documents.type';
import { SignatureRequestPayloadSchema } from '@/types/esignature.type';
import type {
  CreateDocumentSignaturePayload,
  CreateDocumentSignatureReqPayload,
  InstantJSON,
  NewSignature,
  SignatureRequest
} from '@/types/esignature.type';
import type { FullNameObj, User } from '@/types/teams.type';
import dayjs from 'dayjs';
import type {
  Annotation,
  AnnotationsUnion,
  AnnotationsWillChangeReason,
  InkAnnotation,
  Instance,
  List,
  Point,
  Rect,
  StandaloneConfiguration
} from 'pspdfkit';
import type { AnnotationsPressEvent } from '@/types/pspdfkit.type';
import PSPDFKit from 'pspdfkit';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { MaybeRef } from 'vue';

interface AnnotationToolType { type: string; name: string; icon?: string }

const props = defineProps<{
  fileId?: string;
  signReqId?: string;
  selectedDoc?: string;
  clientId?: string;
  isGallery?: boolean;
  isSignReq?: boolean;
  isSignDoc?: boolean;
  isWebform?: boolean;
  isWebformTemplate?: boolean;
  contractView?: boolean;
}>();

const emits = defineEmits<{
  (e: 'loaded', value: Instance): void | PromiseLike<void>;
  (e: 'back'): void;
  (
    e: 'map-fields',
    data: { instantJSON: InstantJSON; sendToClient: boolean }
  ): void;
  (e: 'fill:webform', data: Webform): void;
}>();

const clientDetails = inject<Client | undefined>('clientDetails', undefined);
const webformDetails = inject<Webform | undefined>('webformDetails', undefined);
const handleStep = inject<HandleStepFunc>('handleStep', () => {});

const route = useRoute();
const router = useRouter();
const {
  clientId: clientIdProp,
  fileId: fileIdProp,
  signReqId: signReqIdProp,
  isWebform: isWebformProp
} = toRefs(props);
const folderId = ref(route.query.folderId as string);
const fileIdQuery = ref(route.query.fileId as string);
const webformIdQuery = ref(route.query.webformId as string);
const isESignWebformQuery = ref(route.query.isESignWebform === 'true');
const selectedWebformId = ref(route.query.webformId as string);
const signReqIdQuery = ref(route.query.signReqId as string);
const isSignReqQuery = ref(route.query.isSignReq === 'true');
const isSignDocQuery = ref(route.query.isSignDoc === 'true');
const { getUsers } = useCommonListQueries();
const { fullName, dateToHumanShort, fileIcon } = useVueFilters();
const { getFilename, isFalsy, canOpenDoc } = useUtilityFns();
const { currentUser, isPortalUser } = useCurrentUserData();
const { downloadFileAs, getAttachment } = useAttachments();
const { getFile, getFiles } = useDocuments();
const { queryKeys } = useDataTableUtils();
const { activeVerifiedUser } = getUsers(true, !isPortalUser.value);
const {
  createDocumentSignatureRequest,
  addSignature,
  getOne,
  getAll,
  updateDocumentSignatureRequest,
  removeSignature
} = useDocumentSignature();
const { initToast } = useToasts();

const queryClient = useQueryClient();
const attrs = useAttrs();
const { getOne: getWebformDetails } = useWebforms();
const { getOne: getWebformTemplateDetails } = useWebformTemplates();

const clientIdParam = ref(route.params.id as string);
const selectedFile = ref();
const selectedFilename = ref();
const pdfcontainer = ref<HTMLDivElement>();
const pspdfkitFormCreator = ref<HTMLElement>();
const pspdfkitToolbar = ref<HTMLElement>();
const pspdfkitConfirmDialog = ref<HTMLElement>();
const pspdfkitFormCreatorPopover = ref<HTMLElement>();
const isEditingForm = ref(false);
const isAllSignForCurrentUser = ref(false);
const fileIds = ref();
const signIds = ref();
const fileInstantJSON = ref();
const instance = ref<Instance>();
const signatureFieldRemoved = ref();
// const canLoadDoc = ref(false);
const newSignatures = ref<AnnotationsUnion[]>([]);
const newSignAttachments = ref<Record<string, any>>({});

const isSignDocument = computed(() => {
  return (
    props.isSignDoc
    || props.isSignReq
    || isSignDocQuery.value
    || isESignWebformQuery.value
  );
});

const loadSignReqFromWebform = computed(
  () =>
    isWebformProp?.value
    && webformDetails?.value
    && !webformDetails?.value?.signatureRequest?.length
);

const {
  removeAnnotation,
  prepareRemoveAnnotation,
  getSignatureWidgetOfSign,
  getSignatureOfWidget,
  getPSPDFKitKey,
  removeAnnotationDialog,
  annotationToRemove,
  fitIn
} = usePSPDFKit(instance.value as Instance);

const previousAndNextFileIds = computed(() => {
  if (!isFalsy(fileIds.value)) {
    const isSignDocReq = props.isSignDoc || isSignDocQuery.value;
    const arrayToCheck = isSignDocReq
      ? signIds.value?.map((item: { id: string; fileId: string }) => item.id)
      : fileIds.value;
    let selectedId;
    if (isSignDocReq) {
      selectedId = signReqIdProp?.value || signReqIdQuery.value;
    }
    else {
      selectedId = fileIdProp?.value || fileIdQuery.value;
    }
    const index = arrayToCheck?.indexOf(selectedId);
    const previousId = index > 0 ? arrayToCheck[index - 1] : null;
    const nextId
      = index < arrayToCheck?.length - 1 ? arrayToCheck[index + 1] : null;

    return { previousId, nextId };
  }
  return {
    previousId: null,
    nextId: null
  };
});

const signerOptions = computed(() => {
  if (clientDetails?.value && activeVerifiedUser.value) {
    const clientUsers = (
      (toRaw(clientDetails?.value) as Client).clientUsers as ClientUser[]
    )
      ?.filter((user: ClientUser) => user.isActive && user.user.isVerified)
      .map((user: ClientUser) => ({ ...user.user, name: fullName(user.user) }));
    return [
      { label: `${$tConfig('CLIENT')} Users`, items: [...clientUsers] },
      { label: 'Team Members', items: [...activeVerifiedUser.value] }
    ];
  }
  return [];
});

const confirmRemoveObj = computed(() => {
  if (annotationToRemove.value) {
    const fieldName = annotationToRemove.value.name
      ?.split('_')[0]
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ');
    if (annotationToRemove.value.isSignature)
      return {
        title: 'Confirm Remove eSignature',
        message: 'Are you sure you want to remove this eSignature?'
      };
    return {
      title: `Confirm Remove ${fieldName}`,
      message: `Are you sure you want to remove this <strong>${fieldName}</strong>?`
    };
  }
  return {
    title: 'Confirm Remove',
    message: 'Are you sure you want to remove?'
  };
});

const { data: files, isFetching: fetchingFiles } = useQuery(
  ['files-list', ...queryKeys],
  () => {
    // if (isSignDocument.value) return;
    return getFiles({
      id: (props.clientId as string) || (currentUser.value?.id as string),
      folderId: folderId.value ? (folderId.value as string) : undefined,
      isPortal: isPortalUser.value
    });
  },
  {
    onSuccess: (data: DocumentFile[]) => {
      if (data) {
        fileIds.value = data
          .filter((file: DocumentFile) => canOpenDoc(file.filename))
          .map((file: DocumentFile) => file.id);
      }
    },
    enabled: !!props.clientId || !!currentUser.value?.client?.id
  }
);
const { data: signaturesList, isFetching: loadingSignatures } = useQuery(
  ['document-signature-list', ...queryKeys],
  () => {
    return getAll({
      isPortal: isPortalUser.value
    });
  },
  {
    onSuccess: (data: PaginatedResponse<NewSignature>) => {
      if (data) {
        signIds.value = data.results.map((signature: NewSignature) => ({
          id: signature.id,
          fileId: signature.fileId,
          webform: signature.webform
        }));
      }
    },
    enabled: !!props.isSignDoc || isSignDocQuery.value
  }
);

const { data: pspdfkitData, isFetching: fetchingPspdfkitData } = useQuery(
  ['fetch-pspdfkit-data', ...queryKeys],
  () => {
    return getPSPDFKitKey(isPortalUser.value);
  }
  /* {
    onSuccess: (data: PSPDFKey) => {
      canLoadDoc.value = true;
    },
  } */
);

const canLoadDoc = computed(() => {
  return (
    !!pspdfkitData.value
    && (!!fileIdProp?.value || !!fileIdQuery.value || !!selectedWebformId.value)
  );
});

// Dependant query - get the files's data
function useFileDataQuery(enabled: MaybeRef<boolean>) {
  return useQuery(
    ['get-one-file'],
    () => {
      // console.log('canLoadDoc', canLoadDoc.value);
      // console.log('getting file data...');

      if (isESignWebformQuery.value || isWebformProp?.value) {
        return getAttachment(
          (fileIdProp?.value as string) || (fileIdQuery.value as string)
        ) as unknown as DocumentFile;
      }
      else {
        return getFile(
          (currentUser.value?.client?.id as string)
          || (props.clientId as string)
          || (clientIdParam.value as string),
          (fileIdProp?.value as string) || (fileIdQuery.value as string),
          isPortalUser.value,
          props.isGallery
        );
      }
    },
    {
      onSuccess: async (data: DocumentFile) => {
        selectedFile.value = data;
        selectedFilename.value = getFilename(data?.name);
        await nextTick().then(() => {
          if (!(props.isSignDoc || isSignDocQuery.value)) {
            // console.log('loading pdf after fetching file...');
            useTimeoutFn(() => loadPSPDFKit(), 400);
          }
        });
      },
      enabled
    }
  );
}

const { data: fileData, isLoading: loadingFile } = useFileDataQuery(canLoadDoc);

const canLoadSignature = computed(() => {
  return (
    !!fileData.value
    && (!!selectedWebformId.value
    || (isWebformProp?.value && !!webformDetails?.value)
    || ((props.isSignDoc || isSignDocQuery.value)
    && (!!signReqIdProp?.value || !!signReqIdQuery.value)))
  );
});

// Dependant query - get the files's signature data
function useSignatureDataQuery(enabled: MaybeRef<boolean>) {
  return useQuery(
    ['get-one-signature-request'],
    () => {
      // console.log('canLoadSignature', canLoadSignature.value);
      // console.log('getting-signature data...');

      return loadSignReqFromWebform.value
        ? (toRaw(webformDetails?.value) as unknown as SignatureRequest)
        : getOne(
          (signReqIdProp?.value as string)
          || (signReqIdQuery.value as string)
          || (webformDetails?.value?.signatureRequest[0]?.id as string),
          isPortalUser.value
        );
    },
    {
      onSuccess: async (data) => {
        if (data) {
          fileInstantJSON.value = undefined;
          totalAnnotations.value = 0;
          await nextTick();
          const instantJSON = data.documentMeta?.instantJSON;
          if (instantJSON) {
            fileInstantJSON.value = { ...instantJSON };
            totalAnnotations.value = instantJSON
              ? ((instantJSON as InstantJSON)?.annotations?.length as number)
              : 0;
          }
          title.value = data.title || (data.name as string);
          dueDate.value = data.dueDate
            ? dayjs(data.dueDate).toDate()
            : dayjs().toDate();
          await nextTick().then(() => {
            // console.log('loading pdf after fetching signature data...');
            useTimeoutFn(() => loadPSPDFKit(), 410);
          });
        }
      },
      enabled
    }
  );
}

const {
  data: fileSignatureData,
  isLoading: loadingSignature,
  isFetching: fetchingSignature
} = useSignatureDataQuery(canLoadSignature);

const isShowFormBtns = computed(() => {
  if (isSignDocQuery.value) {
    return currentUser.value?.id === fileSignatureData.value?.requestedBy?.id;
  }
  return true;
});

const { handleSubmit, errors, validate, meta, setFieldValue } = useForm({
  validationSchema: SignatureRequestPayloadSchema
});

const { value: requestedTo } = useField<User>('requestedTo');
const { value: title } = useField<string>('title');
const { value: dueDate } = useField<Date>('dueDate');

const totalAnnotations = ref(0);

// We track wether or not drag and drop is supported on the device. If not, we
// allow clicking an item to place it as well (e.g on iPhones)
let isDragAndDropSupported = false;

const formEditBtnText = computed(() =>
  isEditingForm.value ? 'Save Edit' : 'Edit'
);

const formSubmitBtnText = computed(() =>
  isAllSignForCurrentUser.value
    ? 'Save'
    : signReqIdQuery.value
      ? 'Resend'
      : 'Send'
);

const disableEditBtn = computed(() => {
  return (
    !currentUser.value?.isOwner
    && currentUser.value?.id !== fileSignatureData.value?.requestedBy?.id
    && !!signReqIdQuery.value
    && isSignDocQuery.value
  );
});

const enableDueDate = computed(() => {
  return signReqIdQuery.value
    ? !!signReqIdQuery.value
    && isSignDocQuery.value
    && fileSignatureData.value?.status !== 'SIGNED'
    && currentUser.value?.id === fileSignatureData.value?.requestedBy?.id
    : true;
});

function showToast(actionType: APIActions, actionTitle: string, data?: any) {
  initToast({
    actionType,
    title: actionTitle,
    summary: `${actionType} ${actionTitle}`,
    detail: `${actionTitle} ${
      data
        ? ''
        : `${actionTitle === 'eSignature' ? `for ` : ''}<strong>${
            title.value
          }</strong>`
    } ${actionType}${
      actionType.charAt(actionType.length - 1) !== 'e' ? 'ed' : 'd'
    } successfully.`
  });
}

function toggleFormEdit() {
  if (!instance.value)
    return;
  (instance.value as Instance).setViewState((viewState) => {
    return viewState.set(
      'interactionMode',
      !isEditingForm.value ? PSPDFKit.InteractionMode.FORM_CREATOR : null
    );
  });
  /* (instance.value as Instance).setViewState((viewState) => ({
  ...viewState,
  interactionMode: PSPDFKit.InteractionMode.FORM_CREATOR
})); */
  // (
  //   instance.value.contentDocument.querySelector(
  //     '.PSPDFKit-Toolbar-Button-Form-Creator'
  //   ) as HTMLElement
  // ).click();
  isEditingForm.value = !isEditingForm.value;
  // (pspdfkitFormCreator.value as HTMLElement).click();
}

const { mutateAsync: createDocSignReq, isLoading: creatingSignatureRequest }
  = useMutation(
    ['create-doc-sign-request'],
    (payload: CreateDocumentSignatureReqPayload) => {
      return createDocumentSignatureRequest(payload);
    },
    {
      onSuccess: (data: SignatureRequest) => {
        showToast('Create', 'eSignature Request');
        // router.push({
        //   query: { ...route.query, isSignDoc: 'true', signReqId: data.id },
        // });
        if (!props.isWebform) {
          goBack('eSignature');
        }
        else {
          emits('back');
        }
      }
    }
  );
const { mutateAsync: updateDocSignReq, isLoading: updatingSignatureRequest }
  = useMutation(
    ['update-doc-sign-request'],
    ({
      id,
      payload
    }: {
      id: string;
      payload: Partial<CreateDocumentSignatureReqPayload>;
    }) => {
      return updateDocumentSignatureRequest({
        id,
        payload,
        isPortal: isPortalUser.value
      });
    },
    {
      onSuccess: (data: SignatureRequest) => {
        showToast('Update', 'eSignature Request');
        queryClient.invalidateQueries('get-one-signature-request');
      }
    }
  );
const { mutateAsync: addUpdateDocSign, isLoading: addUpdatingDocSign }
  = useMutation(
    ['update-doc-sign-request'],
    ({
      id,
      payload,
      signatureId
    }: {
      id: string;
      signatureId: string;
      payload: Partial<CreateDocumentSignaturePayload>;
    }) => {
      return addSignature({
        id,
        payload,
        signatureId,
        isPortalUser: isPortalUser.value
      });
    },
    {
      onSuccess: (data: NewSignature) => {
        if (!isFalsy(data.signatureMeta)) {
          showToast('Add', 'eSignature');
        }
        else {
          showToast('Remove', 'eSignature');
        }
        queryClient.invalidateQueries('get-one-signature-request');
      }
    }
  );
const { mutateAsync: removeDocSignField, isLoading: removingSignature }
  = useMutation(
    ['remove-doc-sign'],
    (id: string) => {
      return removeSignature(id);
    },
    {
      onSuccess: async (data: SignatureRequest) => {
        showToast('Remove', 'eSignature', data);
      }
    }
  );

// Inserts an image annotation on the page.
// https://pspdfkit.com/guides/web/current/annotations/introduction-to-annotations/
async function insertImageAnnotation(
  pageRect: Rect | Point,
  blob: Blob,
  pageIndex: number
) {
  instance.value?.createAttachment(blob).then((attachmentId) => {
    const annotation = new PSPDFKit.Annotations.ImageAnnotation({
      pageIndex,
      boundingBox: pageRect as Rect,
      contentType: 'image/jpeg',
      imageAttachmentId: attachmentId
    });

    instance.value
      ?.create(annotation)
      .then(
        annotations =>
          instance.value?.setSelectedAnnotations(
            annotations[0] as unknown as List<AnnotationsUnion>
          )
      );
  });
}

// Given a File object, we can create an <image/> tag to parse the image and
// retrieve the original dimensions.
function parseImageDimensions(file: File, onDimensions: any) {
  const url = URL.createObjectURL(file);
  const image = new Image();

  image.onerror = () => URL.revokeObjectURL(url);
  image.onload = () => {
    onDimensions({ width: image.width, height: image.height });
    URL.revokeObjectURL(url);
  };
  image.src = url;
}

// Event handler that is called when a file from outside is dropped onto the PDF
// page.
function handleExternalDrop(event: DragEvent, pageIndex: number) {
  const file = event.dataTransfer?.files[0];
  const allowedExternalMimeTypes = ['image/jpeg', 'image/png'];

  if (!allowedExternalMimeTypes.includes((file as File).type)) {
    return;
  }

  const clientX = event.clientX;
  const clientY = event.clientY;

  // We don't know the dimensions of the image. To do this, we first parse it
  // with the use of this helper function. Note that it will run async so we
  // continue in the callback function.
  parseImageDimensions(file as File, (dimensions: any) => {
    const ratio = dimensions.height / dimensions.width;

    // External drag and drop items will have the cursor in the middle of the
    // bounding box.
    // We also scale the image so that the aspect ratio is kept.
    const width = 220;
    const height = width * ratio;

    const clientRect = new PSPDFKit.Geometry.Rect({
      left: clientX - width / 2,
      top: clientY - height / 2,
      width,
      height
    });

    const pageRect = (
      instance.value as Instance
    ).transformContentClientToPageSpace(clientRect, pageIndex);

    insertImageAnnotation(pageRect, file as File, pageIndex);
  });

  event.preventDefault();
}

// Event handler that is called when an annotation from the internal toolbar is
// dropped onto a PDF page.
function handleToolClickNDrop({
  event,
  tool,
  isInternalDrop,
  dropIndex
}: {
  event: DragEvent | Event;
  tool?: AnnotationToolType;
  isInternalDrop?: boolean;
  dropIndex?: number;
}) {
  const pageIndex = isInternalDrop
    ? (dropIndex as number)
    : (instance.value?.viewState.currentPageIndex as number);

  const currentPageEl = instance.value?.contentDocument.querySelector(
    `.PSPDFKit-Page[data-page-index="${pageIndex}"]`
  );
  const clickEventTop
    = (currentPageEl?.getBoundingClientRect().top as number) + 50;
  const clickEventLeft
    = (currentPageEl?.getBoundingClientRect().width as number) / 2 - 220 / 2;

  // We know that internal drag and drop objects will have the cursor on the
  // top left left side of the box. We also know the dimensions of the
  // rectangles.
  const clientRect = new PSPDFKit.Geometry.Rect({
    width: 220,
    height: 50,
    left: isInternalDrop ? (event as DragEvent).clientX : clickEventLeft, // (pageInfo as PageInfo).width / 2 - 220 / 2,
    top: isInternalDrop ? (event as DragEvent).clientY : clickEventTop
  });
  const pageRect = (
    instance.value as Instance
  ).transformContentClientToPageSpace(clientRect, pageIndex as number);

  // We generate text data with a string that either prefixes `pspdfkit/text` or
  // `pspdfkit/image`.
  const selectedTool: any = isInternalDrop
    ? JSON.parse((event as DragEvent).dataTransfer?.getData('tool') as string)
    : tool;
  const isTextAnnTool = selectedTool.type === 'TextAnnotation';
  let requestedToData: any;
  if (requestedTo.value) {
    const { firstName, lastName, email, id } = toRaw(requestedTo.value);
    requestedToData = { firstName, lastName, email, id };
  }

  if (isTextAnnTool) {
    usePSPDFKit(instance.value as Instance).createTextAnnotation({
      pageRect: pageRect as Rect,
      pageIndex: pageIndex as number,
      label: selectedTool.label || selectedTool.name,
      fieldName: selectedTool.toolName,
      textValue: selectedTool.value,
      customData: {
        allowedUsers: [currentUser.value?.id],
        creatorId: currentUser.value?.id,
        creatorName: fullName(currentUser.value as FullNameObj),
        customCreatedAt: dayjs().toDate()
      }
    });
  }
  else {
    usePSPDFKit(instance.value as Instance).createFormField({
      pageRect: pageRect as Rect,
      pageIndex: pageIndex as number,
      formField:
        selectedTool?.type === 'DateFormField'
          ? 'TextFormField'
          : selectedTool?.type,
      isDateField: selectedTool?.type === 'DateFormField',
      value:
        selectedTool?.type === 'DateFormField'
          ? dayjs().format('MM/DD/YYYY')
          : selectedTool?.type === 'TextFormField'
            ? ''
            : '',
      customData:
        selectedTool?.name === 'Signature'
          ? {
              allowedUsers: [requestedTo.value?.id, currentUser.value?.id],
              creatorId: currentUser.value?.id,
              creatorName: fullName(currentUser.value as FullNameObj),
              customCreatedAt: dayjs().toDate(),
              requestedTo: requestedToData
            }
          : {
              allowedUsers: [currentUser.value?.id],
              creatorId: currentUser.value?.id,
              creatorName: fullName(currentUser.value as FullNameObj),
              customCreatedAt: dayjs().toDate()
            }
    });
  }
  event.preventDefault();
}

// Event handler for preparing drag and drop
function setDragData(event: DragEvent, tool: AnnotationToolType) {
  isDragAndDropSupported = true;
  event.dataTransfer?.setData(
    'text',
    `pspdfkit/text:${(event.target as HTMLElement).textContent}`
  );
  event.dataTransfer?.setData('tool', JSON.stringify(tool));
  event.dataTransfer?.setDragImage
  && event.dataTransfer.setDragImage(event.target as Element, 0, 0);
  event.stopPropagation();
}

// The annotation tooltip can be used to place annotation tools directly on top
// of the annotation on screen.
//
// In this example, we use it as an alternative to the default annotation
// toolbars.
//
// https://web-examples.pspdfkit.com/tooltips
function annotationTooltipCallback(annotation: Annotation) {
  const deleteAnnotation = {
    type: 'custom',
    title: 'Delete',
    onPress: async () => {
      prepareRemoveAnnotation(annotation, instance.value as Instance);
    }
  };

  return annotation.isSignature
    && annotation.customData?.creatorId === currentUser.value?.id
    ? [deleteAnnotation]
    : [];
}

function closestByClass(el: any, className: string): any {
  return el && el.classList && el.classList.contains(className)
    ? el
    : el
      ? closestByClass(el?.parentNode, className)
      : null;
}

function goBack(step?: string) {
  if (isWebformProp?.value && !step) {
    emits('back');
    return;
  }
  signReqIdProp?.value || signReqIdQuery.value
    ? handleStep('eSignature')
    : step
      ? handleStep(step)
      : handleStep('Documents');
  if (isPortalUser.value) {
    signReqIdProp?.value || signReqIdQuery.value
      ? router.push({ name: 'portal-documents', query: { activeIndex: 1 } })
      : router.push({ name: 'portal-documents' });
  }
}

function openPrevious() {
  let queryParams;
  if (props.isSignDoc || isSignDocQuery.value) {
    queryParams = {
      ...route.query,
      signReqId: previousAndNextFileIds.value.previousId,
      fileId: signIds.value.find(
        (item: { id: string; fileId: string }) =>
          item.id === previousAndNextFileIds.value.previousId
      ).fileId,
      isESignWebform: `${!!(signIds.value.find(
        (item: { id: string; fileId: string; webform: { id: string; name: string } }) =>
          item.id === previousAndNextFileIds.value.previousId
      ).webform)}`
    };
  }
  else {
    queryParams = {
      ...route.query,
      fileId: previousAndNextFileIds.value.previousId
    };
  }
  router.push({
    query: { ...queryParams }
  });
}
function openNext() {
  let queryParams;
  if (props.isSignDoc || isSignDocQuery.value) {
    queryParams = {
      ...route.query,
      signReqId: previousAndNextFileIds.value.nextId,
      fileId: signIds.value.find(
        (item: { id: string; fileId: string }) =>
          item.id === previousAndNextFileIds.value.nextId
      ).fileId,
      isESignWebform: `${!!(signIds.value.find(
        (item: { id: string; fileId: string; webform: { id: string; name: string } }) =>
          item.id === previousAndNextFileIds.value.nextId
      ).webform)}`
    };
  }
  else {
    queryParams = {
      ...route.query,
      fileId: previousAndNextFileIds.value.nextId
    };
  }
  router.push({
    query: { ...queryParams }
  });
}

function openDocument(event: any) {
  if (!isFalsy(selectedFile.value.filename)) {
    selectedFile.value = undefined;
  }
  if (selectedFile.value && selectedFile.value.startsWith('blob:')) {
    window.URL.revokeObjectURL(selectedFile.value);
  }
  selectedFilename.value = getFilename(event.target.files[0].name);
  selectedFile.value = window.URL.createObjectURL(event.target.files[0]);
}

const tools = ref<AnnotationToolType[]>([
  {
    type: 'SignatureFormField',
    name: 'Signature',
    icon: 'tabler:signature'
  },
  { type: 'DateFormField', name: 'Date', icon: 'uiw:date' },
  { type: 'TextFormField', name: 'Text', icon: 'eva:message-square-outline' }
  /* {
    type: 'TextAnnotation',
    name: 'Form Field',
  }, */
]);

const fieldsTools = computed(() => {
  if (webformDetails?.value) {
    const webformSchema = webformDetails?.value?.schema;
    const updatedSchema: any = {};
    for (const key in webformSchema) {
      if (webformSchema[key].type !== 'static') {
        updatedSchema[key] = {
          ...webformSchema[key],
          type: 'TextAnnotation',
          toolName: key
        };
      }
    }
    return updatedSchema;
  }
  return {};
});

const downloadButton = {
  type: 'custom',
  id: 'download-pdf',
  icon: '/images/icons/download.svg',
  title: 'Download',
  onPress: async () => {
    instance.value?.exportPDF().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const fileName = selectedFile.value?.filename;
      const objectUrl = URL.createObjectURL(blob);
      downloadFileAs(objectUrl, fileName);
    });
  }
};

const toolsToRemove = [
  'sidebar-thumbnails',
  'sidebar-document-outline',
  'sidebar-annotations',
  'sidebar-bookmarks',
  'pager',
  'pan',
  'zoom-out',
  'zoom-in',
  'zoom-mode',
  'spacer',
  'note',
  'search',
  'text'
];
if (!isPortalUser.value) {
  toolsToRemove.push('print');
}
const items = [...PSPDFKit.defaultToolbarItems].filter(tool =>
  toolsToRemove.includes(tool.type)
);
/* const items = [
  ...PSPDFKit.defaultToolbarItems,
  {
    type: 'form-creator',
  },
]; */
const formCreatorTool: { readonly type: 'form-creator' } = {
  type: 'form-creator'
};
// console.log(PSPDFKit.defaultToolbarItems);
// Add the download button to the toolbar.
if (!isPortalUser.value && isSignDocument.value) {
  items.push(formCreatorTool as unknown as { readonly type: 'debug' });
}
if (!isPortalUser.value) {
  items.push(downloadButton as unknown as { readonly type: 'debug' });
}

let observer: MutationObserver;

function isAllowedUser(annotation: AnnotationsUnion) {
  const isSignatureAnnotation = annotation?.isSignature;
  if (isPortalUser.value) {
    return isSignatureAnnotation
      ? false
      : (annotation?.customData?.allowedUsers as any[])?.includes(
          currentUser.value?.id
        );
  }
  else {
    return isSignatureAnnotation
      ? false
      : currentUser.value?.isOwner
      || (annotation?.customData?.allowedUsers as any[])?.includes(
        currentUser.value?.id
      );
  }
}

function findSignatureFieldId(annotation: AnnotationsUnion) {
  return fileSignatureData.value?.signatures?.find((signature: any) => {
    return signature.referenceId === annotation.name;
  })?.id;
}
function findInkSignatureAnnotation(annotation: AnnotationsUnion) {
  const inkAnnotations
    = fileSignatureData.value?.documentMeta?.instantJSON?.annotations?.filter(
      (ann: any) => ann.isSignature
    );
  return inkAnnotations?.find((inkAnnotation: any) => {
    return inkAnnotation.name === annotation.name;
  })?.id;
}

async function findFormField(annotation: AnnotationsUnion,
  instantallJSON: InstantJSON) {
  return instantallJSON?.formFields?.find(
    (formField: any) => formField.name === annotation.name
  );
}

async function loadPSPDFKit() {
  if (
    !selectedFile.value
    || loadingFile.value
    || loadingSignature.value
    || fetchingSignature.value
    || fetchingPspdfkitData.value
  )
    return;
  if (
    (props.isSignDoc || isSignDocQuery.value)
    && isFalsy(fileInstantJSON.value)
  ) {
    return;
  }
  const baseUrl = `${window.location.protocol}//${window.location.host}/js/`;

  const initialViewState = new PSPDFKit.ViewState({
    // showToolbar: !isSignDocument.value,
    enableAnnotationToolbar: false
  });

  const customRenderers = {
    Annotation: ({ annotation }: { annotation: AnnotationsUnion }) => {
      let isSignatureWidgetFound = false;
      getSignatureWidgetOfSign(
        instance.value as Instance,
        annotation as InkAnnotation
      )
        .then((signatureWidget) => {
          // console.log(signatureWidget);
          isSignatureWidgetFound = !!signatureWidget;
        })
        .catch((error) => {
          console.log(error);
        });

      const customNode = document.createElement('div');
      customNode.style.cssText = `
        font-family: Helvetica, sans-serif !important;
        font-size: 0.75rem !important;
        line-height: 1.25 !important;
        font-weight: 600 !important;
        text-align: left !important;
        color: rgba(79, 79, 79, 1) !important;
        position: absolute !important;
        left: 0 !important;
        top: -20px !important;
        white-space: nowrap !important;
      `;
      customNode.classList.add('custom-widget-renderer');

      const isSignAnnotation
        = annotation instanceof PSPDFKit.Annotations.Annotation
        && annotation.isSignature;
      const isSignatureWidget
        = annotation instanceof PSPDFKit.Annotations.WidgetAnnotation
        && annotation.name?.toLowerCase().startsWith('signature');

      let customRendererContent = '';
      // customRendererContent = `
      //         ${fullName(
      //           annotation.customData?.requestedTo as Partial<FullNameObj>
      //         )}`;
      if (isSignAnnotation) {
        customRendererContent = ``;
      }
      if (isSignatureWidget || isSignAnnotation) {
        if (isSignAnnotation) {
          customNode.classList.add('sign-annotation');
          customNode.style.cssText = `
            top: unset !important;
            bottom: -20px !important;
          `;
        }
        else {
          customNode.classList.remove('sign-annotation');
        }

        customNode.setAttribute('data-annotation-id', annotation.id);
        customNode.innerHTML = customRendererContent;
        return {
          node: customNode,
          append: true, // Replace the entire note annotation UI if it set to false.
          noZoom: false
        };
      }
      else {
        return null;
      }
    }
  };

  const isEditableAnnotation = (annotation: AnnotationsUnion) => {
    return isAllowedUser(annotation);
  };

  nextTick(async () => {
    const emptyInstantJSON = {
      format: 'https://pspdfkit.com/instant-json/v1',
      annotations: [],
      attachments: {},
      formFields: [],
      formFieldValues: [],
      bookmarks: [],
      skippedPdfObjectIds: []
    } as ExtractedType<StandaloneConfiguration, 'instantJSON'>;
    pdfcontainer.value && PSPDFKit.unload(pdfcontainer.value);

    const pspdfkitConfig: StandaloneConfiguration = {
      licenseKey: pspdfkitData.value?.data?.licenseKey,
      isEditableAnnotation,
      electronicSignatures: {
        // creationModes: ['DRAW'],
      },
      // customRenderers: customRenderers,
      instantJSON: toRaw(fileInstantJSON.value) || undefined,
      enableClipboardActions: true,
      enableHistory: true,
      styleSheets: ['/styles/pspdfkit-custom-style.css'],
      baseUrl,
      container: '.pdf-container' || pdfcontainer.value!,
      document:
        fileIdProp?.value && typeof selectedFile.value.link === 'string'
          ? selectedFile.value.link
          : selectedFile.value || '/document.pdf',
      toolbarItems: [...items],

      initialViewState,
      annotationTooltipCallback: annotationTooltipCallback as any,
      enableRichText: () => true
    };

    PSPDFKit.load(pspdfkitConfig).then(async (_instance: Instance) => {
      instance.value = _instance;

      // Hide PSPDFKit-Toolbar

      pspdfkitToolbar.value = _instance.contentDocument.querySelector(
        '.PSPDFKit-Toolbar'
      ) as HTMLElement;
      pspdfkitFormCreator.value = _instance.contentDocument.querySelector(
        '.PSPDFKit-Toolbar-Button-Form-Creator'
      ) as HTMLElement;

      if (isSignDocument.value || isWebformProp.value) {
        (pspdfkitToolbar.value as HTMLElement).style.display = 'none';
      }
      const getAllAnnotations = async () => {
        const pagesAnnotations = await Promise.all(
          Array.from({ length: _instance.totalPageCount }).map((_, pageIndex) =>
            _instance.getAnnotations(pageIndex)
          )
        );

        const allAnnotationsJSON = pagesAnnotations
          .map(pageList => pageList.toJS())
          .flat();
        const allAnnotations = pagesAnnotations
          .map(pageList => pageList)
          .flat();

        return { allAnnotations, allAnnotationsJSON };
      };

      const {
        allAnnotationsJSON: instanceAllAnnotationsJSON,
        allAnnotations: instanceAllAnnotations
      } = await getAllAnnotations();
      // console.log('instanceAllAnnotationsJSON', instanceAllAnnotationsJSON);

      const instanceFormFields = await _instance.getFormFields();

      /* if (instanceFormFields.size > 0) {
      } */
      const updatedFormFields = instanceFormFields.map((formField: any) => {
        const foundAnnotation = instanceAllAnnotationsJSON?.find(
          (annotation: any): any => annotation.name === formField.name
        ) as any;
        const isReadOnly = !isAllowedUser(foundAnnotation);

        return formField.set('readOnly', isReadOnly);
      });

      const readOnlyInkAnnotationsIds = instanceAllAnnotationsJSON
        .filter((ann: any) => ann.isSignature)
        .map((annotation: any) => ({
          ...annotation,
          readOnly: !isAllowedUser(annotation)
        }))
        .filter((annotation: any) => annotation.readOnly)
        .map((item: any) => item.name.split('_').pop());

      const readOnlyformFieldIds = updatedFormFields
        .filter((formField: any) => formField.readOnly)
        .map((formField: any) => formField.name.split('_').pop());

      await _instance.update(updatedFormFields);
      // await _instance.update(updatedAnnotations);

      // Assuming you have a parent element that always exists in the DOM
      const parentElement = _instance.contentDocument.querySelector(
        '.PSPDFKit-Form-Creator-Editor'
      ); // Replace 'parentElementId' with the actual ID of your parent element

      // Add an event listener to the parent element using event delegation
      parentElement?.addEventListener('click', (event) => {
        const targetElement = event.target; // The clicked element that triggered the event

        // Check if the clicked element meets your condition
        if (
          (targetElement as Element)?.classList.contains(
            'PSPDFKit-Form-Creator-Editor-Done'
          )
        ) {
          // Your custom event handling code here
          // console.log('Custom event fired for the dynamic element');
        }
      });

      const updateAnnotationsDOM = async () => {
        if (!(readOnlyformFieldIds.size + readOnlyInkAnnotationsIds.length))
          return;
        [...readOnlyformFieldIds, ...readOnlyInkAnnotationsIds].forEach(
          (id) => {
            const elementsWithMatchingId
              = _instance.contentDocument.querySelectorAll(
                `.PSPDFKit-Annotation[data-annotation-id*="${id}"]`
              );

            // console.log('elementsWithMatchingId', elementsWithMatchingId);

            elementsWithMatchingId.forEach((element) => {
              element.classList.add('PSPDFKit-Annotation-Widget-read-only');
            });
          }
        );
      };
      const disableRequiredFieldsChange = async () => {
        const isIE11 = navigator.userAgent.includes('Trident/');
        const formCreatorEditor = _instance.contentDocument.querySelector(
          '.PSPDFKit-Form-Creator-Editor'
        );
        const formCreatorSubmitEl = _instance.contentDocument.querySelector(
          '.PSPDFKit-Form-Creator-Editor-Done'
        );

        (formCreatorSubmitEl as Element)?.addEventListener(
          'click',
          () => {
            isEditingForm.value && toggleFormEdit();
          },
          isIE11
            ? {
                capture: true
              }
            : true
        );

        const disableRequiredInputs = (editorEl: HTMLElement) => {
          // Get all label elements in the document
          const labelElements = editorEl.querySelectorAll('label');
          const inputsToDisable = [
            'Form Field Name*',
            'Creator Name',
            'Custom Data'
          ];

          // Loop through the label elements and add their text content as a data attribute
          labelElements.forEach((label) => {
            const labelText = label.textContent?.trim(); // Trim to remove leading/trailing white spaces
            label.setAttribute('data-label-text', labelText as string);
          });

          labelElements.forEach((label) => {
            const labelText = label.getAttribute('data-label-text');
            if (inputsToDisable.includes(labelText as string)) {
              // Found a matching label, get the associated input and disable it
              const input = label.querySelector('input');
              if (input) {
                input.disabled = true;
              }
            }
          });
        };
        if (formCreatorEditor) {
          disableRequiredInputs(formCreatorEditor as HTMLElement);
        }
      };
      const config = { attributes: true, childList: true, subtree: true };
      const element = _instance.contentDocument.querySelector(
        '.PSPDFKit-Viewport'
      ) as Element;

      const mutationCallback = (
        mutationList: MutationRecord[],
        observer: any
      ) => {
        for (const mutation of mutationList) {
          if (
            mutation.type === 'childList'
            || (mutation.type === 'attributes'
            && mutation.attributeName === 'data-page-is-loaded')
          ) {
            updateAnnotationsDOM();
            const removeDialogEl = (
              _instance.contentDocument.querySelector(
                '.PSPDFKit-Confirm-Dialog'
              ) as HTMLElement
            )?.parentElement;
            if (removeDialogEl) {
              removeDialogEl.style.cssText = `
                display: none !important;
              `;
            }
            const isEditingEl = _instance.contentDocument.querySelector(
              '[contenteditable=true]'
            );
            if (isEditingEl) {
              // console.log('remove editing..');
              // _instance.setEditingAnnotation(null);
            }
          }

          if (mutation.type === 'childList' && isEditingForm.value) {
            disableRequiredFieldsChange();
          }
        }
      };
      observer = new MutationObserver(mutationCallback);
      observer.observe(element, config);

      const handleAnnotationsChange = async () => {
        const instantallJSON = await instance.value?.exportInstantJSON();
        // console.log('installJSON: ', instantallJSON);
        getAllAnnotations().then(({ allAnnotationsJSON }) => {
          const validAnnotations = allAnnotationsJSON.filter(
            (annotation: Annotation) => annotation.name
          );
          // console.log(validAnnotations);
          isAllSignForCurrentUser.value = !!(
            validAnnotations.filter(
              (ann: Annotation) => ann.name?.startsWith('Signature')
            ).length
            && validAnnotations
              .filter((ann: Annotation) => ann.name?.startsWith('Signature'))
              .every(
                t =>
                  t.customData?.allowedUsers?.filter(
                    (u: string) => u !== currentUser.value?.id
                  ).length === 0
              )
          );

          totalAnnotations.value = validAnnotations.length;
          if (validAnnotations.length === 0) {
            (instance.value as Instance).setViewState(viewState =>
              viewState.set('formDesignMode', false)
            );
            isEditingForm.value = false;
          }
        });
      };

      const handleAnnotationsCreate = async (
        annotations: List<AnnotationsUnion>
      ) => {
        const annotation = annotations.first() as AnnotationsUnion;
        // console.log(annotation);
        // annotation.pdfObjectId = PSPDFKit.generateInstantId();

        const isSignatureAnnotation = annotation.isSignature;
        const isInkAnnotation
          = annotation instanceof PSPDFKit.Annotations.InkAnnotation;
        const isImageAnnotation
          = annotation instanceof PSPDFKit.Annotations.ImageAnnotation;
        const isSignatureWidget
          = annotation instanceof PSPDFKit.Annotations.WidgetAnnotation
          && annotation.name?.toLowerCase().startsWith('signature');

        if (isSignatureAnnotation || isSignatureWidget) {
          const overlappingSignatureWidget: AnnotationsUnion | null
            = (await getSignatureWidgetOfSign(
              _instance,
              annotation
            )) as unknown as AnnotationsUnion;
          // console.log('respectiveSignWidget', overlappingSignatureWidget);

          if (overlappingSignatureWidget) {
            // const ipAddresses = await getIpAddresses();
            const newSize = fitIn(
              {
                width: annotation.boundingBox.width,
                height: annotation.boundingBox.height
              },
              {
                width: overlappingSignatureWidget.boundingBox.width,
                height: overlappingSignatureWidget.boundingBox.height
              }
            );
            const newLeft = isSignatureAnnotation
              ? overlappingSignatureWidget.boundingBox.left
              : overlappingSignatureWidget.boundingBox.left
              + overlappingSignatureWidget.boundingBox.width / 2
              - newSize.width / 2;
            const newTop = isSignatureAnnotation
              ? overlappingSignatureWidget.boundingBox.top
              + overlappingSignatureWidget.boundingBox.height
              + 5
              : overlappingSignatureWidget.boundingBox.top - 15;
            const newBoundingBox = new PSPDFKit.Geometry.Rect({
              left: newLeft,
              top: newTop,
              width: overlappingSignatureWidget.boundingBox.width,
              height: 20
            });
            const updatedAnnotation = annotation
              // .set('boundingBox', newBoundingBox)
              // .set('lines', newLines)
              // .set('lineWidth', annotation.lineWidth * resizeRatio)
              .set('creatorName', overlappingSignatureWidget.creatorName)
              .set('customData', {
                ...overlappingSignatureWidget.customData
              })
              .set('name', overlappingSignatureWidget.name);

            const updatedOverlappingSignatureWidget = overlappingSignatureWidget
              // .set('customData', {
              //   ...overlappingSignatureWidget.customData,
              //   requestedTo: null,
              // })
              .set('updatedAt', dayjs().toDate());

            await _instance.update(updatedAnnotation);
            await _instance.update(updatedOverlappingSignatureWidget);

            // Ensure the changes are saved
            const [savedAnnotation] = await _instance.ensureChangesSaved([
              updatedAnnotation
            ]);

            // console.log('updatedAnnotation', updatedAnnotation.toJS());

            const foundSignatureFieldId
              = findSignatureFieldId(updatedAnnotation as AnnotationsUnion)
              || findSignatureFieldId(overlappingSignatureWidget);

            const originalInstanceAnn = async () => {
              const allInstantJSON = await _instance.exportInstantJSON();
              let foundAnnotation = (allInstantJSON.annotations as any[]).find(
                (ann: AnnotationsUnion) => {
                  return (
                    ann.isSignature
                    && (ann.name === updatedAnnotation.name
                    || ann.id === updatedAnnotation.id)
                  );
                }
              ) as any;
              if (isImageAnnotation) {
                // console.log('foundAnnotation', foundAnnotation);

                const foundAttachment = Object.keys(
                  allInstantJSON.attachments as any
                ).find((att: any) => foundAnnotation.imageAttachmentId === att);
                const foundFormField = (
                  await _instance.exportInstantJSON()
                ).formFields?.find(
                  (formField: any) =>
                    formField.name === foundAnnotation.name
                    || formField.name === updatedAnnotation.name
                    || formField.formFieldname === foundAnnotation.name
                    || formField.formFieldname === updatedAnnotation.name
                );
                // console.log('foundformfield', foundFormField);

                // allInstantJSON.formFields?.find(
                //   (formField: any) => formField.name === foundAnnotation.name
                // );
                if (foundAttachment) {
                  const newImageId = `${foundFormField?.pdfObjectId}`;
                  foundAnnotation = {
                    ...foundAnnotation,
                    attachmentData: {
                      [`${foundAttachment}`]: (
                        allInstantJSON.attachments as any
                      )[foundAttachment]
                    }
                    // imageAttachmentId: foundAttachment,
                  };
                }
              }
              return foundAnnotation;
            };

            const orgInstanceAnn = await originalInstanceAnn();
            // console.log(orgInstanceAnn);

            const signatureJSON: any = {
              ...orgInstanceAnn,
              name: (updatedAnnotation as AnnotationsUnion).name,
              customData: (updatedAnnotation as AnnotationsUnion).customData
            };

            const signaturePayload: CreateDocumentSignaturePayload = {
              id: foundSignatureFieldId as string,
              referenceId: (updatedAnnotation as AnnotationsUnion)
                .name as string,
              fileId: fileIdQuery.value as string,
              requestedToId: (overlappingSignatureWidget as any)?.customData
                ?.requestedTo?.id as string,
              signatureMeta: signatureJSON
            };

            if (isSignatureWidget || isSignatureAnnotation) {
              const classText = isSignatureAnnotation
                ? 'custom-widget-renderer sign-annotation'
                : 'custom-widget-renderer';
              const textAnnotation = new PSPDFKit.Annotations.TextAnnotation({
                pageIndex: overlappingSignatureWidget.pageIndex,
                boundingBox: newBoundingBox,
                locked: true,
                fontSize: 12,
                font: 'Helvetica, sans-serif ',
                horizontalAlign: 'left',
                name: isSignatureAnnotation
                  ? `SignedAt-${updatedAnnotation.name}`
                  : `RequestedTo-${updatedAnnotation.name}`,
                text: {
                  format: 'xhtml',
                  value: `<p><span class="${classText}" style="font-family: Helvetica, sans-serif !important; font-size: 0.75rem !important; line-height: 1.25 !important; font-weight: 600 !important; text-align: left !important; position: absolute !important; left: 0 !important; top: 0px !important; white-space: nowrap !important; color: rgba(79, 79, 79, 1) !important;">${
                    isSignatureAnnotation
                      ? dayjs(updatedAnnotation?.updatedAt).year() === 1970
                        ? dayjs(
                            `${updatedAnnotation?.customData?.customCreatedAt}`
                          ).format('MMM-D-YYYY hh:mm:ss A')
                        : dayjs(updatedAnnotation?.updatedAt).format(
                            'MMM-D-YYYY hh:mm:ss A'
                          )
                      : fullName(
                          updatedAnnotation.customData
                            ?.requestedTo as Partial<FullNameObj>
                        )
                  }</span></p>`
                }
              });
              await _instance
                .create(textAnnotation)
                .then(async (annotations) => {
                  // console.log('text annotation', annotations[0]);
                  const allInstantJSON = await _instance.exportInstantJSON();
                  const foundTextAnn = (
                    allInstantJSON.annotations as any[]
                  ).find(
                    (ann: AnnotationsUnion) =>
                      ann.name === `SignedAt-${signatureJSON.name}`
                  );
                  const allRelatedAnns = (
                    allInstantJSON.annotations as any[]
                  ).filter(
                    (ann: AnnotationsUnion) =>
                      !ann.isSignature
                      && (ann.name?.includes(signatureJSON.name)
                      || ann.formFieldName?.includes(signatureJSON.name))
                  );
                  const { signatureData, ...signatureMetaData } = signatureJSON;
                  if (foundTextAnn && allRelatedAnns.length) {
                    signatureJSON.signatureData = [
                      ...allRelatedAnns,
                      signatureMetaData
                    ];
                  }
                });
            }

            if (isSignatureAnnotation && signaturePayload.id) {
              await addUpdateDocSign({
                id: signReqIdQuery.value as string,
                signatureId: foundSignatureFieldId as string,
                payload: signaturePayload
              });
            }

            // overlappingSignatureWidget = null;
          }
          else {
            // _instance.update(annotation.set('creatorName', 'test-name'));
          }
        }
      };

      const handleAnnotationsWillChange = async (event: {
        reason: AnnotationsWillChangeReason;
        annotations: List<AnnotationsUnion>;
      }) => {
        const annotation = event.annotations.get(0);
        const isSignatureAnnotation = annotation?.isSignature;
        const isInkAnnotation
          = annotation instanceof PSPDFKit.Annotations.InkAnnotation;
        const isImageAnnotation
          = annotation instanceof PSPDFKit.Annotations.ImageAnnotation;
        const isSignatureWidget
          = annotation instanceof PSPDFKit.Annotations.WidgetAnnotation
          && annotation.name?.toLowerCase().startsWith('signature');

        let overlappingSignatureWidget: AnnotationsUnion | null = null;

        if (event.reason === PSPDFKit.AnnotationsWillChangeReason.SELECT_START) {
          // console.log('changing ann: ', annotation);
        }

        if (
          event.reason !== PSPDFKit.AnnotationsWillChangeReason.SELECT_START
          && (isSignatureAnnotation || isSignatureWidget)
        ) {
          overlappingSignatureWidget = (await getSignatureWidgetOfSign(
            _instance,
            annotation
          )) as unknown as AnnotationsUnion;
          // console.log('respectiveSignWidget', overlappingSignatureWidget);
          const { allAnnotations: instanceAllAnnotations }
            = await getAllAnnotations();
          const validAnnotations = (instanceAllAnnotations as any[]).filter(
            (item: any) => item.size
          );

          /* const foundTextAnns = instanceAllAnnotations[0]?.filter(
            (ann: AnnotationsUnion) =>
              ann.name === `SignedAt-${annotation?.name}` ||
              ann.name === `RequestedTo-${annotation?.name}`
          ); */
          let textAnnotations: any = null;
          for (const ann of validAnnotations) {
            const foundTextAnnotation = (ann as any[]).filter(
              (ann: AnnotationsUnion) =>
                ann.name === `RequestedTo-${annotation?.name}`
            );
            if (foundTextAnnotation && (foundTextAnnotation as any).size) {
              textAnnotations = foundTextAnnotation;
            }
          }

          if (overlappingSignatureWidget) {
            const getNewBoundingBox = (
              item: AnnotationsUnion,
              signWidget: AnnotationsUnion,
              isSign = false
            ) => {
              const newSize = fitIn(
                {
                  width: isSign
                    ? signWidget.boundingBox.width
                    : annotation.boundingBox.width,
                  height: isSign
                    ? signWidget.boundingBox.height
                    : annotation.boundingBox.height
                },
                {
                  width: signWidget.boundingBox.width,
                  height: signWidget.boundingBox.height
                }
              );
              const newLeft = isSign
                ? item.boundingBox.left
                - (newSize.width / 2 - item.boundingBox.width / 2)
                : item.name?.includes('SignedAt')
                || item.name?.includes('RequestedTo')
                  ? signWidget.boundingBox.left
                  : signWidget.boundingBox.left
                  + signWidget.boundingBox.width / 2
                  - newSize.width / 2;
              const newTop = isSign
                ? item.boundingBox.top
                : item.name?.includes('SignedAt')
                  ? signWidget.boundingBox.top + signWidget.boundingBox.height + 5
                  : item.name?.includes('RequestedTo')
                    ? signWidget.boundingBox.top - 15
                    : signWidget.boundingBox.top;
              const newBoundingBox = new PSPDFKit.Geometry.Rect({
                left: newLeft,
                top: newTop,
                width: isSign
                  ? signWidget.boundingBox.width
                  : item.name?.includes('RequestedTo')
                  || item.name?.includes('SignedAt')
                    ? signWidget.boundingBox.width
                    : newSize.width,
                height: isSign
                  ? signWidget.boundingBox.height
                  : item.name?.includes('RequestedTo')
                  || item.name?.includes('SignedAt')
                    ? 20
                    : newSize.height
              });

              return newBoundingBox;
            };

            if (textAnnotations) {
              if (isSignatureWidget) {
                const updatedTextAnns = textAnnotations.map(
                  (item: AnnotationsUnion) => {
                    return item.set(
                      'boundingBox',
                      getNewBoundingBox(
                        item,
                        overlappingSignatureWidget as AnnotationsUnion
                      )
                    );
                  }
                );

                await _instance.update(updatedTextAnns);
                if (
                  event.reason === PSPDFKit.AnnotationsWillChangeReason.MOVE_END
                ) {
                  useTimeoutFn(async () => {
                    overlappingSignatureWidget
                      = (await getSignatureWidgetOfSign(
                        _instance,
                        annotation
                      )) as unknown as AnnotationsUnion;
                    const signOfWidget = (await getSignatureOfWidget(
                      _instance,
                      overlappingSignatureWidget
                    )) as unknown as AnnotationsUnion;

                    // console.log('signOfWidget', signOfWidget);

                    const newSize = fitIn(
                      {
                        width: signOfWidget?.boundingBox.width,
                        height: signOfWidget?.boundingBox.height
                      },
                      {
                        width: overlappingSignatureWidget.boundingBox.width,
                        height: overlappingSignatureWidget.boundingBox.height
                      }
                    );
                    const resizeRatio
                      = newSize.width / signOfWidget?.boundingBox.width;
                    const newLeft
                      = overlappingSignatureWidget.boundingBox.left
                      + overlappingSignatureWidget.boundingBox.width / 2
                      - newSize.width / 2;
                    const newTop
                      = overlappingSignatureWidget.boundingBox.top
                      + overlappingSignatureWidget.boundingBox.height / 2
                      - newSize.height / 2;
                    const newLines
                      = signOfWidget?.lines
                      && signOfWidget?.lines.map((line: any[]) => {
                        return line.map((point: any) => {
                          return new PSPDFKit.Geometry.DrawingPoint({
                            x:
                              newLeft
                              + (point.x - signOfWidget?.boundingBox.left)
                              * resizeRatio,
                            y:
                              newTop
                              + (point.y - signOfWidget?.boundingBox.top)
                              * resizeRatio
                          });
                        });
                      });
                    const newBoundingBox = new PSPDFKit.Geometry.Rect({
                      left: newLeft,
                      top: newTop,
                      width: newSize.width,
                      height: newSize.height
                    });

                    if (signOfWidget) {
                      const updatedSign = signOfWidget
                        .set('boundingBox', newBoundingBox)
                        .set('lines', newLines);

                      await _instance.update(updatedSign);
                    }
                  }, 0);
                }
              }
              else if (isSignatureAnnotation) {
                const updatedAnnotation = overlappingSignatureWidget.set(
                  'boundingBox',
                  getNewBoundingBox(
                    annotation as AnnotationsUnion,
                    overlappingSignatureWidget,
                    true
                  )
                );

                await _instance.update(updatedAnnotation);
                if (
                  event.reason === PSPDFKit.AnnotationsWillChangeReason.MOVE_END
                ) {
                  useTimeoutFn(async () => {
                    overlappingSignatureWidget
                      = (await getSignatureWidgetOfSign(
                        _instance,
                        annotation
                      )) as unknown as AnnotationsUnion;
                    const updatedTextAnns = textAnnotations.map(
                      (item: AnnotationsUnion) => {
                        return item.set(
                          'boundingBox',
                          getNewBoundingBox(
                            item,
                            overlappingSignatureWidget as AnnotationsUnion
                          )
                        );
                      }
                    );

                    await _instance.update(updatedTextAnns);
                  }, 0);
                }
              }
            }
            /* else {
              const textAnnotation = new PSPDFKit.Annotations.TextAnnotation({
                pageIndex: overlappingSignatureWidget.pageIndex,
                boundingBox: getNewBoundingBox(
                  annotation,
                  overlappingSignatureWidget as AnnotationsUnion
                ),
                isEditable: false,
                readOnly: true,
                locked: true,
                lockedContents: true,
                fontSize: 12,
                font: 'Helvetica, sans-serif ',
                name: `RequestedTo-${annotation?.name}`,
                text: {
                  format: 'xhtml',
                  value: `<p>
                      <span style="font-family: Helvetica, sans-serif !important; font-size: 0.75rem !important; line-height: 1.25 !important; font-weight: 600 !important; text-align: left !important; position: absolute !important; left: 0 !important; top: 0px !important; white-space: nowrap !important; color: rgba(79, 79, 79, 1) !important;">
                        ${fullName(
                          annotation?.customData
                            ?.requestedTo as Partial<FullNameObj>
                        )}
                      </span>
                    </p>`,
                },
              });
              await _instance.create(textAnnotation);
            } */
          }
        }

        if (
          event.reason === PSPDFKit.AnnotationsWillChangeReason.DELETE_START
        ) {
          if (currentUser.value?.id !== annotation?.customData?.creatorId)
            return;
          prepareRemoveAnnotation(
            annotation as AnnotationsUnion,
            _instance as Instance
          );
          useTimeoutFn(() => {
            const dialogEl = _instance.contentDocument.querySelector(
              '.PSPDFKit-Modal-Backdrop'
            ) as HTMLElement;

            pspdfkitConfirmDialog.value = dialogEl;
          }, 0);
        }
      };
      const handleAnnotationsDelete = async (
        annotations: List<AnnotationsUnion>
      ) => {
        const annotation = annotations.first() as AnnotationsUnion;
        const isSignatureAnnotation = annotation.isSignature;
        const isSignatureFieldAnnotation
          = !isSignatureAnnotation
          && (annotation as any).name?.toLowerCase().startsWith('signature');

        const { allAnnotations: instanceAllAnnotations }
          = await getAllAnnotations();
        // const allInstantJSON = await _instance.exportInstantJSON();
        const foundTextAnn = instanceAllAnnotations[0]?.find(
          (ann: AnnotationsUnion) =>
            ann.name
            === `${
              isSignatureAnnotation
                ? `SignedAt-${annotation?.name}`
                : `RequestedTo-${annotation?.name}`
            }`
        );

        if (foundTextAnn) {
          await _instance.delete(foundTextAnn);
        }

        if (isSignatureFieldAnnotation && findSignatureFieldId(annotation)) {
          signatureFieldRemoved.value = annotation;
          await removeDocSignField(findSignatureFieldId(annotation) as string);
          await onSubmit();
          signatureFieldRemoved.value = undefined;
        }
        if (isSignatureAnnotation) {
          /* const foundSignatureIndex = newSignatures.value.findIndex(
            (signAnn: AnnotationsUnion) => signAnn.name === annotation.name
          );
          const attachmentId =
            newSignatures.value[foundSignatureIndex]['imageAttachmentId'];
          if (!isFalsy(newSignAttachments.value)) {
            const attachments = toRaw(newSignAttachments.value);
            if (attachments[attachmentId] !== undefined) {
              delete attachments[attachmentId];
              newSignAttachments.value = attachments;
            }
          }
          newSignatures.value.splice(foundSignatureIndex, 1); */
          const overlappingSignatureWidget: AnnotationsUnion | null
            = (await getSignatureWidgetOfSign(
              _instance,
              annotation
            )) as unknown as AnnotationsUnion;

          if (
            findSignatureFieldId(annotation)
            || findSignatureFieldId(overlappingSignatureWidget)
          ) {
            const foundSignatureFieldId
              = findSignatureFieldId(annotation)
              || findSignatureFieldId(overlappingSignatureWidget);
            const signaturePayload: CreateDocumentSignaturePayload = {
              id: foundSignatureFieldId as string,
              referenceId: annotation.name as string,
              fileId: fileIdQuery.value as string,
              requestedToId: (annotation?.customData as any)?.requestedTo
                ?.id as string,
              signatureMeta: null
            };
            await addUpdateDocSign({
              id: signReqIdQuery.value as string,
              signatureId: foundSignatureFieldId as string,
              payload: signaturePayload
            });
          }
        }
      };
      const handleAnnotationsPress = async (event: AnnotationsPressEvent) => {
        // TODO:

        const annotation = event.annotation;
        const signOfWidget = (await getSignatureOfWidget(
          _instance,
          event.annotation
        )) as unknown as AnnotationsUnion;
        const isTextAnn
          = annotation instanceof PSPDFKit.Annotations.TextAnnotation;
        const isTextAnnLocked = annotation.locked;
        const isWidgetAnn
          = annotation instanceof PSPDFKit.Annotations.WidgetAnnotation;
        const stopPropagation = () =>
          event.nativeEvent.stopImmediatePropagation();

        const addEventListeners = () => {
          _instance.contentDocument?.addEventListener(
            'pointermove',
            stopPropagation,
            { capture: true }
          );
          _instance.contentDocument?.addEventListener(
            'mousemove',
            stopPropagation,
            {
              capture: true
            }
          );
          _instance.contentDocument?.addEventListener(
            'touchmove',
            stopPropagation,
            {
              capture: true
            }
          );
          _instance.contentDocument?.addEventListener(
            'keydown',
            stopPropagation,
            {
              capture: true
            }
          );
        };
        const removeEventListeners = () => {
          _instance.contentDocument?.removeEventListener(
            'pointermove',
            stopPropagation,
            { capture: true }
          );
          _instance.contentDocument?.removeEventListener(
            'mousemove',
            stopPropagation,
            {
              capture: true
            }
          );
          _instance.contentDocument?.removeEventListener(
            'touchmove',
            stopPropagation,
            {
              capture: true
            }
          );
          _instance.contentDocument?.removeEventListener(
            'keydown',
            stopPropagation,
            {
              capture: true
            }
          );
        };

        if (
          (annotation && isTextAnn && isTextAnnLocked)
          || (isWidgetAnn && signOfWidget)
        ) {
          _instance.setSelectedAnnotations(null);
          _instance.contentDocument?.addEventListener(
            'pointermove',
            stopPropagation,
            { capture: true }
          );
          _instance.contentDocument?.addEventListener(
            'mousemove',
            stopPropagation,
            {
              capture: true
            }
          );
          _instance.contentDocument?.addEventListener(
            'touchmove',
            stopPropagation,
            {
              capture: true
            }
          );
          _instance.contentDocument?.addEventListener(
            'keydown',
            stopPropagation,
            {
              capture: true
            }
          );
        }
        else {
          // removeEventListeners();
          _instance.contentDocument?.removeEventListener(
            'pointermove',
            stopPropagation,
            { capture: true }
          );
          _instance.contentDocument?.removeEventListener(
            'mousemove',
            stopPropagation,
            {
              capture: true
            }
          );
          _instance.contentDocument?.removeEventListener(
            'touchmove',
            stopPropagation,
            {
              capture: true
            }
          );
          _instance.contentDocument?.removeEventListener(
            'keydown',
            stopPropagation,
            {
              capture: true
            }
          );
        }

        if (isEditingForm.value) {
          useTimeoutFn(() => {
            // console.log('event.annotation', event.annotation);
            const formCreatorPopover = _instance.contentDocument.querySelector(
              '.PSPDFKit-Form-Creator-Popover'
            ) as HTMLElement;

            // console.log('formCreatorPopover', formCreatorPopover);

            if (signOfWidget && formCreatorPopover) {
              formCreatorPopover.style.cssText = `
                display: none !important;
              `;
              _instance.setSelectedAnnotations(null);
            }

            pspdfkitFormCreatorPopover.value = formCreatorPopover;
          }, 0);
        }
      };
      // Add the event listener to the instance
      _instance.addEventListener(
        'annotationSelection.change',
        (annotation: any) => {
          const isTextAnn
            = annotation instanceof PSPDFKit.Annotations.TextAnnotation;
          if (isTextAnn) {
            _instance.setViewState(viewState =>
              viewState.set('enableAnnotationToolbar', true)
            );
          }
          if (!annotation) {
            if (isEditingForm.value) {
              toggleFormEdit();
            }
            _instance.setViewState(viewState =>
              viewState.set('enableAnnotationToolbar', false)
            );
          }
        }
      );

      _instance.contentDocument.addEventListener('keydown', (event) => {
        // Check if the pressed key is Backspace (key code 8) or Delete (key code 46)
        // console.log(event.key);

        if (event.key === 'Backspace' || event.key === 'Delete') {
          // Prevent the default behavior of the Backspace or Delete key
          // event.stopImmediatePropagation();
          // event.preventDefault();
        }
      });

      _instance.addEventListener('annotations.create', handleAnnotationsCreate);
      _instance.addEventListener(
        'annotations.willChange',
        handleAnnotationsWillChange
      );
      _instance.addEventListener('annotations.change', handleAnnotationsChange);
      _instance.addEventListener('annotations.delete', handleAnnotationsDelete);
      _instance.addEventListener('annotations.press', handleAnnotationsPress);

      // We only allow dropping elements onto a PDF page.
      _instance.contentDocument.ondragover = function (event) {
        isDragAndDropSupported = true;

        const pageElement = closestByClass(event.target, 'PSPDFKit-Page');

        if (pageElement) {
          // Allow drop operation
          event.preventDefault();
        }
      };

      _instance.contentDocument.ondrop = function (event: DragEvent) {
        isDragAndDropSupported = true;

        const pageElement = closestByClass(event.target, 'PSPDFKit-Page');

        if (pageElement) {
          const pageIndex = Number.parseInt(pageElement.dataset.pageIndex);

          const isExternalDrop
            = (event.dataTransfer?.files as FileList).length > 0;

          if (isExternalDrop) {
            handleExternalDrop(event, pageIndex);
          }
          else {
            handleToolClickNDrop({
              event,
              isInternalDrop: true,
              dropIndex: pageIndex
            });
          }
        }
      };

      emits('loaded', instance.value);
    });
  });
}

async function handleDownload() {
  instance.value?.exportPDF().then((buffer) => {
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const fileName = `${title.value}.pdf`;
    const objectUrl = URL.createObjectURL(blob);
    downloadFileAs(objectUrl, fileName);
  });
}

async function handleWebformSubmission(sendToClient = false) {
  const previousInstantJSON = webformDetails?.value.documentMeta?.instantJSON;
  const annotationsJSON = await instance.value?.exportInstantJSON();
  emits('map-fields', {
    instantJSON: { ...previousInstantJSON, ...annotationsJSON },
    sendToClient
  });
}

function handleWebformFill() {
  emits('fill:webform', webformDetails?.value);
}

const onSubmit = handleSubmit(async (values) => {
  const annotationsJSON = await instance.value?.exportInstantJSON();
  const filterAnnJSON = (item: any) =>
    signatureFieldRemoved.value
      ? !(
          item.name?.includes(signatureFieldRemoved.value.name)
          || item.formFieldName?.includes(signatureFieldRemoved.value.name)
        )
      : item;
  const annotationsformFields = annotationsJSON?.formFields
    ?.map((formField: any) => ({
      ...formField,
      customData: annotationsJSON.annotations?.find(
        (annotation: any) => annotation.name === formField.name
      )?.customData
    }))
    .filter(filterAnnJSON);
  const allAnnotations = annotationsJSON?.annotations?.filter(filterAnnJSON);
  const signatureAnnotations = annotationsJSON?.annotations?.filter(
    (annotation: any) =>
      annotation.name?.startsWith('Signature') && !annotation.isSignature
  );
  const docSignatures = annotationsJSON?.annotations?.filter(
    (annotation: any) =>
      annotation.name?.startsWith('Signature') && annotation.isSignature
  );
  (docSignatures as any[]).forEach((item: any, index) => {
    // const obj2 = (docSignatures as any[])[index];
    const foundIndex = signatureAnnotations?.findIndex(
      (annotation: any) => annotation.name === item.name
    );
    if (foundIndex !== -1) {
      const TextAnnotation = (annotationsJSON?.annotations as any[])?.find(
        (ann: AnnotationsUnion) => ann.name === `SignedAt-${item.name}`
      );
      const { id, referenceId, ...rest } = item as any;
      (signatureAnnotations as any[])[foundIndex as number].signatureMeta = {
        ...rest,
        signedAt: { ...TextAnnotation }
      };
    }
  });

  const signatureAnnotationsPayload = signatureAnnotations?.map(
    (annotation: any) => {
      // const { documentMeta: metaJSON, ...rest } = annotation;
      return {
        signatureMeta: !isFalsy(annotation.signatureMeta)
          ? annotation.signatureMeta
          : null,
        id: findSignatureFieldId(annotation) as string,
        referenceId: annotation.name,
        requestedToId: annotation.customData?.requestedTo?.id || '',
        fileId: fileIdProp?.value || (fileIdQuery.value as string)
      };
    }
  );
  const oldAttachments = fileSignatureData.value?.documentMeta?.instantJSON
    ?.attachments
    ? { ...fileSignatureData.value?.documentMeta?.instantJSON?.attachments }
    : {};
  const oldAnnotations = fileSignatureData.value?.documentMeta?.instantJSON
    ?.annotations
    ? [
        ...(fileSignatureData.value?.documentMeta?.instantJSON
          ?.annotations as any[])
      ]
    : [];
  const payload = {
    title: values.title,
    dueDate: values.dueDate,
    documentMeta: {
      instantJSON: {
        ...annotationsJSON,
        attachments: {
          ...oldAttachments,
          ...annotationsJSON?.attachments
        },
        formFields: annotationsformFields,
        annotations: allAnnotations
      }
    },
    signatures: signatureAnnotationsPayload,
    fileId: fileIdProp?.value || (fileIdQuery.value as string),
    clientId: clientIdParam.value || clientIdProp?.value,
    WebformId: webformIdQuery?.value ? webformIdQuery.value : undefined
  };
  if (signReqIdQuery.value) {
    await updateDocSignReq({ id: signReqIdQuery.value as string, payload });
  }
  else {
    await createDocSignReq(payload);
  }
  newSignAttachments.value = {};
  newSignatures.value = [];
});

function syncSignReq() {
  // queryClient.invalidateQueries('get-one-signature-request');
  router.go(0);
}

watchEffect(() => {
  if (selectedFilename.value) {
    title.value = selectedFilename.value;
  }
  if (pspdfkitConfirmDialog.value) {
    pspdfkitConfirmDialog.value.classList.add('hidden');
    pspdfkitConfirmDialog.value.style.cssText = `
        'display': 'none !important'
      `;
  }
  if (isWebformProp?.value && !isESignWebformQuery?.value) {
    setFieldValue('isWebform', true);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
  if (pdfcontainer.value) {
    PSPDFKit?.unload(pdfcontainer.value);
  }
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <h3
    v-if="isSignReq || isSignReqQuery"
    class="text-3xl font-medium px-3 pt-3 m-0 text-primary"
  >
    Add / Request for eSignature
  </h3>
  <div class="flex gap-2 p-3 justify-content-between">
    <div class="flex gap-2 align-items-center">
      <Button
        label="Back"
        outlined
        icon="pi pi-chevron-left"
        @click="goBack()"
      />
      <div
        v-if="selectedFile && selectedFile.filename"
        class="flex align-items-center"
      >
        <div class="flex-1 mr-2">
          <img
            class="w-2rem h-auto mx-auto"
            :src="`${fileIcon(selectedFile.filename)}`"
            :alt="selectedFile.filename"
          >
        </div>
        <div>
          <div class="text-primary font-medium">
            {{ selectedFile.filename }}
          </div>
          <div class="text-sm">
            Created: {{ dateToHumanShort(selectedFile.createdAt) }}
          </div>
        </div>
      </div>
      <template v-else>
        {{ selectedFilename }}
      </template>
    </div>
    <div class="flex justify-content-between gap-2">
      <Button
        v-tooltip="
          `${
            isSignDocument ? 'Sync eSignature Request' : 'Reload the document'
          }`
        "
        outlined
        icon="pi pi-refresh"
        class="w-4rem"
        @click="syncSignReq"
      />
      <template v-if="!isWebform">
        <Button
          label="Previous"
          outlined
          icon="pi pi-chevron-left"
          class="w-8rem"
          :class="{
            'opacity-50 pointer-events-none':
              !previousAndNextFileIds.previousId,
          }"
          @click="openPrevious"
        />
        <Button
          label="Next"
          outlined
          icon="pi pi-chevron-right"
          icon-pos="right"
          class="w-8rem"
          :class="{
            'opacity-50 pointer-events-none': !previousAndNextFileIds.nextId,
          }"
          @click="openNext"
        />
      </template>
    </div>
  </div>
  <div
    :class="attrs.class"
    class="flex pdf-wrapper gap-3 splitPane p-3 bg-white shadow-3 border-round-md"
  >
    <form
      v-if="isESignWebformQuery || contractView || isSignReq || isSignReqQuery"
      id="form-field-container"
      class="pdfviewer-form w-3 flex flex-column gap-2"
      @submit.stop="onSubmit"
    >
      <template
        v-if="
          contractView
            && ![
              'APPROVED',
              'ESIGN_REQUESTED',
              'PARTIALLY_SIGNED',
              'SIGNED',
            ].includes(webformDetails?.status as string)
            && !isESignWebformQuery
        "
      >
        <h3 class="text-xl text-primary mb-4 mt-4">
          Map fields
          <small class="block text-sm mt-1">
            Drag and drop form fields to the contract form.
          </small>
        </h3>

        <div class="flex flex-wrap gap-2 tools-wrapper">
          <template v-for="(tool, key) in fieldsTools" :key="key">
            <span
              v-tooltip.top="
                `Please drag it to the designated ${tool.name} position`
              "
              class="inline-block"
            >
              <div
                class="tool border-round-md select-none border-1 border-primary px-3 py-2 flex align-items-center"
                :aria-label="tool.label || tool.name"
                draggable="true"
                @dragstart="setDragData($event, tool)"
              >
                <Icon v-if="tool.icon" :icon="tool.icon" class="mr-2 text-xl" />
                {{ tool.label || tool.name }}
              </div>
            </span>
          </template>
        </div>
        <div class="flex justify-content-between mt-4">
          <div class="flex flex-wrap ml-auto gap-2">
            <Button
              class="p-button-primary"
              :style="{ minWidth: '5.2rem' }"
              type="button"
              :label="`Save${isWebformTemplate ? ' as Draft' : ''}`"
              :loading="creatingSignatureRequest || updatingSignatureRequest"
              :disabled="!totalAnnotations"
              @click="handleWebformSubmission()"
            />
            <Button
              v-if="
                !!webformDetails?.client
                  && webformDetails?.status !== 'CANCELLED'
              "
              class="p-button-primary"
              :style="{ minWidth: '5.2rem' }"
              type="button"
              label="Ask Client for Details"
              :loading="creatingSignatureRequest || updatingSignatureRequest"
              :disabled="!totalAnnotations"
              @click="handleWebformSubmission(true)"
            />
            <Button
              v-if="
                !!webformDetails?.client
                  && webformDetails?.status !== 'CANCELLED'
              "
              class="p-button-primary"
              :style="{ minWidth: '5.2rem' }"
              type="button"
              label="Request eSign"
              :loading="creatingSignatureRequest || updatingSignatureRequest"
              :disabled="!totalAnnotations"
              @click="handleWebformFill"
            />
          </div>
        </div>
      </template>
      <template v-else>
        <div class="field mb-0">
          <label class="text-900 font-semibold" for="title"> Title </label>
          <InputText
            id="title"
            v-model="title"
            type="title"
            class="w-full"
            :disabled="
              fileSignatureData?.status === 'SIGNED'
                || (isSignDocQuery
                  && currentUser?.id !== fileSignatureData?.requestedBy?.id)
            "
            :class="{ 'p-invalid': errors.title }"
            @blur="validate()"
          />
          <p v-if="errors.title" class="p-error">
            {{ errors.title }}
          </p>
        </div>
        <div class="field mb-0">
          <label class="text-900 font-semibold" for="dueDate">
            Due Date
            <span class="text-red-600">*</span>
          </label>
          <Calendar
            id="dueDate"
            v-model="dueDate"
            type="dueDate"
            class="w-full"
            :class="{ 'p-invalid': errors.dueDate }"
            placeholder="Due Date"
            date-format="dd M yy"
            :manual-input="false"
            show-button-bar
            :disabled="!enableDueDate"
            :min-date="dayjs().toDate()"
            @blur="validate()"
          />
          <p v-if="errors.dueDate" class="p-error">
            {{ errors.dueDate }}
          </p>
        </div>
        <template
          v-if="
            !isPortalUser
              && (!signReqIdQuery
                || currentUser?.id === fileSignatureData?.requestedBy?.id)
          "
        >
          <div class="field">
            <label class="text-900 font-semibold" for="requestedTo">
              Signer
              <span class="text-red-600">*</span>
            </label>
            <Dropdown
              id="requestedTo"
              v-model="requestedTo"
              name="requestedTo"
              :tabindex="0"
              class="w-full"
              option-label="name"
              option-group-label="label"
              option-group-children="items"
              :options="signerOptions"
              show-clear
              placeholder="Select Signer"
              :disabled="fileSignatureData?.status === 'SIGNED'"
              @blur="validate({ mode: 'silent' })"
            >
              <template #optiongroup="slotProps">
                <div class="flex align-items-center font-medium text-gray-900">
                  <div>{{ slotProps.option.label }}</div>
                </div>
              </template>
            </Dropdown>
            <p v-if="errors.requestedTo" class="p-error">
              {{ errors.requestedTo }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <template v-for="tool in tools" :key="tool.name">
              <span
                v-tooltip.top="
                  `${
                    fileSignatureData?.status === 'SIGNED'
                      ? `Can't edit Signed Document`
                      : tool.name === 'Signature'
                        && (!requestedTo || !selectedFile)
                        ? 'Please select Signer to add signature'
                        : `Please drag it to the designated ${tool.name} position`
                  }`
                "
                class="inline-block"
              >
                <div
                  class="tool border-round-md select-none border-1 border-primary px-3 py-2 flex align-items-center"
                  :aria-label="tool.name"
                  draggable="true"
                  :class="[
                    {
                      'opacity-50 pointer-events-none':
                        fileSignatureData?.status === 'SIGNED'
                        || (tool.name === 'Signature'
                          && (!requestedTo || !selectedFile)),
                    },
                  ]"
                  @dragstart="setDragData($event, tool)"
                >
                  <Icon
                    v-if="tool.icon"
                    :icon="tool.icon"
                    class="mr-2 text-xl"
                  />
                  {{ tool.name }}
                </div>
              </span>
            </template>
          </div>
        </template>
        <div class="flex justify-content-between gap-2 mt-4">
          <!-- <Button
            v-if="
              isPortalUser ||
              (isSignDocQuery === 'true' &&
                !currentUser.isOwner &&
                currentUser?.id !== fileSignatureData?.requestedBy?.id)
            "
            class="p-button-danger w-6rem"
            label="Cancel"
            @click="goBack"
          /> -->
          <Button
            v-if="!!selectedFile && !!totalAnnotations"
            class="text-center justify-content-center align-items-center w-6rem"
            @click="handleDownload"
          >
            Download
          </Button>
          <Button
            v-if="
              fileSignatureData?.status !== 'SIGNED'
                && !!totalAnnotations
                && isShowFormBtns
            "
            :disabled="!!disableEditBtn"
            class="text-center justify-content-center align-items-center w-6rem"
            :severity="isEditingForm ? 'info' : ''"
            @click="toggleFormEdit"
          >
            {{ formEditBtnText }}
          </Button>
        </div>
        <template v-if="!isSignReq && !contractView">
          <label for="file-upload" class="custom-file-upload text-center">
            Open PDF
          </label>
          <input
            id="file-upload"
            type="file"
            class="btn"
            @change="openDocument"
          >
        </template>
        <div
          v-if="fileSignatureData?.status !== 'SIGNED' && isShowFormBtns"
          class="flex justify-content-between mt-4"
        >
          <!-- <Button class="p-button-danger w-6rem" label="Cancel" @click="goBack" /> -->
          <Button
            class="p-button-primary ml-auto"
            :style="{ minWidth: '5.2rem' }"
            type="submit"
            :label="formSubmitBtnText"
            :loading="creatingSignatureRequest || updatingSignatureRequest"
            :disabled="!totalAnnotations || !meta.valid"
          />
        </div>
        <CommonLoading v-if="removingSignature || addUpdatingDocSign" />
      </template>
    </form>
    <div
      class="flex-1"
      :class="[{ 'w-full': !isSignReq }, { 'w-9': isSignReq || isWebform }]"
    >
      <CommonLoading
        v-if="
          loadingFile
            || loadingSignature
            || fetchingPspdfkitData
            || fetchingSignature
        "
      />
      <div
        v-else
        id="pdf-viewer"
        ref="pdfcontainer"
        class="pdf-container"
        :class="isSignDocument ? 'hide-toolbar' : ''"
      />
    </div>
  </div>
  <CommonConfirmRemoveDialog
    v-if="removeAnnotationDialog"
    :visible="removeAnnotationDialog"
    :record-to-remove="annotationToRemove"
    :title="confirmRemoveObj.title"
    @confirm="removeAnnotation(annotationToRemove as Annotation)"
    @hide="removeAnnotationDialog = false"
  >
    <div v-html="confirmRemoveObj.message" />
  </CommonConfirmRemoveDialog>
</template>

<style lang="scss" scoped>
.PSPDFKit-Sidebar {
  background-color: #fafbfb;
  box-shadow: -5px 0 5px hsl(0deg 0% 78% / 20%);
}

.dark > .PSPDFKit-Sidebar {
  background-color: #16181f;
  box-shadow: -5px 0 5px hsl(0deg 0% 78% / 20%);
}

.PSPDFKit-Annotation-Tooltip {
  flex-direction: column;
}

.PSPDFKit-Annotation-Tooltip .PSPDFKit-Annotation-Tool-Button {
  padding: 5px 20px;
  border: none;
}

.PSPDFKit-Sidebar-Dragger {
  display: none;
}

input[type='file'] {
  display: none;
}

.custom-file-upload {
  display: inline-block;
  padding: 6px 12px;
  padding: 10px;
  font: inherit;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  cursor: pointer;
  background: #4a8fed;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.pdf-container {
  height: 100vh;
}

.splitPane {
  display: flex;
  width: 100%;
  // height: 100%;
  background: #f6f8fa;
}

.splitPane-left {
  padding: 10px;
  background-color: rgb(250 251 251);
}

.splitPane-right {
  flex-grow: 1;
  height: 100%;
}

.tool {
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

@media only screen and (width >= 768px) {
  .splitPane-left {
    width: 300px;
    height: 100vh;
    padding: 0 20px;
    overflow-y: auto;
    box-shadow: 5px 0 5px rgb(200 200 200 / 20%);
    -webkit-overflow-scrolling: touch;
  }

  .splitPane {
    flex-direction: row;
  }
}

@media only screen and (width <= 767px) {
  .splitPane-left {
    width: auto;
    padding: 0;
    overflow: auto hidden;
    white-space: nowrap;
    box-shadow: 5px 0 5px rgb(200 200 200 / 20%);
    -webkit-overflow-scrolling: touch;
  }

  .splitPane-right {
    height: calc(100% - 150px);
  }

  .splitPane {
    flex-direction: column;
  }
}

.tools-wrapper {
  max-height: calc(100vh - 270px);
  overflow-y: auto;
}
</style>
