<script setup lang="ts">
import type { Client } from '@/types/client.type';
import type { TagType } from '@/types/tags.type';
import type { EntityType, Task } from '@/types/tasks.type';
import type { Project } from '@/types/project.type';

import { useMutation, useQueryClient } from 'vue-query';

const props = defineProps<{
  tagType?: TagType;
  data?: Partial<Client | Project | Task>;
  currentId?: string;
  isPortal?: boolean;
  taskEntityType?: EntityType;
  clientId?: string;
  fileId?: string;
  folderId?: string | null;
  disableCreate?: boolean;
}>();

const { defaultBreakpoints, styles } = useCommonBreakPoints();

const isDialogVisible = ref(false);
const queryClient = useQueryClient();

const { initToast } = useToasts();
const { deleteDocumentTag } = useTags();

const { mutateAsync: removeTag } = useMutation(
  ['tag-remove'],
  async (tagId: string) => {
    if (props.tagType === 'CLIENT')
      await useClientDeleteTags(props.currentId as string, tagId);
    if (props.tagType === 'PROJECT')
      await useProjectDeleteTags(props.currentId as string, tagId);
    if (props.tagType === 'DOCUMENT')
      await deleteDocumentTag({
        clientId: props.clientId as string,
        fileId: props.fileId as string,
        tagId
      });
    if (
      props.tagType === 'TASK'
      || props.tagType === 'CLIENTTASK'
      || props.tagType === 'SUPPORTTASK'
    ) {
      await useTaskDeleteTags(
        !!props?.isPortal,
        props.currentId as string,
        props.taskEntityType as EntityType,
        tagId
      );
    }
  },
  {
    onSuccess: () => {
      handleInvalidateQueries();
    }
  }
);

function handleCreate() {
  initToast({
    actionType: 'Add',
    summary: `Tag added`,
    detail: `Tag added successfully.`
  });
  isDialogVisible.value = false;
  handleInvalidateQueries();
}
function handleInvalidateQueries() {
  if (props.tagType === 'CLIENT')
    queryClient.invalidateQueries('client-details');
  if (props.tagType === 'PROJECT')
    queryClient.invalidateQueries('project-details');
  if (
    props.tagType === 'TASK'
    || props.tagType === 'CLIENTTASK'
    || props.tagType === 'SUPPORTTASK'
  ) {
    queryClient.invalidateQueries('task-details');
    queryClient.invalidateQueries('tasks-list');
  }
  if (props.tagType === 'DOCUMENT') {
    queryClient.invalidateQueries('files-list');
    queryClient.invalidateQueries('search-docs');
  }
}
</script>

<template>
  <div class="inline-flex align-items-center gap-1 flex-wrap">
    <template v-for="tag in data?.tags" :key="tag.id">
      <Tag class="cursor-pointer" :class="tag.bgColor" rounded>
        <div class="flex align-items-center gap-2">
          <span class="text-xs">{{ tag.name }} </span>
          <i
            v-if="tagType !== 'SUPPORTTASK' && !isPortal"
            class="pi pi-times text-xs cursor-pointer"
            tabindex="0"
            @click="removeTag(tag.id as string)"
          />
        </div>
      </Tag>
    </template>
    <Button
      v-if="!disableCreate && data?.type !== 'SUPPORTTASK' && !isPortal"
      v-tooltip.right="'Add Tag'"
      class="p-button-xs cursor-pointer p-0 justify-content-center align-items-center"
      :style="{ height: '21.28px', width: '21.28px' }"
      severity="success"
      rounded
      aria-label="tag"
      tabindex="0"
      @click="isDialogVisible = true"
    >
      <i class="pi pi-plus text-xs" />
    </Button>
  </div>
  <Dialog
    v-model:visible="isDialogVisible"
    :modal="true"
    append-to="body"
    header="Add Tag"
    :breakpoints="defaultBreakpoints"
    :style="styles"
    content-class="border-round-bottom-md"
    @hide="isDialogVisible = false"
  >
    <TagsAddTag
      :id="currentId"
      :tag-data="data?.tags"
      :tag-type="tagType as TagType"
      :is-portal="isPortal"
      :entity-type="taskEntityType"
      :client-id="clientId"
      :file-id="fileId"
      @close="isDialogVisible = false"
      @success="handleCreate"
    />
  </Dialog>
</template>
