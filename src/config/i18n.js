const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const path = require('path');

i18next
  .use(Backend)
  .init({
    backend: {
      loadPath: path.join(__dirname, '../translations/{{lng}}.json')
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar', 'es'],
    preload: ['en', 'ar', 'es'],
    interpolation: {
      escapeValue: false
    }
  });

module.exports = i18next;

