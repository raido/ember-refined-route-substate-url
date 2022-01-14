import HashLocation from '@ember/routing/hash-location';
import { inject as service } from '@ember/service';
import RouterTransitionAnalyzerService from 'ember-refined-route-substate-url/services/router-transition-analyzer';

export default class UpdateUrlEagerlyHashLocation extends HashLocation {
  @service('router-transition-analyzer')
  analyzer!: RouterTransitionAnalyzerService;

  constructor(...args: []) {
    super(...args);
    this.analyzer.onShouldUpdateURL(this.shouldUpdateURL);
  }

  willDestroy() {
    super.willDestroy();
    this.analyzer.offShouldUpdateURL(this.shouldUpdateURL);
  }

  private shouldUpdateURL = (path: string) => {
    this.setURL(path);
  };
}
