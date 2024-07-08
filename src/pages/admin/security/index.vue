<script setup lang="ts">
import { useQuery } from 'vue-query';

const { metaFilter } = useUtilityFns();
const { currentUser, isPortalUser } = useCurrentUserData();
const { activeTabIndex, tabRef, handleTabChange } = useSteps('admin-security');

const { data: orgData, isLoading: orgLoading } = useQuery('org-data', () => {
  return useOrgDetails();
});
</script>

<template>
  <TabView
    ref="tabRef"
    v-model:activeIndex="activeTabIndex"
    lazy
    @tab-change="handleTabChange"
  >
    <TabPanel header="Audit Log">
      <CommonPage title="Audit Log">
        <AuditLogList />
      </CommonPage>
    </TabPanel>
    <TabPanel header="Setting">
      <CommonPage title="Setting">
        <template v-if="!isPortalUser">
          <FormTitle
            title="Set Auto Logout Interval"
            remove-divider
            class="mb-3"
          />
          <CommonLoading v-if="orgLoading" />
          <MyAccountAutoLogoutForm
            v-else-if="orgData"
            :interval="
              orgData?.meta
                ? metaFilter(orgData?.meta, 'autoLogoutInterval')
                : null
            "
            is-setting
            :user-id="currentUser.id"
          />

          <template v-if="!orgData?.isGoogleUser">
            <Divider />
            <FormTitle
              title="MFA Security"
              subtitle="Enable OTP-based Multi-factor authentication for your organization to keep your team member's account safe and secure."
              remove-divider
              class="mb-3"
            />
            <CommonLoading v-if="orgLoading" />
            <div v-else-if="orgData" class="grid formgrid">
              <div class="col-12 py-2 md:col-6">
                <AuditLogOrgMFA :org-details="{ ...orgData }" />
              </div>
            </div>
          </template>
        </template>
      </CommonPage>
    </TabPanel>
  </TabView>
</template>
