const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'babich-chat-ui',



  exposes: {
    // Экспортируем главный модуль приложения или отдельный компонент
    './App': './projects/babich-chat-ui/src/app/app.ts',
    // Если хотите загружать конкретный компонент, можно экспортировать его:
    // './ChatComponent': './projects/babich-chat-ui/src/app/chat/chat.component.ts'
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
  ],

  features: {
    ignoreUnusedDeps: true
  }
});
