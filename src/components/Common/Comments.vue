<script setup lang="ts">
import type { TaskComments } from '@/types/tasks.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { FullNameObj, User } from '@/types/teams.type';
import type { Attachment } from '@/types/attachment.type';
import type {
  CreateUpdateNote,
  Note,
  NoteResourceType
} from '@/types/note.type';
import type { ContentJSON } from '@/types/common.type';

type TaskCommentsAndNote = TaskComments & Note;

const props = defineProps<{
  taskId?: string;
  resourceId?: string;
  resourceType?: NoteResourceType;
  dashboard?: boolean;
}>();

const openAddTaskModal = ref(false);
const emptyCommentBox = ref<string>('');
const confirmDeleteDialog = ref(false);
const isAddCommment = ref(false);
const selectedComment = ref<TaskCommentsAndNote>();
const comments = ref<TaskComments[] & Note[]>([]);

const route = useRoute();
const { isLarge } = useCommonBreakPoints();
const queryClient = useQueryClient();
const { fullName, initials, relativeTime } = useVueFilters();
const { initToast } = useToasts();
const { getAttachmentUrl } = useAttachments();
const { isPortalUser } = useCurrentUserData();
const { canDo } = usePermissions();
const { getAll, create, update, remove } = useNotes();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const notesTask = ref({ description: '', notesId: '' });
const currentInstance = getCurrentInstance();

const clientId
  = route.name === 'admin-clients-id' ? ref(route.params.id as string) : ref('');
const { isFetching: gettingComments } = useQuery(
  'get-comment-list',
  async () => {
    if (props.taskId)
      return await useTaskComments(props.taskId, isPortalUser.value);
    if (props.resourceId)
      return await getAll(
        props.resourceId,
        props.resourceType as NoteResourceType
      );
  },
  {
    onSuccess: (data) => {
      if (data)
        comments.value = data as TaskComments[] & Note[];
    }
  }
);

const { mutateAsync: commentCreate, isLoading: createIsLoading } = useMutation(
  'comment-create',
  async (payload: TaskComments | CreateUpdateNote) => {
    if (props.taskId)
      return useTaskCommentCreate(
        props.taskId,
        payload as TaskComments,
        isPortalUser.value
      );
    if (props.resourceId)
      return create(
        payload as CreateUpdateNote,
        props.resourceType as NoteResourceType
      );
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Create',
        severity: 'success',
        summary: 'Success',
        detail: `${
          props.taskId ? 'Task Comment' : 'Note'
        } Created Successfully`
      });
      queryClient.invalidateQueries('get-comment-list');
      queryClient.invalidateQueries('audit-log-activity');
      emptyCommentBox.value = '';
      isAddCommment.value = false;
    }
  }
);
const { mutateAsync: commentUpdate, isLoading: updateIsLoading } = useMutation(
  'comment-update',
  async ({
    id,
    payload
  }: {
    id: string;
    payload: TaskComments | CreateUpdateNote;
  }) => {
    if (props.taskId)
      return useTaskCommentUpdate(
        id,
        props.taskId,
        payload as TaskComments,
        isPortalUser.value
      );
    if (props.resourceId)
      return update(
        id,
        payload as CreateUpdateNote,
        props.resourceType as NoteResourceType
      );
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        severity: 'success',
        summary: 'Success',
        detail: `${
          props.taskId ? 'Task Comment' : 'Note'
        } Updated Successfully`
      });
      queryClient.invalidateQueries('get-comment-list');
      emptyCommentBox.value = '';
    }
  }
);
const { mutateAsync: deleteComment } = useMutation(
  'delete-comment',
  async (id: string) => {
    if (props.taskId)
      return useTaskCommentDelete(id, props.taskId, isPortalUser.value);
    if (props.resourceId)
      return remove(id, props.resourceType as NoteResourceType);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Delete',
        severity: 'error',
        summary: props.taskId ? 'Task Comment' : 'Note',
        detail: `${
          props.taskId ? 'Task Comment' : 'Note'
        } Deleted successfully`
      });
      queryClient.invalidateQueries('get-comment-list');
    }
  }
);

function handleOpenNotes(comment: any) {
  notesTask.value.notesId = comment.id;
  notesTask.value.description = comment.content.content;
  openAddTaskModal.value = true;
}

function handleInvalidateDashboard() {
  if (route.name === 'index') {
    queryClient.invalidateQueries('dashboard-home');
  }
  if (route.name === 'admin-clients-id') {
    queryClient.invalidateQueries('dashboard-client');
  }
}

