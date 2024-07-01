const appData = {
  target: 'BrightReturn',
  appName: 'Bright Return',
  logo: '/images/logos/logo-freya-single.svg',
  favicon: '/images/logos/logo-frya-single.svg',
  copyright: 'All Rights Reserved - Mudrantar Solutions Pvt Limited',
  currency: 'USD',
  currencySymbol: '$',
  logoAltText: 'Bright Return',
  displayName: 'MScan',
  supportEmail: 'support@eztaxpractice.com',
  termsAndConditions: 'https://mudrantar.com/usa/terms-and-conditions.html',
  zohoSupport:
    'https://desk.zoho.in/portal/api/web/inapp/73557000000304001?orgId=60014390709',
};

const AppConfig = appData;

const mock = {
  enableGlobalMock: import.meta.env.VUE_APP_ENABLE_MOCK_DATA === 'true',
};

export default AppConfig;

export { mock };
