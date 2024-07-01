<script setup lang="ts">
import type {
  CreateFilePayload,
  CreateFolderPayload,
  DocOrDirUpdateParams,
  DocumentFile,
  DocumentFolder,
  SearchedReponse
} from '@/types/documents.type';
import type { User } from '@/types/teams.type';
import { useRouteQuery } from '@vueuse/router';
import Menu from 'primevue/menu';

// import type { MenuItem } from '@/types/app.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { MenuItem } from 'primevue/menuitem';
import type { MaybeElementRef } from '@vueuse/core';
import type { DownloadFilesAndFolders } from '@/types/attachment.type';
import type { DataTableRowClickEvent } from 'primevue/datatable';

interface FolderBreadcrumb {
  home: MenuItem;
  items: MenuItem[];
}

interface SummaryType {
  field: string;
  order: number;
  value: string;
}
const props = withDefaults(
  defineProps<{
    client?: User;
    showMode?: boolean;
    aiSettings?: {
      enableExtraction: boolean | null;
      enableClassification: boolean | null;
    };
    defaultMode?: 'grid' | 'list';
  }>(),
  {
    defaultMode: 'grid',
    showMode: true
  }
);

const emits = defineEmits<{
  (event: 'folder-fetched', value: DocumentFolder | DocumentFolder[]): void;
}>();

const { aiSettings } = toRefs(props);

const {
  filterObjArrByKeyValue,
  sortCompare,
  canOpenDoc,
  isImageOrPdf,
  getFilename,
  getFileIcon
} = useUtilityFns();
const { allOrgIntegrationIds, isFeatureIntegrated, featureSubscribed }
  = usePermissions(true);
const clientDetails = inject<any>('clientDetails', () => null);
const { data: filterData, applyFilter } = useFilterColumns();
const {
  getAttachmentUrl,
  downloadFileAs,
  downLoadFilesAndFoldersAs,
  extractData
} = useAttachments();
const mode = ref(useDocumentViewMode('list'));
const currentInstance = getCurrentInstance();
const { isLarge } = useCommonBreakPoints();
const { fileIcon, fileKind, dateToHumanShort } = useVueFilters();
const { getFolders, getFiles, getFolder } = useDocuments();
const route = useRoute();
const clientId = ref(route.params.id as string);
const activeIndex = useRouteQuery<string>('activeIndex');
const fileId = useRouteQuery<string>('fileId');
const router = useRouter();
const folderId = ref(route.query.folderId as string);
const { currentUser, isPortalUser } = useCurrentUserData();
const { filters, searchText: staticSearchText } = useDatatableFilters();
const queryClient = useQueryClient();
const { deleteFolder, deleteFile, searchFilesAndFolders } = useDocuments();
const { initToast } = useToasts();
const { updateFile, updateFolder } = useDocuments();
const { tableAttrs, queryKeys } = useDataTableUtils();
const { exportToCSV, reportsTableRef } = useReports();

const { tagsList } = useTags();

const tagListFn = () => tagsList('DOCUMENT', isPortalUser.value);

const { data: optionsData, isLoading: loadingTag } = useQuery(
  ['tags-list'],
  () => {
    return tagListFn ? tagListFn() : [];
  },
  {
    onSuccess: (data: any) => {
      // data.results ? data.results : data;
    }
  }
);
const summaryDlgVisible = ref<boolean>(false);
const selectedTags = ref<string[]>();
const isFilters = ref<boolean>(false);
const hideFilter = ref<boolean>(false);
const isMoveTo = ref<boolean>(false);
const isGetInfo = ref<boolean>(false);
const isTaskDlgVisible = ref(false);
const updateDialog = ref(false);
const updateFolderDialog = ref(false);
const removeDialog = ref(false);
const isClientTaskDlgVisible = ref(false);
const isFileInfoModalVisible = ref(false);
const isPreviewVisible = ref(false);
const isMoveDlgVisible = ref(false);
const moveType = ref<'File' | 'Folder'>();
const moveSource = ref(null);
const moveDestination = ref(null);
const editType = ref<'rename' | 'move' | 'copy' | 'permissions'>();
const editDataType = ref<'File' | 'Folder'>();
const searchedFileFolders = ref<SearchedReponse>({ files: [], folders: [] });
const IsGridSearchedFileFolders = ref<string>();
const summaryData = ref<SummaryType[]>();
const folderMenuItems = ref([
  {
    label: 'Open',
    icon: 'pi pi-folder-open',
    command: () => {
      if (dataToModify.value)
        navigateToItem(dataToModify.value as DocumentFolder);
    }
  },
  {
    label: 'Rename',
    icon: 'pi pi-pencil',
    command: (data: any) => {
      updateDialog.value = true;
      editType.value = 'rename';
    }
  },
  {
    label: 'Move To',
    icon: 'pi pi-custom pi-move-folder w-1rem h-1rem',
    command: () => {
      isMoveTo.value = true;
      editType.value = 'move';
    }
  },
  {
    label: 'Update Permissions',
    icon: 'pi pi-custom pi-gear w-1rem h-1rem',
    command: () => {
      updateFolderDialog.value = true;
      editType.value = 'permissions';
    }
  },
  {
    label: 'Delete',
    icon: 'pi pi-trash',
    command: () => {
      removeDialog.value = true;
    }
  },
  {
    label: 'Download',
    icon: 'pi pi-download',
    command: (data: any) => {
      if (editDataType.value === 'Folder') {
        handleDownload();
      }
      else {
        dataToModify.value
        && downloadFileAs(
          getAttachmentUrl((dataToModify.value as DocumentFile).path),
          (dataToModify.value as DocumentFile).filename
        );
      }
    },
    showPortal: true
  }
]);
const fileMenuItems = ref([
  ...folderMenuItems.value.filter((item: MenuItem) => {
    const itemsToRemove = ['Update Permissions', 'Download'];
    return !itemsToRemove.includes(item.label as string);
  }),
  {
    label: 'Request eSignature',
    icon: 'tabler:signature',
    iconify: true,
    iconClass: 'text-xl mr-1',
    command: () => {
      router.push({
        query: {
          ...route.query,
          fileId: dataToModify.value?.id,
          isDocumentViewer: 'true',
          isSignReq: 'true'
        }
      });
    },
    showPortal: false
  },
  {
    label: 'Download',
    icon: 'pi pi-download',
    command: () => {
      if (editDataType.value === 'Folder')
        return;
      dataToModify.value
      && downloadFileAs(
        getAttachmentUrl((dataToModify.value as DocumentFile).path),
        (dataToModify.value as DocumentFile).filename
      );
    },
    showPortal: true
  },
  {
    label: 'Get Info',
    icon: 'pi pi-info-circle',
    command: () => {
      isGetInfo.value = true;
      // TODO:},
    },
    showPortal: true
  }
]);

