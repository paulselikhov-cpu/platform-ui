import { initFederation } from '@angular-architects/native-federation';

initFederation({
  'babich-chat-ui': 'http://localhost:4201/remoteEntry.json'
})
  .catch(err => console.error(err))
  .then(() => import('./bootstrap'))
  .catch(err => console.error(err));