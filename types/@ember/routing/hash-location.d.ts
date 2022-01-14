import EmberObject from '@ember/object';

declare module '@ember/routing/hash-location' {
  // More info about interface over here - https://github.com/emberjs/ember.js/blob/v3.28.1/packages/%40ember/-internals/routing/lib/location/api.ts
  export default class HashLocation extends EmberObject {
    setURL(path: string): void;
  }
}