const selectedTagFilter = ref();
const selectedFolder = ref<DocumentFolder>();
const selectedFolderCloned = ref<DocumentFolder>();
const selectedFile = ref<DocumentFile>();
const selectedFileCloned = ref<DocumentFile>();
const folderDetails = ref<DocumentFolder>();
const folderData = ref<DocumentFolder[]>([]);
const dataToModify = ref<DocumentFolder | DocumentFile>();
const isSelectedDoc = ref<DocumentFolder[] | DocumentFile[]>([]);

const path = {
  home: {
    icon: 'pi pi-home',
    to: '/'
  },
  items: [
    {
      id: '',
      label: 'Computer'
    }
  ]
};
const folderBreadCrumbItems = computed<FolderBreadcrumb>(() => {
  if (folderDetails.value && folderDetails.value.paths) {
    return {
      home: {
        icon: 'pi pi-home',
        to: '/'
      },
      items: [
        ...folderDetails.value.paths,
        { id: folderDetails.value.id, name: folderDetails.value.name }
      ] as unknown as MenuItem[]
    } as FolderBreadcrumb;
  }
  return {
    home: {
      icon: 'pi pi-home',
      to: '/'
    },
    items: [] as unknown as MenuItem[]
  } as FolderBreadcrumb;
});

const modalHeader = computed(() => {
  switch (editType.value) {
    case 'rename':
      return selectedFile.value ? 'Rename File' : 'Rename Folder';
    case 'move':
      return selectedFile.value ? 'Move File' : 'Move Folder';
    case 'copy':
      return selectedFile.value ? 'Copy File' : 'Copy Folder';
    case 'permissions':
      return selectedFile.value
        ? 'Update File Permissions'
        : 'Update Folder Permissions';
    default:
      return '';
  }
});

const bulkActionLabel = computed(() => {
  return `Action (${isSelectedDoc.value?.length})`;
});

const allDocumentsData = ref<any>([]);

const listViewData = computed<any[]>(() => {
  let allDocuments: DocumentFile[] | DocumentFolder[] = [];
  if (staticSearchText.value && staticSearchText.value?.length >= 3) {
    if (searchedFileFolders.value) {
      allDocuments = [
        ...(searchedFileFolders.value?.folders as DocumentFolder[]),
        ...(searchedFileFolders.value?.files as DocumentFile[])
      ];
    }
  }
  else if (Array.isArray(folderData.value) && Array.isArray(files.value)) {
    allDocuments = [
      ...folderData.value,
      ...(files.value ? (files.value as DocumentFile[]) : [])
    ];
  }
  allDocuments = allDocuments.map(
    (document: DocumentFile | DocumentFolder) => ({
      ...document,
      documentKind: fileKind((document as DocumentFile).path)
    })
  );

  if (isPortalUser.value) {
    allDocuments = allDocuments.filter(
      (document: DocumentFile | DocumentFolder) => {
        return (
          (document as DocumentFile).filename !== undefined
          || (document as DocumentFolder).clientReadable === true
        );
      }
    );
  }

  allDocumentsData.value = [...allDocuments];

  return isFilters.value
    ? allDocuments.filter(
      (document: DocumentFile | DocumentFolder) =>
        (document as DocumentFile).filename !== undefined
    )
    : allDocuments;
});

const extractionFolder = computed(() => {
  return allDocumentsData.value.find(
    (item: DocumentFolder) => item.name === 'Extraction'
  );
});

const selectedDocsExceptExtraction = computed(() => {
  return (isSelectedDoc.value as DocumentFolder[])?.filter(
    (item: DocumentFolder) => item.id !== extractionFolder.value.id
  );
});

function filterFolderMenuItems(folder: DocumentFolder) {
  const clientReadable = ['Open'];
  const clientWritable = ['Open', 'Download'];
  const extractionFolderMenus = [...clientWritable];
  if (isPortalUser.value && !folder.clientWritable) {
    return folderMenuItems.value.filter((item: MenuItem) =>
      clientReadable.includes(item.label as string)
    );
  }
  else {
    return isPortalUser.value
      ? folderMenuItems.value.filter((item: MenuItem) =>
        clientWritable.includes(item.label as string)
      )
      : folder.isExtractionFolder || folder.isSmartFolder
        ? folderMenuItems.value.filter((item: MenuItem) =>
          extractionFolderMenus.includes(item.label as string)
        )
        : folderMenuItems.value;
  }
}

function filterFileMenuItems(file: DocumentFile) {
  const clientReadable = ['Get Info'];
  if (isPortalUser.value && !file.folder) {
    return fileMenuItems.value.filter(
      (item: MenuItem) => item.label === 'Get Info'
    );
  }
  else if (isPortalUser.value && !file.folder?.clientWritable) {
    return fileMenuItems.value.filter((item: MenuItem) =>
      clientReadable.includes(item.label as string)
    );
  }
  else {
    return isPortalUser.value
      ? fileMenuItems.value.filter((item: MenuItem) => item.showPortal)
      : folderDetails.value?.isExtractionFolder
      || folderDetails.value?.isSmartFolder
        ? fileMenuItems.value.filter((item: MenuItem) => {
          const extractionMenusToExclude = [
            'Rename',
            'Move To',
            'Request eSignature',
            'Delete'
          ];
          const menusToExclude = [...extractionMenusToExclude, 'Open'];
          if (!canOpenDoc(file.filename)) {
            return !menusToExclude.includes(item.label as string);
          }
          return !extractionMenusToExclude.includes(item.label as string);
        })
        : fileMenuItems.value.filter((item: MenuItem) => {
          const menusToExclude = ['Open', 'Request eSignature'];
          if (!canOpenDoc(file.filename)) {
            return !menusToExclude.includes(item.label as string);
          }
          if (
            canOpenDoc(file.filename)
            && !isFeatureIntegrated(['esign'], allOrgIntegrationIds.value)
          ) {
            return !['Request eSignature'].includes(item.label as string);
          }
          if (featureSubscribed('esignature', 'esign') === false) {
            return !['Request eSignature'].includes(item.label as string);
          }
          return item;
        });
  }
}

