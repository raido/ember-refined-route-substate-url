import HistoryLocation from '@ember/routing/history-location';
import { inject as service } from '@ember/service';
import RouterTransitionAnalyzerService from 'ember-refined-route-substate-url/services/router-transition-analyzer';

/**
 * We are overriding HistoryLocation https://api.emberjs.com/ember/3.28/classes/HistoryLocation
 *
 * Which is powering HistoryAPI based routing.
 *
 * Since we push "middle state" eagerly for destination route URLs, we need to force
 * replaceState for those states, so user would not get "double back button" behaviour.
 *
 * It's quite clever trick in itself, should be relatively safe from runtime perspective,
 * as we only do replaceState instead of pushState if previous history state has special flag.
 */

export default class UpdateUrlEagerlyHistoryLocation extends HistoryLocation {
  @service('router-transition-analyzer')
  analyzer!: RouterTransitionAnalyzerService;

  private get historyStateKey() {
    return 'history_location_update_url_eagerly_to_destination_route';
  }

  constructor(...args: []) {
    super(...args);
    this.analyzer.onShouldUpdateURL(this.shouldUpdateURL);
  }

  setURL(path: string) {
    if (
      this.history.state &&
      this.history.state[this.historyStateKey] === true
    ) {
      super.replaceURL(path);
      return;
    }
    super.setURL(path);
  }

  willDestroy() {
    super.willDestroy();
    this.analyzer.offShouldUpdateURL(this.shouldUpdateURL);
  }

  private shouldUpdateURL = (path: string) => {
    if (this.getURL() === path) {
      return;
    }
    this.history.pushState(
      { [this.historyStateKey]: true, early_update_path: path },
      '',
      path
    );
  };
}
