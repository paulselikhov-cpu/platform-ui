import { initFederation } from '@angular-architects/native-federation';
import { environment } from './environments/environment'; // для прода и для dev разные remotes

initFederation(environment.remotes)
  .catch(err => console.error(err))
  .then(() => import('./bootstrap'))
  .catch(err => console.error(err));