function handleUpdateSucces() {
  updateDialog.value = false;
  updateFolderDialog.value = false;
  queryClient.invalidateQueries('files-list');
  queryClient.invalidateQueries('folders-list');
  queryClient.invalidateQueries('search-docs');
  queryClient.invalidateQueries('document-limit');
}

const {
  data: foldersData,
  isLoading: loadingFolders,
  isFetching: fetchingFolders
} = useQuery(
  ['folders-list'],
  () => {
    if (folderId.value) {
      return getFolder({
        id: (clientId.value as string) || (currentUser.value?.id as string),
        folderId: folderId.value as string,
        isPortal: isPortalUser.value
      });
    }
    else {
      return getFolders({
        id: (clientId.value as string) || (currentUser.value?.id as string),
        isPortal: isPortalUser.value,
        term: IsGridSearchedFileFolders.value
          ? IsGridSearchedFileFolders.value
          : undefined
      });
    }
  },
  {
    onSuccess: (data) => {
      /* const { paths } = data as DocumentFolder;
      if (paths !== undefined) {
        data?.paths.map((single: DocumentFolder) => {
          path.items.push({
            id: single.id,
            label: single.name,
          });
        });
        path.items.push({
          id: data?.id,
          label: data?.name,
        });
      }

      const dataForPath = { ...data, paths }; */
      data = Array.isArray(data)
        ? data.filter(
          folder => !(folder.isExtractionFolder || folder.isHidden)
        )
        : data;
      if (featureSubscribed('smart_folder', 'default_smart_folder') === false) {
        data = (data as DocumentFolder[]).filter(
          folder => !folder.isSmartFolder
        );
      }
      folderData.value = (data as DocumentFolder).children
        ? ((data as DocumentFolder).children as DocumentFolder[])
        : (data as DocumentFolder[]);
      if ((data as DocumentFolder).children) {
        folderDetails.value = data as DocumentFolder;
      }
      allDocumentsData.value.unshift([...folderData.value]);
      emits('folder-fetched', data);
    }
  }
);

const { isFetching: searchIsFetching } = useQuery(
  ['search-docs', staticSearchText],
  useDebounceFn(async () => {
    if ((staticSearchText.value as string)?.length >= 3) {
      const searchResults = await searchFilesAndFolders({
        mode: 'all',
        id: (clientId.value as string) || (currentUser.value?.id as string),
        q: staticSearchText.value as string,
        folderId: folderId.value ? (folderId.value as string) : undefined,
        isPortal: isPortalUser.value
      });
      searchedFileFolders.value = searchResults;
      allDocumentsData.value = searchResults;
    }
  }, 1000)
);

const smartfolderIds = computed(() => {
  const allFolders: any[] = [];
  if (searchedFileFolders.value || folderData.value) {
    if (searchedFileFolders.value) {
      allFolders.push([...searchedFileFolders.value.folders]);
    }
    if (folderData.value) {
      allFolders.push([...folderData.value]);
    }
    return [
      ...folderData.value,
      ...(searchedFileFolders.value.folders as any[])
    ]
      .filter((folder: DocumentFolder) => folder.isSmartFolder)
      .map((folder: DocumentFolder) => folder.id);
  }
  return [];
});

const disableBulkAction = computed(() => {
  return isSelectedDoc.value
    .map((item: any) => item.id)
    .some((item: string) => smartfolderIds.value.includes(item));
});

const {
  data: files,
  isLoading: loadingFiles,
  isFetching: fetchingFiles
} = useQuery(
  ['files-list', ...queryKeys, selectedTagFilter],
  () => {
    return getFiles({
      id: (clientId.value as string) || (currentUser.value?.id as string),
      folderId: folderId.value ? (folderId.value as string) : undefined,
      isPortal: isPortalUser.value,
      term: IsGridSearchedFileFolders.value
        ? IsGridSearchedFileFolders.value
        : undefined,
      filters: selectedTagFilter.value
    });
  },
  {
    onSuccess: (data) => {
      allDocumentsData.value.push([...data]);
    },
    enabled: !!clientId
  }
);

const { mutateAsync: deleteDoc } = useMutation(
  ['document-remove'],
  () => {
    if ((dataToModify.value as DocumentFile).filename) {
      return deleteFile(
        clientId.value as string,
        (dataToModify.value as DocumentFile).id as string,
        isPortalUser.value
      ) as Promise<DocumentFile>;
    }
    else {
      return deleteFolder(
        clientId.value as string,
        (dataToModify.value as DocumentFile).id as string,
        isPortalUser.value
      ) as Promise<DocumentFolder>;
    }
  },
  {
    onSuccess: () => {
      handleUpdateSucces();
      initToast({
        actionType: 'Delete',
        summary: `${editDataType.value} Delete`,
        detail: `${editDataType.value} deleted successfully.`
      });
    }
  }
);

const { mutateAsync: updateDoc } = useMutation(
  ['document-updates'],
  ({ id, folderId, payload, fileId }: Partial<DocOrDirUpdateParams>) => {
    return updateFile({
      id: id as string,
      fileId: fileId as string,
      isPortal: isPortalUser.value,
      payload: payload as CreateFilePayload
    });
  },
  {
    onSuccess: () => {
      handleSuccess();
    }
  }
);

const { mutateAsync: updateDir } = useMutation(
  ['document-update'],
  ({ id, folderId, payload }: Partial<DocOrDirUpdateParams>) => {
    return updateFolder({
      id: id as string,
      folderId: folderId as string,
      payload: payload as CreateFolderPayload,
      isPortal: isPortalUser.value
    });
  },
  {
    onSuccess: () => {
      handleSuccess();
    }
  }
);

