<script setup lang="ts">
import type { DocumentFolder } from '@/types/documents.type';
import type { TreeNode } from 'primevue/treenode';
import { useQuery } from 'vue-query';

const emits = defineEmits<{
  // (e: 'files-selected', files: MailsAttachmentResponse[]): void;
  (e: 'files-selected', val: { files: File[] }): void;
  (e: 'back'): void;
}>();

const { getFolders, getFolder, getFiles } = useDocuments();
const { getBlobFileFromUrl } = useUtilityFns();
const { getAttachmentUrl } = useAttachments();

let selectedNode: Record<string, unknown>;
const uploadingFiles = ref(false);
const selectedId = ref<string>('');
const selectedKeys = ref<any>(null);
const selectedFiles = ref<TreeNode[]>([]);
const nodes = ref<TreeNode[]>([]);
const treeRef = ref(null);
const filterValue = computed(() => {
  if (treeRef.value) {
    return (treeRef.value as any)?.filterValue;
  }
  return '';
});

const {
  isLoading: loadingFilesAndFolders,
  isFetching: fetchingFilesAndFolders
} = useQuery(
  ['get-folder', selectedId, filterValue],
  async () => {
    if (selectedId.value) {
      const folders = await getFolder({
        id: 'sampleId',
        folderId: selectedId.value,
        isGallery: true
      });
      const files = await getFiles({
        id: 'sampleId',
        folderId: selectedId.value,
        isGallery: true,
        term: (treeRef.value as any)?.filterValue
      });
      return { folders, files };
    }
    else {
      const folders = await getFolders({
        id: 'sampleId',
        isGallery: true
      });
      const files = await getFiles({
        id: 'sampleId',
        isGallery: true
      });
      return { folders, files };
    }
  },
  {
    onSuccess(data) {
      const { folders, files } = data;
      if (selectedId.value) {
        selectedNode.children = (folders as DocumentFolder)?.children?.map(
          (el: DocumentFolder) => {
            return {
              key: el.id,
              id: el.id,
              label: el.name,
              name: el.name,
              children: el.children?.length
                ? el.children
                : [
                    {
                      key: 'no-files',
                      id: 'no-files',
                      label: 'No Files or Folder',
                      name: 'No Files or Folder',
                      selectable: false
                    }
                  ],
              selectable: false
            };
          }
        );
        files.forEach((file) => {
          (selectedNode.children as Record<string, unknown>[])?.push({
            key: file.id,
            id: file.id,
            label: file.name,
            name: file.name,
            selectable: true,
            path: file.path,
            type: file.contentType
          });
        });
        if (!(folders as DocumentFolder)?.children?.length && !files.length) {
          selectedNode.children = [
            {
              key: 'no-files',
              id: 'no-files',
              label: 'No Files or Folders Found',
              name: 'No Files or Folders Found',
              selectable: false
            }
          ];
        }
      }
      else {
        const subFolders = (data.folders as DocumentFolder[])
          .filter(e => !(e.isSmartFolder || e.isExtractionFolder))
          .map((val: DocumentFolder) => {
            return {
              key: val.id,
              id: val.id,
              label: val.name,
              name: val.name,
              children: val.children?.length
                ? val.children?.map((el: DocumentFolder) => {
                  return {
                    key: el.id,
                    id: el.id,
                    name: el.name,
                    label: el.name
                  };
                })
                : [
                    {
                      key: 'no-files',
                      id: 'no-files',
                      Label: 'No Files or Folders Found',
                      name: 'No Files or Folders Found',
                      selectable: false
                    }
                  ],
              selectable: false
            };
          }) as unknown as DocumentFolder[];
        files.forEach((file) => {
          (subFolders as unknown as Record<string, unknown>[])?.push({
            key: file.id,
            id: file.id,
            label: file.name,
            name: file.name,
            selectable: true,
            path: file.path,
            type: file.contentType
          });
        });
        nodes.value = [
          {
            key: 'root',
            id: 'root',
            label: 'Root',
            name: 'Root',
            children: subFolders,
            selectable: false
          }
        ];
      }
    }
  }
);

function onNodeExpand(node: TreeNode) {
  if (node.key === 'root')
    return;
  selectedId.value = node.key as string;
  selectedNode = node;
}

async function moveSelected() {
  uploadingFiles.value = true;
  const filesPayload: File[] = [];
  const getLabel = (node: TreeNode) => {
    if (node.label?.includes('.')) {
      return node.label;
    }
    return `${node.label || ''}.${node.type?.split('/')[1]}`;
  };
  await Promise.all(
    selectedFiles.value.map(async (file: any) => {
      const blobFile = await getBlobFileFromUrl(getAttachmentUrl(file.path));
      const renamedFile = new File([blobFile], getLabel(file) as string, {
        type: file.type
      });
      filesPayload.push(renamedFile);
      return blobFile;
    })
  );
  // emits('files-selected', selectedFiles.value as MailsAttachmentResponse[]);
  emits('files-selected', { files: filesPayload });
}

function OnSelect(node: TreeNode) {
  const index = selectedFiles.value.findIndex(e => e.key === node.key);
  if (index === -1)
    selectedFiles.value.push(node);
}

function onUnSelect(node: TreeNode) {
  const index = selectedFiles.value.findIndex(e => e.key === node.key);

  if (index !== -1) {
    selectedFiles.value.splice(index, 1);
  }
}
</script>

<template>
  <div>
    <Tree
      ref="treeRef"
      v-model:selectionKeys="selectedKeys"
      :value="nodes"
      selection-mode="multiple"
      :meta-key-selection="false"
      :loading="loadingFilesAndFolders || fetchingFilesAndFolders"
      @node-expand="onNodeExpand"
      @node-select="OnSelect"
      @node-unselect="onUnSelect"
    />
    <div class="flex justify-content-between mt-2">
      <Button
        label="Back"
        icon="pi pi-chevron-left"
        class="max-w-max p-button-text"
        @click="emits('back')"
      />
      <Button
        class="p-button-primary"
        label="Submit"
        :loading="uploadingFiles"
        @click="moveSelected"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
