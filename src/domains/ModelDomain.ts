import {Domain} from './Domain';

export interface ModelDomain {
  [key: string]: Domain<any> | ModelDomain;
}