function handleSuccess() {
  isMoveTo.value = false;
  initToast({
    actionType: 'Update',
    summary: ` Update`,
    detail: `${editDataType.value} updated successfully.`
  });
  queryClient.invalidateQueries('files-list');
  queryClient.invalidateQueries('folders-list');
  queryClient.invalidateQueries('search-docs');
  queryClient.invalidateQueries('document-limit');
}

function toggleMenu(event: Event, ref: string) {
  let foundMenu: Menu;
  if (mode.value === 'grid') {
    foundMenu = (currentInstance?.refs[ref] as any[])[0] as InstanceType<
      typeof Menu
    >;
  }
  else {
    foundMenu = Array.isArray(
      currentInstance?.refs[ref] as InstanceType<typeof Menu>
    )
      ? (currentInstance?.refs[ref] as InstanceType<typeof Menu>[])[0]
      : (currentInstance?.refs[ref] as InstanceType<typeof Menu>);
  }
  foundMenu.toggle(event);
}

function selectCurrentFolder(folder: DocumentFolder) {
  selectedFile.value = undefined;
  selectedFolder.value = folder;
  selectedFolderCloned.value = folder;
  navigateToItem(folder);
}
function selectCurrentFile(file: DocumentFile) {
  selectedFolder.value = undefined;
  selectedFile.value = file;
  selectedFileCloned.value = file;
  navigateToItem(file);
}
function isSelectedFolder(folder: DocumentFolder) {
  if (selectedFolderCloned.value) {
    return selectedFolderCloned.value.id === folder.id;
  }
  return false;
}
function isSelectedFile(file: DocumentFile) {
  if (selectedFileCloned.value) {
    return selectedFileCloned.value.id === file.id;
  }
  return false;
}

function showInfo(type?: 'Folder' | 'File',
  data?: DocumentFolder | DocumentFile) {
  isFileInfoModalVisible.value = true;
}
async function showMoveDialog(type: 'File' | 'Folder', resource: any) {
  moveType.value = type;
  moveSource.value = resource;
  moveDestination.value = null;
  isMoveDlgVisible.value = true;
}
async function handleMoveSelection(id: string | null) {
  if (editDataType.value === 'File') {
    await updateDoc({
      id: (clientId.value as string) || (currentUser.value?.id as string),
      fileId: selectedFile.value?.id,
      payload: {
        folderId: id as string
      } as unknown as CreateFilePayload
    });
  }
  else {
    await updateDir({
      id: (clientId.value as string) || (currentUser.value?.id as string),
      folderId: selectedFolder.value?.id,
      payload: {
        ...selectedFolder.value,
        name: selectedFolder.value?.name,
        parentId: id as string
      } as unknown as CreateFolderPayload
    });
  }
  // moveDestination.value = destination;
}

function handleFileNavigation(file: DocumentFile) {
  // TODO:
}

const navigateToItem = useDebounceFn((data: DocumentFolder | DocumentFile) => {
  if ((data as DocumentFile).filename) {
    if (!canOpenDoc((data as DocumentFile).filename))
      return;
    router.push({
      query: {
        ...route.query,
        fileId: data.id,
        isDocumentViewer: 'true'
      }
    });
  }
  else {
    router.push({
      query: {
        ...route.query,
        folderId: data.id,
        activeIndex: activeIndex.value
      }
    });
  }
}, 250);
function downloadFolder(folder: DocumentFolder) {
  // TODO:
}
function showDeleteConfirmation(type?: 'Folder' | 'File',
  data?: DocumentFolder | DocumentFile) {
  // TODO:
}
function showRenameResource(type?: 'Folder' | 'File',
  data?: DocumentFolder | DocumentFile) {
  // TODO:
}
function createClientTask(type?: 'Folder' | 'File',
  data?: DocumentFolder | DocumentFile) {
  // TODO:
}
function createTask(type?: 'Folder' | 'File',
  data?: DocumentFolder | DocumentFile) {
  // TODO:
}

function downloadXml(file: DocumentFile) {
  // TODO:
}
function menuClick(menuItem: MenuItem,
  data?: DocumentFile | DocumentFolder) {
  dataToModify.value = data;
  if ((data as DocumentFile).filename) {
    selectedFile.value = data as DocumentFile;
    editDataType.value = 'File';
  }
  else {
    selectedFolder.value = data;
    editDataType.value = 'Folder';
  }
  // menuItem.command && menuItem.command(menuItem);
}

function gotoFolder(item: MenuItem) {
  router.push({
    query: {
      activeIndex: activeIndex.value,
      folderId: item.id
    }
  });
}

function applyFilters() {
  if (selectedTags.value) {
    applyFilter('Tag', selectedTags.value ? selectedTags.value : null);
    const tagFilters = useEncodeFilterData(filterData);
    selectedTagFilter.value = tagFilters;
  }
  isFilters.value = !!selectedTags.value?.length;
  hideFilter.value = !!selectedTags.value?.length;
}
function resetFilters() {
  if (selectedTags.value?.length) {
    isFilters.value = false;
    hideFilter.value = false;
    selectedTags.value = undefined;
    selectedTagFilter.value = undefined;
    queryClient.invalidateQueries('files-list');
  }
  else {
    hideFilter.value = !hideFilter.value;
  }
}

function onInput() {
  queryClient.invalidateQueries('files-list');
  queryClient.invalidateQueries('folders-list');
  // queryClient.invalidateQueries('search-docs');
}

onClickOutside(
  (`folder-${selectedFolder.value?.id}`
  || `file-${selectedFile.value?.id}`) as unknown as MaybeElementRef,
  (e) => {
    if (selectedFileCloned.value)
      selectedFileCloned.value = undefined;
    if (selectedFolderCloned.value)
      selectedFolderCloned.value = undefined;
  }
);

