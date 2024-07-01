import { URL, fileURLToPath } from 'node:url';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import { PrimeVueResolver } from 'unplugin-vue-components/resolvers';
import vueform from '@vueform/vueform/vite';
import copy from 'rollup-plugin-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => ['stripe-pricing-table'].includes(tag)
        }
      }
    }),
    vueform(),
    copy({
      targets: [
        {
          src: 'node_modules/pspdfkit/dist/pspdfkit-lib',
          dest: 'public/js'
        }
      ],
      hook: 'buildStart'
    }),
    Pages(),
    Layouts(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'vue/macros',
        '@vueuse/core',
        '@vueuse/head',
        'vee-validate'
      ],
      dts: './src/auto-imports.d.ts',
      eslintrc: {
        enabled: true
      },
      dirs: ['./src/composables/**'],
      vueTemplate: true
    }),
    Components({
      dts: './src/components.d.ts',
      directoryAsNamespace: true,
      deep: true,
      resolvers: [PrimeVueResolver({})]
    })
  ],
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api/': {
        // target: 'http://127.0.0.1:9000',
        // target: 'https://brdev.fly.dev',
        target: 'https://app.brightreturn.com',
        changeOrigin: true
      }
    },
    port: 3000
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "./src/assets/sass/overrides/_theme_variables.scss";
          @import "./src/assets/sass/variables/theme/_theme_light.scss";
          @import "./src/assets/sass/variables/layout/_layout_common.scss";
        `
      }
    }
  }
});
