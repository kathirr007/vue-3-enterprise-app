import app from '@/app';
import router from './router';
import { VueQueryPlugin, type VueQueryPluginOptions } from 'vue-query';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import Ripple from 'primevue/ripple';
import BadgeDirective from 'primevue/badgedirective';
import { DomHandler } from 'primevue/utils';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import 'quill-placeholder-module/dist/toolbar.css';
import 'nprogress/nprogress.css';
import '@novu/notification-center-vue/dist/style.css';
import './App.scss';
import ConfirmationService from 'primevue/confirmationservice';
import { Easing, registerScrollSpy } from 'vue3-scroll-spy';
import NotificationCenterPlugin from '@novu/notification-center-vue';
import { Icon } from '@iconify/vue';
import { createHead } from '@vueuse/head';
import Vueform from '@vueform/vueform';
import vueformConfig from '../vueform.config';
import Vue3Datatable from '@bhplugin/vue3-datatable';

const { $eventBus } = useMittEventBus();
const head = createHead();

const vueQueryConfig: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        retry: 0,
        refetchOnWindowFocus: false
      }
    }
  }
};

function getTarget(el: HTMLElement) {
  return DomHandler.hasClass(el, 'p-inputwrapper')
    ? DomHandler.findSingle(el, 'input')
    : el;
}

app.use(head);
app.use(PrimeVue);
app.directive('ripple', Ripple);
app.directive('badge', BadgeDirective);
registerScrollSpy(app, {
  easing: Easing.Cubic.In
});

app.directive('tooltip', {
  ...Tooltip,
  mounted(el) {
    const target = getTarget(el);
    target.$_ptooltipZIndex
      ??= app.config.globalProperties.$primevue.config.zIndex?.tooltip;
  }
});

app.config.globalProperties.$eventBus = $eventBus;

app.use(VueQueryPlugin, vueQueryConfig);
app.use(router);
app.use(ToastService);
app.use(ConfirmationService);
app.use(NotificationCenterPlugin);
app.use(Vueform, vueformConfig);
app.component('Icon', Icon);
app.component('Vue3Datatable', Vue3Datatable);
app.mount('#app');