function handleSummaryData(data: DocumentFile) {
  selectedFile.value = data;
  if (data) {
    summaryDlgVisible.value = true;
    summaryData.value = data.summary
      .map(item => ({
        ...item,
        field: item.field.replace(/_/g, ' ')
      }))
      .sort(sortCompare({ compareProp: 'order', order: 'asc' }));
  }
}
const { mutateAsync: downloadFileAndFolder } = useMutation(
  async (payload: DownloadFilesAndFolders) => {
    return await downLoadFilesAndFoldersAs(
      clientId.value || (currentUser.value?.client?.id as string),
      payload,
      isPortalUser.value
    );
  },
  {
    onSuccess: (data) => {
      initToast({
        actionType: 'Create',
        severity: 'success',
        summary: 'Success',
        detail: `A download link has been sent to your email address with the files/folders you requested.`
      });
    }
  }
);
async function handleDownload() {
  const payload = {
    folderIds: [(dataToModify.value as DocumentFile).id as string]
  };
  await downloadFileAndFolder(payload as unknown as DownloadFilesAndFolders);
}

const { mutateAsync: handleExtraction, isLoading: extractingData }
  = useMutation(
    ['docment-extract'],
    ({
      clientId,
      isAutoTag,
      isAutoExtraction,
      fileId
    }: {
      fileId: string;
      clientId: string;
      isAutoExtraction: boolean;
      isAutoTag: boolean;
    }) => {
      return extractData({
        fileId,
        isAutoExtraction: aiSettings?.value?.enableExtraction as boolean,
        isAutoTag: aiSettings?.value?.enableClassification as boolean,
        clientId: isPortalUser.value ? currentUser.value?.client?.id as string : clientId
      });
    },
    {
      onSuccess: () => {
        initToast({
          actionType: 'Update',
          summary: `Document Extraction`,
          detail: `Document extraction has been started successfully.`
        });
        queryClient.invalidateQueries('files-list');
        queryClient.invalidateQueries('document-limit');
        queryClient.invalidateQueries('extraction-limit');
      }
    }
  );

async function startExtraction(data: any) {
  selectedFile.value = data;
  await handleExtraction({
    fileId: data.id,
    isAutoExtraction: aiSettings?.value?.enableExtraction as boolean,
    isAutoTag: aiSettings?.value?.enableClassification as boolean,
    clientId: isPortalUser.value
      ? currentUser.value?.client?.id as string
      : clientId.value
  });
}

const selectAll = computed({
  get() {
    return isSelectedDoc.value.length === allDocumentsData.value.length;
  },
  set(val) {
    if (val) {
      isSelectedDoc.value = allDocumentsData.value;
      allDocumentsData.value.forEach((item: any) => {
        item.checked = true;
      });
    }
    else {
      isSelectedDoc.value = [];
      allDocumentsData.value.forEach((item: any) => {
        item.checked = false;
      });
    }
  }
});

function handleSelect(e: any) {
  const foundDocIndex = listViewData.value?.findIndex(
    (item: any) => item.id === e.id
  );
  if (e.checked) {
    allDocumentsData.value = [
      ...allDocumentsData.value.map((item: any) => ({
        ...item,
        checked: item.id === e.id
      }))
    ];
    /* if (foundDocIndex !== -1) {
    } */
    isSelectedDoc.value = [...isSelectedDoc.value, e];
  }
  else {
    allDocumentsData.value = [
      ...allDocumentsData.value.map((item: any) => ({
        ...item,
        checked: item.id !== e.id
      }))
    ];
    /* if (foundDocIndex !== -1) {
      (listViewData.value[foundDocIndex] as any)['checked'] = false;
    } */
    isSelectedDoc.value = (isSelectedDoc.value as DocumentFolder[])?.filter(
      (project: any) => project.id !== e.id
    );
  }
}

