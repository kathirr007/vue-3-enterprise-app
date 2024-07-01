<script setup lang="ts">
import router from '@/router';
import type {
  ClientUserClient,
  ClientUserSignInPayload
} from '@/types/auth.type';
import { useMutation, useQuery } from 'vue-query';
import { useCookies } from '@vueuse/integrations/useCookies';

const props = defineProps<{
  accountPage?: boolean;
}>();

const { getAllClients, signin } = useSwitchAccount();
const { getCurrentUser } = useMe();
const { currentUser, updateUserToken } = useCurrentUserData();
const { initToast } = useToasts();
const { fullName } = useVueFilters();

const cookies = useCookies(['user', 'userType']);

const selectedClient = ref<ClientUserClient>();

const {
  data: clients,
  isLoading,
  isFetching
} = useQuery('client-list', () => {
  return getAllClients(currentUser.value?.id as string);
});

const { mutateAsync: switchAccount, isLoading: signingIn } = useMutation(
  (data: ClientUserSignInPayload) => {
    return signin(data);
  }
);

async function handleSignin(data: ClientUserClient) {
  selectedClient.value = data;
  await switchAccount({
    clientId: data.id,
    orgId: data.org.id
  });

  userType.value = (cookies.get('userType'));

  const userData = await getCurrentUser(userType.value === 'CLIENT_USER');
  updateUserToken(userData);

  initToast({
    title: 'Client User',
    actionType: 'Sign in',
    detail: `Welcome back to <strong> ${'BrightReturn Client Portal'} ${
      currentUser.value?.client?.name
        ? ` - ${currentUser.value?.client?.name}`
        : ''
    }</strong>`
  });
  setTimeout(() => {
    router.push({ name: 'portal' });
  }, 1000);
}
</script>

<template>
  <CommonLoading v-if="isLoading" />
  <template v-else>
    <DataTable
      v-if="clients?.length"
      :value="clients"
      :loading="isLoading || isFetching"
    >
      <Column field="name" header="Account Name" />
      <Column header="Firm Name">
        <template #body="{ data }">
          <span>{{ data.org.name }}</span>
        </template>
      </Column>
      <Column class="w-2" header="Actions">
        <template #body="{ data }">
          <span
            v-tooltip="`${!data.isActive ? 'The account is disabled' : ''}`"
            class="inline-block"
          >
            <Button
              :disabled="!data.isActive"
              :loading="selectedClient?.id === data.id && signingIn"
              @click="handleSignin(data)"
            >
              {{
                currentUser?.client && data.id !== currentUser?.client?.id
                  ? 'Switch'
                  : 'Continue'
              }}
            </Button>
          </span>
          <div
            v-if="data.id === currentUser?.client?.id"
            class="font-medium text-green-500"
          >
            Current Account
          </div>
        </template>
      </Column>
    </DataTable>
    <div v-else class="card font-medium text-xl shadow-3 text-center">
      To activate your access, kindly reach out to your accountant.
    </div>
  </template>
</template>

<style lang="scss" scoped></style>
