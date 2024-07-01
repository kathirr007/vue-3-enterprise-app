<script setup lang="ts">
import { useQuery } from 'vue-query';

const { featureSubscribed } = usePermissions();
const { getCategories } = useKnowledgeBase();
const { data: categories, isLoading } = useQuery('categories', getCategories);
</script>

<template>
  <Common426
    v-if="featureSubscribed('knowledgebot', 'access_kb') === false"
    feature="knowledgeBot"
  />
  <div v-else>
    <CommonPage title="KnowledgeBot">
      <div class="card">
        <CommonLoading v-if="isLoading" />
        <div v-else>
          <h5 class="mb-5">
            Select Category to Proceed
          </h5>
          <div class="display-grid">
            <div
              v-for="(category, index) in categories"
              :key="index"
              class="card p-0 box-shadow reports-card h-full relative"
            >
              <router-link
                :to="{
                  name: 'admin-knowledge-base-category',
                  params: { category: category.key },
                }"
                class="flex flex-column align-items-center justify-content-center p-3 h-full card-link"
              >
                <span class="text-primary font-medium text-xl text-center">{{
                  category.title
                }}</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </CommonPage>
  </div>
</template>

<style lang="scss" scoped>
.display-grid {
  display: grid;
  grid-template-columns: repeat(1fr);
  grid-auto-rows: 1fr;
  gap: 30px;

  .reports-card {
    button {
      position: absolute;
      right: 20px;
      bottom: 20px;
    }
  }

  .card-link {
    border-radius: calc(10 / 15.2) * 1rem;
    transition: all 0.25s;

    .tile-icon {
      color: var(--gray-900);
    }

    &:hover {
      .tile-icon {
        color: $primaryColor;
      }

      box-shadow: inset 0 0 0 1px $primaryColor;
    }
  }

  @media screen and (width >= 576px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media screen and (width >= 992px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media screen and (width >= 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