function handleRowClick(e: DataTableRowClickEvent) {
  navigateToItem(e.data);
}
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div class="flex justify-content-between mb-4 align-items-center">
    <div class="flex justify-content-start flex-1 overflow-hidden">
      <Breadcrumb
        v-if="folderBreadCrumbItems.items.length"
        :home="folderBreadCrumbItems.home"
        :model="folderBreadCrumbItems.items"
        class="border-1 border-gray-200 px-3 py-2"
      >
        <template #item="item">
          <span
            class="p-menuitem-link cursor-pointer"
            @click.prevent="gotoFolder(item.item)"
          >
            <i v-if="item.item.icon" :class="item.item.icon" />
            <span class="p-menuitem-text">{{ item.item.name }}</span>
          </span>
        </template>
      </Breadcrumb>
    </div>
    <div
      v-if="showMode"
      class="flex justify-content-end align-items-center my-3 folder-show-mode"
    >
      <div
        v-if="mode === 'grid' && !folderDetails?.isSmartFolder"
        class="flex justify-content-end px-2"
      >
        <div class="p-input-icon-left mr-auto">
          <i class="pi pi-search" />
          <InputText
            v-model="IsGridSearchedFileFolders"
            aria-label="Search Files or Folders"
            placeholder="Search Files or Folders"
            type="search"
            @update:model-value="onInput"
          />
        </div>
      </div>
      <span class="cursor-pointer" @click.prevent="mode = 'list'">
        <svg
          class="w-1.5rem h-1.5rem"
          :class="mode === 'grid' ? 'text-primary' : 'text-gray-300'"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clip-rule="evenodd"
          />
        </svg>
      </span>
      <span class="cursor-pointer" @click.prevent="mode = 'grid'">
        <svg
          class="w-1.5rem h-1.5rem"
          :class="mode === 'list' ? 'text-primary' : 'text-gray-300'"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </span>
    </div>
  </div>

  <transition-group name="slide-up">
    <div v-if="mode === 'grid'" key="grid">
      <div
        v-if="
          (!fetchingFiles || !fetchingFolders)
            && !folderData?.length
            && !files?.length
        "
        class="text-center"
      >
        <i class="pi pi-folder-open text-8xl" />
        <h4 class="text-xl">
          Folder is empty
        </h4>
      </div>
      <div v-else>
        <div id="folders">
          <div v-if="fetchingFolders" class="text-center px-4 pb-4">
            <CommonLoading />
          </div>
          <div
            v-else-if="folderData?.length"
            class="grid flex-wrap column-gap-3 row-gap-3 align-items-center px-4 pb-4"
          >
            <template v-for="folder in folderData" :key="folder.id">
              <div
                v-if="!isPortalUser || (isPortalUser && folder.clientReadable)"
                v-tooltip.top="folder.name"
                :title="folder.name"
                class="cursor-pointer w-12rem border-1 border-round-md border-gray-200 flex flex-row align-items-center p-1 hover:border-primary-100 hover:bg-primary-100"
                :class="
                  isSelectedFolder(folder)
                    ? 'border-primary-300 bg-primary-100'
                    : ''
                "
                @dblclick.prevent="navigateToItem(folder)"
                @click.prevent="selectCurrentFolder(folder)"
              >
                <div class="w-2rem h-2rem">
                  <img
                    v-if="folder.isSmartFolder"
                    src="/images/icons/smart-folder.png"
                  >
                  <svg
                    v-else
                    class="w-2rem h-2rem text-yellow-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                    />
                  </svg>
                </div>
                <div class="text-overflow-ellipsis truncate select-none mx-2">
                  {{ folder.name }}
                </div>
                <div class="ml-auto">
                  <Button
                    icon="pi pi-ellipsis-v"
                    class="p-button-sm p-button-secondary p-button-rounded p-button-text surface-ground hover:surface-100"
                    aria-haspopup="true"
                    :aria-controls="`overlay_menu_${folder.id}`"
                    @click.stop="
                      toggleMenu($event, `menu-${folder.id}` as string)
                    "
                  />

                  <Menu
                    :id="`overlay_menu_${folder.id}`"
                    :ref="`menu-${folder.id}`"
                    :model="filterFolderMenuItems(folder)"
                    :popup="true"
                  >
                    <template #item="{ item }">
                      <span
                        class="p-menuitem-link"
                        role="menuitem"
                        @click="menuClick(item, folder)"
                      >
                        <span
                          class="p-menuitem-icon pi"
                          :class="item.icon"
                        />
                        <span class="p-menuitem-text">{{ item.label }}</span>
                      </span>
                    </template>
                  </Menu>
                  <!-- <item-actions-dropdown
                    :key="folder.id"
                    :resource="folder"
                    :client="client"
                    mode="folder"
                    @download="downloadFolder(folder)"
                    @info="showInfo('Folder', folder)"
                    @delete="showDeleteConfirmation('Folder', folder)"
                    @open="navigateToItem(folder)"
                    @move="showMoveDialog('Folder', folder)"
                    @rename="showRenameResource('Folder', folder)"
                  /> -->
                </div>
              </div>
            </template>
          </div>
        </div>
        <div id="files">
          <div v-if="fetchingFiles" class="text-center px-4 pb-4">
            <CommonLoading />
          </div>
          <div
            v-else
            class="grid flex-wrap column-gap-3 row-gap-3 px-4 pb-4 mt-4 align-items-stretch relative"
          >
            <div
              v-for="file in files"
              :key="file.id"
              :ref="`file-${file.id}`"
              v-tooltip.top="file.filename"
              :title="file.filename"
              href
              class="cursor-pointer w-12rem border-1 border-round-md border-gray-200 hover:border-primary-300 hover:bg-primary-100 flex flex-column"
              :class="
                isSelectedFile(file) ? 'border-primary-300 bg-primary-100' : ''
              "
              @dblclick.prevent="handleFileNavigation(file)"
              @click.prevent="selectCurrentFile(file)"
            >
              <div class="p-3 border-bottom-1 border-gray-100 text-center">
                <img
                  class="w-5 h-auto mx-auto"
                  :src="`${fileIcon(file.path)}`"
                  alt="File Type"
                >
              </div>
              <div class="p-2">
                <div class="flex align-items-center">
                  <p class="truncate text-center select-none mb-0">
                    {{ file.name }}
                  </p>
                  <div class="ml-auto">
                    <Button
                      icon="pi pi-ellipsis-v"
                      class="p-button-sm p-button-secondary p-button-rounded p-button-text surface-ground hover:surface-100"
                      aria-haspopup="true"
                      aria-controls="overlay_menu"
                      @click.stop="
                        toggleMenu($event, `menu-${file.id}` as string)
                      "
                    />
                    <!-- <Menu
                      v-if="fileMenuItems?.length"
                      id="overlay_menu"
                      :ref="`menu-${file.id}`"
                      :model="fileMenuItems"
                      :popup="true"
                    /> -->
                    <Menu
                      :id="`overlay_menu_${file.id}`"
                      :ref="`menu-${file.id}`"
                      :model="filterFileMenuItems(file)"
                      :popup="true"
                    >
                      <template #item="{ item }">
                        <span
                          class="p-menuitem-link"
                          role="menuitem"
                          @click="menuClick(item, file)"
                        >
                          <Icon
                            v-if="item.iconify"
                            class="flex-none"
                            :icon="item.icon"
                            :class="item.iconClass"
                          />
                          <span
                            v-else
                            class="p-menuitem-icon pi"
                            :class="item.icon"
                          />
                          <span class="p-menuitem-text">
                            {{ item.label }}
                          </span>
                        </span>
                      </template>
                    </Menu>
                  </div>
                </div>
              </div>
              <!-- <div class="flex flex-column">
              </div> -->
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="mode === 'list'" key="list" class="mt-4">
      <DataTable
        v-model:selection="isSelectedDoc"
        :value="listViewData"
        responsive-layout="scroll"
        breakpoint="768px"
        :loading="
          loadingFiles
            || fetchingFiles
            || loadingFolders
            || fetchingFolders
            || searchIsFetching
        "
        :paginator="false"
      >
        <template #header>
          <div class="flex justify-content-end">
            <div
              v-if="!folderDetails?.isSmartFolder"
              class="p-input-icon-left mr-auto"
            >
              <i class="pi pi-search" />
              <InputText
                v-model="staticSearchText"
                aria-label="Search Files or Folders"
                placeholder="Search Files or Folders"
                type="search"
              />
            </div>
            <div>
              <ClientsBulkAction
                v-if="
                  isSelectedDoc
                    && isSelectedDoc.length > 0
                    && (!isPortalUser || folderDetails?.clientWritable)
                "
                :client-id="clientId || (currentUser.client?.id as string)"
                :label="bulkActionLabel"
                :disable-dropdown-btn="disableBulkAction"
                disable-tooltip="There is one or more smart folders selected. Please unselect them to do bulk actions."
                :document="isSelectedDoc"
                @success="isSelectedDoc = []"
              />
              <Button
                type="button"
                :icon="isFilters ? 'pi pi-filter-slash' : 'pi pi-filter'"
                class="p-button-icon-only p-button-rounded"
                :class="[{ 'p-button-danger': isFilters }]"
                @click="resetFilters"
              />
              <a
                href="https://brightreturn.com/kb/automated-document-processing"
                target="_blank"
              >
                <Button
                  v-tooltip.top="'Need Help'"
                  type="button"
                  icon="pi pi-question-circle text-lg"
                  class="p-button-icon-only p-button-rounded ml-2"
                />
              </a>
            </div>
          </div>
          <div v-if="hideFilter" class="my-2">
            <div class="flex gap-2 flex-wrap">
              <div>
                <MultiSelect
                  v-model="selectedTags"
                  class="w-full"
                  option-label="name"
                  option-value="id"
                  :options="optionsData"
                  :loading="loadingTag"
                  placeholder="Select a Tag"
                  :max-selected-labels="2"
                  filter
                  show-clear
                />
              </div>
              <Button
                label="Apply"
                class="w-full sm:w-auto"
                @click="applyFilters"
              />
            </div>
          </div>
        </template>
        <template #empty>
          <CommonLoading
            v-if="fetchingFiles || searchIsFetching || fetchingFolders"
          />
          <div v-else class="text-center">
            No Files found.
          </div>
        </template>
        <Column
          v-if="
            !(
              folderDetails?.isExtractionFolder || folderDetails?.isSmartFolder
            )
              && (!isPortalUser || folderDetails?.clientWritable)
          "
          `
          selection-mode="multiple"
        />

        <!-- <Column
          v-if="
            !folderDetails?.isExtractionFolder &&
            (!isPortalUser || folderDetails?.clientWritable)
          "
          headerStyle="width: 3rem"
        >
          <template #header>
            <Checkbox inputId="select-all" v-model="selectAll" :binary="true" />
          </template>
          <template #body="{ data }">
            <pre>{{ data }}</pre>
            <Checkbox
              inputId="select-one"
              v-model="data.checked"
              :binary="true"
              @change="handleSelect(data)"
              :disabled="data.isExtractionFolder"
            />
          </template>
        </Column> -->

        <!-- <Column
          header="Name"
          class="w-2"
          :="true"
          sortField="name"
          :showFilterMatchModes="false"
          :filterMenuStyle="{ width: '14rem' }"
          style="min-width: 14rem"
          filterField="name"
        >
          <template #body="{ data }">
            <span class="team-name">{{ data.name }}</span>
          </template>
        </Column> -->
        <Column
          header="Name"
          field="name"
          filter-field="name"
          sort-field="name"
          :show-filter-match-modes="false"
          :filter-menu-style="{ width: '14rem' }"
          style="min-width: 14rem;"
        >
          <template #body="{ data }">
            <div
              class="space-y-1.5"
              :class="[
                {
                  'cursor-pointer hover:underline':
                    canOpenDoc(data.name)
                    && data.documentKind !== 'File folder',
                },
                {
                  'cursor-pointer': data.documentKind === 'File folder',
                },
              ]"
              tabindex="0"
              role="link"
              @keyup.enter="navigateToItem(data)"
              @click.stop.prevent="navigateToItem(data)"
            >
              <div class="flex align-items-center">
                <template v-if="data.documentKind === 'File folder'">
                  <img
                    v-if="data.isSmartFolder"
                    src="/images/icons/smart-folder.png"
                    class="w-1.5rem h-auto mr-2"
                  >
                  <i v-else class="pi pi-folder mr-2 text-2xl" />
                </template>
                <img
                  v-else
                  class="w-2rem h-auto mr-2"
                  :src="`${fileIcon(data.path)}`"
                  :alt="data.name"
                >
                <span
                  class="font-medium text-gray-900"
                  :class="[
                    { 'hover:underline': data.documentKind === 'File folder' },
                  ]"
                >{{ data.name }}</span>
              </div>
            </div>
          </template>
        </Column>

        <Column header="Tag" class="w-3">
          <template #body="{ data }">
            <div
              v-if="data.documentKind !== 'File folder'"
              class="flex flex-wrap"
            >
              <CommonTags
                :data="{ tags: data.tags || [] }"
                tag-type="DOCUMENT"
                :client-id="clientId"
                :file-id="data.id"
                :folder-id="folderId"
                :is-portal="isPortalUser"
              />
            </div>
            <div v-else>
              NA
            </div>
          </template>
        </Column>
        <Column v-if="!isPortalUser" class="w-1 text-center">
          <template #header>
            <div class="flex flex-column align-items-center">
              <!-- <Icon
                icon="fluent-emoji:robot"
                class=""
                style="font-size: 1.5rem"
              /> -->
              <img
                src="/images/robot-icon.png"
                alt="app assistant robot"
                class="w-2rem"
              >
              <span class="font-medium">
                {{ 'Extraction' }}
              </span>
            </div>
          </template>
          <template #body="{ data }">
            <span
              v-if="data.summary && data.enableExtraction"
              tabindex="0"
              class="underline font-medium cursor-pointer text-blue-600 hover:text-blue-800 cursor-pointer"
              @click="handleSummaryData(data)"
              @keyup.enter="handleSummaryData(data)"
            >{{ 'View' }}</span>
            <template
              v-else-if="
                isImageOrPdf(data.contentType)
                  && aiSettings?.enableExtraction
                  && !data.enableExtraction
              "
            >
              <i
                v-if="extractingData && data.id === selectedFile?.id"
                class="pi pi-spin pi-spinner"
              />
              <span
                v-else
                class="underline font-medium cursor-pointer text-blue-600 hover:text-blue-800 cursor-pointer"
                tabindex="0"
                @click="startExtraction(data)"
                @keyup.enter="startExtraction(data)"
              >{{ 'Extract' }}</span>
            </template>
            <span
              v-else-if="
                aiSettings?.enableExtraction
                  && data.enableExtraction
                  && !data.summary
              "
            >In Process</span>
            <span v-else>{{ 'NA' }}</span>
          </template>
        </Column>
        <Column
          header="Type"
          filter-field="documentKind"
          sort-field="documentKind"
        >
          <template #body="{ data }">
            <span class="team-name">{{ data.documentKind }}</span>
          </template>
        </Column>
        <Column
          header="Date Created"
          filter-field="createdAt"
          sort-field="createdAt"
        >
          <template #body="{ data }">
            <span class="team-name">{{ data.createdAt ? dateToHumanShort(data.createdAt) : 'None' }}
            </span>
          </template>
        </Column>
        <Column header="Actions">
          <template #body="{ data }">
            <Button
              icon="pi pi-ellipsis-v"
              class="p-button-sm p-button-secondary p-button-rounded bg-primary"
              aria-haspopup="true"
              :aria-controls="`overlay_menu_${data.id}`"
              :disabled="isSelectedDoc.some((val: any) => val.id === data.id)"
              @click.stop="toggleMenu($event, `menu-${data.id}` as string)"
            />
            <Menu
              :id="`overlay_menu_${data.id}`"
              :ref="`menu-${data.id}`"
              :model="
                data.filename
                  ? filterFileMenuItems(data as DocumentFile)
                  : filterFolderMenuItems(data as DocumentFolder)
              "
              :popup="true"
            >
              <template #item="{ item }">
                <span
                  class="p-menuitem-link"
                  role="menuitem"
                  @click="menuClick(item, data)"
                >
                  <Icon
                    v-if="item.iconify"
                    class="flex-none"
                    :icon="item.icon"
                    :class="item.iconClass"
                  />
                  <span
                    v-else
                    class="p-menuitem-icon pi"
                    :class="item.icon"
                  />
                  <span class="p-menuitem-text">
                    {{ item.label }}
                  </span>
                </span>
              </template>
            </Menu>
          </template>
        </Column>
      </DataTable>
    </div>
  </transition-group>

  <Dialog
    v-model:visible="updateDialog"
    content-class="border-round-bottom border-top-1 surface-border p-0"
    modal
    :header="modalHeader"
    :breakpoints="{ '640px': '75vw' }"
    :style="{ width: '25vw' }"
  >
    <ClientsDocumentEditForm
      :data-to-modify="dataToModify"
      :edit-type="editType"
      :edit-data-type="editDataType"
      @success="handleUpdateSucces"
    />
  </Dialog>

  <Dialog
    v-model:visible="updateFolderDialog"
    content-class="border-round-bottom-md"
    modal
    header="Update Folder Permissions"
    :breakpoints="{ '640px': '75vw' }"
    :style="{ width: '35vw' }"
  >
    <ClientsDocumentCreateFolder
      :folder-to-update="selectedFolder"
      @success="handleUpdateSucces"
    />
  </Dialog>
  <Dialog
    v-model:visible="isGetInfo"
    content-class="border-round-bottom-md"
    modal
    header="File Information"
    :breakpoints="{ '640px': '75vw' }"
    :style="{ width: '35vw' }"
  >
    <ClientsDocumentGetInfo
      :file-details="selectedFile"
    />
  </Dialog>

  <Dialog
    v-model:visible="isMoveTo"
    content-class="border-round-bottom-md"
    modal
    header="Select Folder"
    :breakpoints="{ '640px': '75vw' }"
    :style="{ width: '35vw' }"
  >
    <ClientsDocumentMove
      :source-id="(selectedFolder?.id || selectedFile?.id) as string"
      @select="handleMoveSelection"
      @cancel="isMoveTo = false"
    />
  </Dialog>

  <Dialog
    v-model:visible="summaryDlgVisible"
    content-class="border-round-bottom-md"
    modal
    :breakpoints="{ '640px': '75vw' }"
    :style="{ width: '35vw' }"
    header="Extracted data from document"
  >
    <template #header>
      <div class="flex w-full justify-content-between align-items-center mr-4">
        <span class="capitalize p-dialog-title">
          Extracted data from document
        </span>

        <Button
          v-if="summaryData?.length"
          v-tooltip.top="'Download Extracted Data'"
          icon="pi pi-download"
          class="p-button-rounded"
          @click="exportToCSV(summaryData)"
        />
      </div>
    </template>
    <div>
      <DataTable
        ref="reportsTableRef"
        data-key="id"
        v-bind="tableAttrs"
        :value="summaryData"
        :rows="summaryData?.length || 15"
        :export-filename="
          selectedFile
            ? getFilename(selectedFile?.name as string)
            : 'Extracted Data'
        "
      >
        <Column header="Extracted Field" field="field">
          <template #body="{ data }">
            <span class="uppercase">{{ data.field }}</span>
          </template>
        </Column>
        <Column header="Value" field="value">
          <template #body="{ data }">
            {{ data.value }}
          </template>
        </Column>
      </DataTable>
    </div>
  </Dialog>
  <CommonConfirmRemoveDialog
    v-if="removeDialog"
    :visible="removeDialog"
    :title="`Confirm Delete ${editDataType}`"
    :record-to-remove="dataToModify as unknown as Record<string, unknown>"
    @confirm="(() => deleteDoc)()"
    @hide="removeDialog = false"
  />
</template>

<style scoped lang="scss">
.file-icons {
  &::before {
    color: $primaryColor;
  }
}

.pi-custom {
  &::before {
    background-color: #83888f;
  }

  &.file-icon {
    &::before {
      background-color: $primaryColor;
    }
  }
}

:deep(.p-breadcrumb) {
  position: unset;
  width: auto !important;
  margin-right: 1rem;
  background-color: transparent !important;

  .p-breadcrumb-list {
    // background: red;
    li {
      padding: 0 2px;

      &.p-menuitem-seperator {
        margin: 0 0.5rem;
      }

      .p-menuitem-text {
        white-space: nowrap;
      }
    }
  }
}

:deep(.p-datatable-wrapper) {
  .p-datatable-tbody > tr.p-highlight {
    color: #69707a;
    background-color: #eff6ff !important;
  }
}
</style>
