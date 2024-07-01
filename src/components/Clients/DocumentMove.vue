<script setup lang="ts">
import type { DocumentFile, DocumentFolder } from '@/types/documents.type';
import { useRouteQuery } from '@vueuse/router';
import type { TreeNode } from 'primevue/treenode';
import { useQuery, useQueryClient } from 'vue-query';

const props = defineProps<{
  sourceId?: string | string[];
  clientId?: string;
  isSave?: boolean;
  isMoving?: boolean;
  isESignature?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', id: string | null): void;
  (e: 'cancel'): void;
}>();

const { getFolder, getFiles, getFolders } = useDocuments();
const { isPortalUser } = useCurrentUserData();
const route = useRoute();
const clientIdParam = props.clientId
  ? ref(props.clientId)
  : ref(route.params.id as string);
const folderId = useRouteQuery<string>('folderId');
const selectedId = ref<string>('');
const fileData = ref<DocumentFile[]>();

const queryClient = useQueryClient();

let selectedNode: Record<string, unknown>;
const nodes = ref<TreeNode[]>([]);

const { isLoading: fileLoading } = useQuery(
  ['files-list'],
  () => {
    return getFiles({
      id: clientIdParam.value as string,
      folderId: folderId.value ? (folderId.value as string) : undefined,
      isPortal: isPortalUser.value
    });
  },
  {
    onSuccess(data) {
      fileData.value = data;
    },
    enabled: !!clientIdParam
  }
);

const { isLoading, isFetching } = useQuery(
  ['get-folder', selectedId],
  () => {
    if (selectedId.value) {
      return getFolder({
        id: clientIdParam.value as string,
        folderId: selectedId.value,
        isPortal: isPortalUser.value
      });
    }
    else
      return getFolders({
        id: clientIdParam.value as string,
        isPortal: isPortalUser.value
      });
  },
  {
    onSuccess(data) {
      if (selectedId.value) {
        selectedNode.children = (data as DocumentFolder)?.children?.map(
          (el: DocumentFolder) => {
            return {
              key: el.id,
              label: el.name,
              children: props.sourceId !== el.id ? el.children : undefined,
              selectable: isSelectable(el.id)
            };
          }
        );
      }
      else {
        const subFolders = (data as DocumentFolder[])
          ?.filter((item: DocumentFolder) =>
            isPortalUser.value
              ? item.clientWritable
              : !(item.isExtractionFolder || item.isSmartFolder)
          )
          .map((val: DocumentFolder) => {
            return {
              key: val.id,
              label: val.name,
              children: isSelectable(val.id)
                ? val.children?.map((el: DocumentFolder) => {
                  return { key: el.id, label: el.name };
                })
                : undefined,
              selectable: isSelectable(val.id)
            };
          }) as unknown as DocumentFolder[];
        const addingFiles = (fileData?.value as unknown as DocumentFile[]).map(
          (val: DocumentFile) => {
            return {
              key: val.id,
              label: val.name,
              selectable: isSelectable(val.id)
            };
          }
        ) as unknown as DocumentFile[];
        if (props.isESignature) {
          addingFiles.forEach((arr) => {
            subFolders.push({ ...arr });
          });
        }
        nodes.value = [
          {
            key: 'root',
            label: 'Root',
            children: subFolders
          }
        ];
      }
    }
  }
);

const selectedKey = ref<Record<string, unknown>>();

function onNodeExpand(node: any) {
  if (node.key === 'root')
    return;
  selectedId.value = node.key;
  selectedNode = node;
}

function moveSelected() {
  if (selectedKey.value) {
    const id = getId(selectedKey.value);
    emit('select', id === 'root' ? null : id);
  }
}

function getId(key: Record<string, unknown>) {
  return Object.keys(key)[0];
}

function isSelectable(id: string) {
  if (typeof props.sourceId === 'string') {
    if (props.sourceId !== id)
      return true;
  }
  else if (Array.isArray(props.sourceId)) {
    if (!props.sourceId.includes(id))
      return true;
  }
  else return false;
}
const tooltipText = computed(() => {
  if (selectedKey.value && props.sourceId) {
    const id = getId(selectedKey.value);
    if (isPortalUser.value && id === 'root')
      return 'Cannot move to root folder';
    if (!isSelectable(id))
      return 'Source folder is same as the destination folder';
    if (props.sourceId.length && !folderId.value && id === 'root')
      return 'Cannot move to same folder';
    if (props.sourceId.length && folderId.value === id)
      return 'Cannot move to same folder';
    return `${props.isSave ? 'Save' : 'Move'} to selected folder`;
  }
  return 'Select a folder';
});

const isMoveDisabled = computed(() => {
  if (selectedKey.value && props.sourceId) {
    const id = getId(selectedKey.value);
    if (isPortalUser.value && id === 'root')
      return true;
    if (!isSelectable(id))
      return true;
    if (props.sourceId.length && !folderId.value && id === 'root')
      return true;
    if (props.sourceId.length && folderId.value === id)
      return true;
    return false;
  }
  return true;
});

watch(
  () => props.clientId,
  (val) => {
    if (val) {
      clientIdParam.value = val;
      selectedId.value = '';
      selectedKey.value = {};
      queryClient.invalidateQueries(['get-folder', selectedId]);
    }
  }
);
</script>

<template>
  <div>
    <Tree
      v-model:selectionKeys="selectedKey"
      :value="nodes"
      :loading="isLoading || isFetching || fileLoading"
      selection-mode="single"
      @node-expand="onNodeExpand"
    />
    <div class="flex justify-content-between mt-2">
      <Button
        class="p-button-danger"
        label="cancel"
        @click="emit('cancel')"
      />
      <span v-tooltip.bottom="tooltipText">
        <Button
          class="p-button-primary"
          :label="props.isSave ? 'Save' : 'Move'"
          :loading="isMoving"
          :disabled="isMoveDisabled"
          @click="moveSelected"
        />
      </span>
    </div>
  </div>
</template>
