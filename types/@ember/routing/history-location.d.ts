import EmberObject from '@ember/object';

declare module '@ember/routing/history-location' {
  // More info about interface over here - https://github.com/emberjs/ember.js/blob/v3.28.1/packages/%40ember/-internals/routing/lib/location/api.ts
  export default class HistoryLocation extends EmberObject {
    protected history: History;
    replaceURL(url: string): void;
    setURL(path: string): void;
    getURL(): string;
  }
}
