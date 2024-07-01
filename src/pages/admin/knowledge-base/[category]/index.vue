<script setup lang="ts">
import router from '@/router';
import type {
  CreateQuery,
  FAQ,
  KnowledgeBaseMessages
} from '@/types/knowlege-base.type';
import { useRouteQuery } from '@vueuse/router';
import { useMutation, useQuery } from 'vue-query';

const route = useRoute();
const { getFAQs, getAnswer, getThreadId } = useKnowledgeBase();
const { titleCase } = useVueFilters();
const categoryKey = ref(route.params.category as string);
const customQuestion = ref<string>();
const customQuestionError = ref<string | null>(null);
const isQuestionSent = ref(false);
const queries = ref<KnowledgeBaseMessages>();
const question = useRouteQuery('question');
const shareMessage = ref(false);
const subscribeDialog = ref(false);
const container = ref<HTMLElement>();
const isErrorStatus406 = ref(false);
const selectedFaq = ref<FAQ>();
const broadcastTo = ref('client');
const questionPayload = ref<CreateQuery>();
const globalThreadId = ref<number>(0);
provide('broadcastTo', broadcastTo.value);

const { data: faqs, isLoading } = useQuery(
  ['faqs', categoryKey],
  () => getFAQs(categoryKey.value),
  {
    enabled: !!categoryKey.value
  }
);

const { updateBreadcrumb } = useBreadcrumbs();
const { getStringToHTML, replaceNewlines } = useUtilityFns();
const { canDo, featureSubscribed } = usePermissions();

updateBreadcrumb({
  breadcrumbs: [
    {
      label: 'KnowledgeBot',
      to: {
        name: 'admin-knowledge-base'
      }
    },
    {
      label: titleCase(categoryKey.value, '_')
    }
  ]
});

const { mutateAsync: getThread } = useMutation(() => getThreadId(), {
  onSuccess: async (data) => {
    globalThreadId.value = data.thread_id;
    await askQuestion({ threadId: globalThreadId.value, queries: questionPayload.value });
  }
});

const { mutateAsync: askQuestion, isLoading: askingQuestion } = useMutation(
  async ({ threadId, queries }: { threadId: number; queries?: CreateQuery }) => await getAnswer(threadId, queries),
  {
    onSuccess: (data) => {
      queries.value = data;
      if (data?.messages?.length && data.messages[0]?.content) {
        updateBreadcrumb({
          breadcrumbs: [
            {
              label: 'KnowledgeBot',
              to: {
                name: 'admin-knowledge-base'
              }
            },
            {
              label: titleCase(categoryKey.value, '_'),
              to: {
                name: 'admin-knowledge-base-category',
                params: { category: categoryKey.value }
              }
            },
            {
              label: data?.messages[0]?.content,
              class: 'breadcrumb-ellipse knowledge-base'
            }
          ]
        });
      }
      customQuestion.value = '';
    },

    onError: (error: Record<string, any>) => {
      console.log(error);
      customQuestion.value = '';
      if (error?.response?.status === 406) {
        isErrorStatus406.value = true;
      }
    }
  }
);

async function handleSend() {
  isQuestionSent.value = true;
  if (!customQuestion.value) {
    customQuestionError.value = 'Please enter a question';
    return;
  }
  if (!question.value) {
    router.push({
      query: {
        question: customQuestion.value
      }
    });
  }
  else {
    const previousQueries = queries.value?.messages || [];
    const payload: CreateQuery = {
      partition_name: categoryKey.value,
      messages: [
        ...previousQueries.map(query => ({
          ...query,
          metadata:
            typeof query.metadata === 'string'
              ? query.metadata
              : JSON.stringify(query.metadata)
        })),
        { content: customQuestion.value, role: 'user' }
      ]
    };
    questionPayload.value = payload;
    if (previousQueries.length === 0) {
      await getThread();
    }
    else {
      await askQuestion({ threadId: globalThreadId.value, queries: payload });
    }
  }
}

function handleShare(faq: FAQ) {
  if (featureSubscribed('knowledgebot', 'share') === false) {
    subscribeDialog.value = true;
    return;
  }
  shareMessage.value = true;
  selectedFaq.value = faq;
}

function handleRating(index: any, rating: any) {
  const messages = queries.value?.messages;
  if (messages && messages[index]) {
    messages[index].rating = rating;
  }
}

watch(
  () => question,
  () => {
    if (question.value) {
      customQuestion.value = question.value as string;
      handleSend();
    }
  },
  {
    immediate: true,
    deep: true
  }
);