function handleClose() {
  openAddTaskModal.value = false;
  handleInvalidateDashboard();
}

function handleAddComment(comment: string) {
  let payload: TaskComments | CreateUpdateNote;
  if (props.taskId) {
    payload = { content: { content: comment } };
  }
  else {
    payload = {
      content: { content: comment },
      resourceId: props.resourceId as string,
      type: props.resourceType as NoteResourceType
    };
  }
  commentCreate(payload);
}
function handleUpdateComment(comment: string, id: string) {
  const payload = { content: { content: comment } };
  commentUpdate({ id, payload });
}
function handleDeleteComment(comment: TaskCommentsAndNote) {
  selectedComment.value = comment;
  confirmDeleteDialog.value = true;
}
function triggerCommentUpdate(index: number) {
  if (currentInstance?.refs[`comment-editor-${index}`]) {
    (currentInstance?.refs[`comment-editor-${index}`] as any[])[0].onSubmit();
  }
}
function handleDelete() {
  if (selectedComment.value) {
    deleteComment(selectedComment.value.id as string);
  }
}
</script>

<template>
  <div>
    <CommonLoading v-if="gettingComments" />
    <div
      v-else
      class="flex flex-column row-gap-3"
      :class="{ 'card-container': dashboard && !isAddCommment }"
    >
      <div
        v-if="comments.length"
        class="comments-container flex flex-column row-gap-3"
      >
        <div v-for="(comment, index) in comments" :key="comment.id">
          <div class="flex align-items-start">
            <router-link
              :to="
                isLarge && !isPortalUser
                  ? {
                    name: 'admin-teams-id',
                    params: {
                      id: (comment?.createdBy || comment?.addedBy)?.id,
                    },
                  }
                  : {}
              "
              class="flex align-items-center cursor-pointer text-gray-900 hover:text-gray-600"
              :class="{
                'pointer-events-none':
                  isPortalUser || !canDo('users', 'single'),
              }"
            >
              <Avatar
                class="mr-2"
                :class="{
                  'bg-primary': !(
                    comment.createdBy
                    || comment.addedBy
                    || comment.addedBy
                  )?.picture,
                }"
                shape="circle"
              >
                <template
                  v-if="(comment.createdBy || comment.addedBy)?.picture"
                >
                  <img
                    class="bg-primary text-sm"
                    :src="`${getAttachmentUrl(
                      (
                        (comment.createdBy || comment.addedBy)
                          ?.picture as Attachment
                      ).path as string,
                    )}`"
                    :style="{ 'vertical-align': 'middle' }"
                    :alt="`${fullName(comment.createdBy || comment.addedBy)}-${
                      (comment.createdBy || comment.addedBy).id
                    }`"
                  >
                </template>
                <span v-else>
                  {{
                    `${initials(
                      fullName(
                        (comment.createdBy
                          || comment.addedBy) as unknown as FullNameObj,
                      ) as string,
                    )}`
                  }}
                </span>
              </Avatar>
            </router-link>
            <div class="flex-1">
              <router-link
                :disabled="isPortalUser"
                :to="
                  isLarge && !isPortalUser
                    ? {
                      name: 'admin-teams-id',
                      params: {
                        id: (comment.createdBy || comment.addedBy)?.id,
                      },
                    }
                    : {}
                "
                class="text-base font-medium text-gray-900 hover:text-gray-600"
                :class="{
                  'pointer-events-none':
                    isPortalUser || !canDo('users', 'single'),
                }"
              >
                {{
                  fullName((comment.createdBy || comment.addedBy) as User)
                }}
              </router-link>
              <span class="text-xs font-normal ml-1">{{
                relativeTime(comment.updatedAt as string)
              }}</span>
              <span>
                <span
                  v-if="!(comment as TaskComments).isEditing"
                  class="user-comment"
                  v-html="comment.content.content"
                />
                <!-- <CommonEditorForm
                  v-if="(comment as TaskComments).isEditing && isLarge"
                  @submit="
                    (com: string | ContentJSON) => {
                      handleUpdateComment(com as string, comment.id as string);
                    }
                  "
                  :label="`Update ${props.taskId ? 'Comment' : 'Note'}`"
                  :value="comment.content.content"
                  class="mt-2"
                  :commentBox="emptyCommentBox"
                  :loading="updateIsLoading"
                  hideCancelBtn
                /> -->
              </span>
            </div>
            <div>
              <Button
                v-if="
                  (canDo('comments', 'edit') || isPortalUser)
                    && !(comment as TaskComments).isEditing
                "
                v-tooltip.top="'Create Task'"
                icon="pi pi-plus"
                class="p-button-rounded p-button-text"
                @click="handleOpenNotes(comment)"
              />
              <Button
                v-if="
                  (canDo('comments', 'edit') || isPortalUser)
                    && !(comment as TaskComments).isEditing
                "
                icon="pi pi-pencil"
                class="p-button-rounded p-button-text"
                @click="(comment as TaskComments).isEditing = true"
              />
              <Button
                v-if="
                  (canDo('comments', 'edit') || isPortalUser)
                    && (comment as TaskComments).isEditing
                "
                v-tooltip.top="`Update ${props.taskId ? 'Comment' : 'Note'}`"
                icon="pi pi-check"
                class="p-button-rounded p-button-text"
                @click="triggerCommentUpdate(index)"
              />
              <Button
                v-if="
                  (canDo('comments', 'edit') || isPortalUser)
                    && (comment as TaskComments).isEditing
                "
                icon="pi pi-times"
                class="p-button-rounded p-button-text"
                @click="(comment as TaskComments).isEditing = false"
              />
              <Button
                v-if="canDo('comments', 'delete') || isPortalUser"
                icon="pi pi-trash"
                class="p-button-rounded p-button-text p-button-danger"
                @click="handleDeleteComment(comment as TaskCommentsAndNote)"
              />
            </div>
          </div>
          <div class="pr-2">
            <CommonEditorForm
              v-if="
                (canDo('comments', 'edit') || isPortalUser)
                  && (comment as TaskComments).isEditing
              "
              :ref="`comment-editor-${index}`"
              :label="`Update ${props.taskId ? 'Comment' : 'Note'}`"
              :value="comment.content.content"
              class="mt-2"
              :comment-box="emptyCommentBox"
              :loading="updateIsLoading"
              hide-cancel-btn
              @submit="
                (com: string | ContentJSON) => {
                  handleUpdateComment(com as string, comment.id as string);
                }
              "
            />
          </div>
        </div>
      </div>
      <!-- <Divider v-if="comments && comments.length > 0" /> -->
      <template v-if="canDo('comments', 'create') || isPortalUser">
        <div
          v-if="!isAddCommment"
          class="bg-gray-50 w-full cursor-pointer border-round-md"
          :style="{ padding: '10px' }"
          @click="isAddCommment = true"
        >
          <div class="bg-white p-2 w-full border-round-md">
            Share your {{ props.taskId ? 'Comments' : 'Notes' }} here...
          </div>
        </div>
        <CommonEditorForm
          v-else
          :comment-box="emptyCommentBox"
          :loading="createIsLoading"
          :label="taskId ? 'Post Comment' : 'Post Note'"
          class="mt-4"
          :placeholder="`${
            props.taskId ? 'Enter your comments here' : 'Enter your notes here'
          }`"
          @submit="(() => handleAddComment)()"
          @cancel="isAddCommment = false"
        />
      </template>
    </div>
  </div>
  <CommonConfirmRemoveDialog
    v-if="confirmDeleteDialog"
    :visible="confirmDeleteDialog"
    :title="`Confirm Delete ${props.taskId ? 'Task Comment' : 'Note'}`"
    @confirm="handleDelete"
    @hide="confirmDeleteDialog = false"
  >
    Are you sure you want to delete the
    {{ props.taskId ? 'comment' : 'note' }} from
    {{
      fullName(
        (selectedComment?.createdBy || selectedComment?.addedBy) as User,
      )
    }}?
  </CommonConfirmRemoveDialog>
  <Dialog
    v-model:visible="openAddTaskModal"
    :modal="true"
    append-to="body"
    header="Create Task with Notes"
    :breakpoints="defaultBreakpoints"
    :style="styles"
    content-class="border-round-bottom-md"
  >
    <TasksCreateMyTask
      :client-id="clientId"
      entity-type="TASK"
      :notes-task="notesTask"
      is-notes-task
      @close="handleClose"
    />
    <!-- <TasksMobileCreateUpdate
      v-else
      @close="
        openAddTaskModal = false;
        queryClient.invalidateQueries('dashboard-home');
      "
    /> -->
  </Dialog>
</template>

<style lang="scss" scoped>
:deep(.user-comment) {
  p {
    margin: 0;
    word-break: break-word;
  }
}
</style>