watchEffect(() => {
  if (queries.value) {
    setTimeout(() => {
      if (container.value)
        container.value.scrollTop = container.value.scrollHeight;
    }, 100);
  }
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <CommonPage>
    <template #title>
      <h1 class="font-medium text-3xl text-primary mb-0 relative max-w-max">
        {{
          shareMessage
            ? 'Share Message to Clients'
            : isQuestionSent
              ? 'Ongoing Conversation'
              : 'Trending Questions'
        }}
        <Tag
          v-if="isQuestionSent"
          rounded
          value="Beta"
          class="py-0 text-white beta-tag absolute"
          :style="{ right: '-40px' }"
        />
      </h1>
    </template>
    <div class="card">
      <BroadcastAddBroadcast
        v-if="shareMessage"
        is-from-knowledgebot
        :knowledge-base-message="selectedFaq"
        @back="shareMessage = false"
      />
      <template v-else>
        <CommonLoading v-if="isLoading || askingQuestion" />
        <div v-else>
          <span v-if="isQuestionSent" class="mt-4">
            <strong>Disclaimer</strong> : BrightAssistant generates results
            based on the information provided from multiple sources and does not
            assume responsibility for the accuracy of these results.
          </span>
          <div class="sub-container">
            <div ref="container" class="overflow-y-auto mb-3">
              <Accordion v-if="!isQuestionSent">
                <AccordionTab v-for="faq in faqs" :key="faq.question">
                  <template #header>
                    <h6 class="m-0">
                      {{ faq.question }}
                    </h6>
                  </template>
                  <div>
                    <span class="mt-4">
                      <strong>Disclaimer</strong> : BrightAssistant generates
                      results based on the information provided from multiple
                      sources and does not assume responsibility for the
                      accuracy of these results.
                    </span>

                    <p
                      class="text-base mt-4"
                      v-html="replaceNewlines(faq.answer)"
                    />
                    <div>
                      <KnowledgeBaseSources
                        :sources="faq.sources"
                        class="mx-0"
                      />
                    </div>
                    <div class="flex align-items-center gap-2 mt-2">
                      <router-link
                        class="text-blue-500 bg-white cursor-pointer hover:underline"
                        :to="{
                          query: { question: faq.question },
                        }"
                      >
                        Continue Conversation
                      </router-link>
                      <Icon
                        v-if="canDo('broadcasts', 'create')"
                        v-tooltip.top="'Share with clients'"
                        icon="fluent:share-16-filled"
                        class="text-3xl text-primary cursor-pointer"
                        role="link"
                        @click="handleShare(faq)"
                        @keyup.enter="handleShare(faq)"
                      />
                    </div>
                  </div>
                </AccordionTab>
              </Accordion>
              <KnowledgeBaseMessagePreview
                v-else-if="queries?.messages"
                :queries="queries"
                :thread-id="globalThreadId"
                @share-message="handleShare"
                @send-rating="handleRating"
              />
            </div>
            <div>
              <div class="mb-2">
                <router-link
                  class="mt-3 text-blue-500 hover:underline mr-4"
                  :to="{
                    name: 'admin-knowledge-base',
                  }"
                >
                  Change Category
                </router-link>
                <router-link
                  v-if="isQuestionSent"
                  class="mt-3 text-blue-500 hover:underline"
                  :to="{
                    name: 'admin-knowledge-base-category',
                    params: { category: categoryKey },
                  }"
                >
                  New Conversation
                </router-link>
              </div>
              <form class="flex align-items-end" @submit.prevent="handleSend">
                <div class="flex-1 mr-2">
                  <Textarea
                    v-model="customQuestion"
                    rows="3"
                    class="w-full"
                    placeholder="Ask a question"
                    :disabled="isErrorStatus406"
                    @input="customQuestionError = null"
                  />
                  <p class="text-red-500 text-sm mt-1">
                    {{ customQuestionError }}
                  </p>
                </div>
                <Button
                  v-tooltip="'Send'"
                  icon="pi pi-send"
                  type="submit"
                  class="border-circle"
                  :loading="askingQuestion"
                  :disabled="isErrorStatus406"
                />
              </form>
            </div>
            <router-link
              v-if="isErrorStatus406"
              class="mt-3 text-blue-500 hover:underline"
              :to="{
                name: 'admin-knowledge-base-category',
                params: { category: categoryKey },
              }"
            >
              Start a New Conversation
            </router-link>
          </div>
        </div>
      </template>
    </div>
  </CommonPage>
  <CommonSubscribeDialog
    v-if="subscribeDialog"
    :visible="subscribeDialog"
    feature="share"
    @hide="subscribeDialog = false"
  />
</template>

<style lang="scss" scoped>
:deep(.p-accordion) {
  .p-accordion-tab {
    margin-bottom: 8px !important;
  }
}

.breadcrumb-ellipse {
  &.knowledge-base {
    width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.sub-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: calc(100vh - 343px);
}
</style>
