import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';
import { ShouldUpdateURLCallback } from 'ember-refined-route-substate-url/services/router-transition-analyzer';
import UpdateUrlEagerlyHistoryLocation from 'dummy/locations/history';

module('Unit | Location | history', function (hooks) {
  setupTest(hooks);

  test('should handle URL update with shouldUpdateURL', async function (assert) {
    const history = new FakeHistory();

    class StubHistoryLocation extends UpdateUrlEagerlyHistoryLocation {
      history = history;
    }

    class StubRouterTransitionAnalyzer extends Service {
      private onShouldUpdateURLCallbacks: ShouldUpdateURLCallback[] = [];
      onShouldUpdateURL(cb: ShouldUpdateURLCallback) {
        this.onShouldUpdateURLCallbacks.push(cb);
      }
      offShouldUpdateURL() {}
      triggerShouldUpdateURL(path: string) {
        this.onShouldUpdateURLCallbacks.forEach((cb) => {
          cb(path);
        });
      }
    }
    this.owner.register(
      'service:router-transition-analyzer',
      StubRouterTransitionAnalyzer
    );
    this.owner.register('location:history', StubHistoryLocation);

    const service: StubRouterTransitionAnalyzer = this.owner.lookup(
      'service:router-transition-analyzer'
    );
    const historyLocation: StubHistoryLocation =
      this.owner.lookup('location:history');

    service.triggerShouldUpdateURL('/my/new/url');

    assert.deepEqual(
      history.state,
      {
        history_location_update_url_eagerly_to_destination_route: true,
        early_update_path: '/my/new/url',
      },
      'new state should be'
    );
    assert.equal(
      history.length,
      1,
      'After pushing new state, length should be 1'
    );

    historyLocation.setURL('/my/new/url');
    assert.equal(
      history.length,
      1,
      'After router calls setURL when transition finishes, previous state should be replaced'
    );
  });

  test('should not push new state if URL matches', async function (assert) {
    const history = new FakeHistory();

    class StubHistoryLocation extends UpdateUrlEagerlyHistoryLocation {
      history = history;
      getURL() {
        return '/my/new/url';
      }
    }

    class StubRouterTransitionAnalyzer extends Service {
      private onShouldUpdateURLCallbacks: ShouldUpdateURLCallback[] = [];
      onShouldUpdateURL(cb: ShouldUpdateURLCallback) {
        this.onShouldUpdateURLCallbacks.push(cb);
      }
      offShouldUpdateURL() {}
      triggerShouldUpdateURL(path: string) {
        this.onShouldUpdateURLCallbacks.forEach((cb) => {
          cb(path);
        });
      }
    }
    this.owner.register(
      'service:router-transition-analyzer',
      StubRouterTransitionAnalyzer
    );
    this.owner.register('location:history', StubHistoryLocation);

    const service: StubRouterTransitionAnalyzer = this.owner.lookup(
      'service:router-transition-analyzer'
    );
    this.owner.lookup('location:history');

    service.triggerShouldUpdateURL('/my/new/url');
    assert.deepEqual(history.state, null, 'no state update should pushed');
  });
});

class FakeHistory {
  state: FakeHistoryState | null = null;
  _states: FakeHistoryState[] = [];
  replaceState(state: FakeHistoryState) {
    this.state = state;
    this._states[0] = state;
  }
  pushState(state: FakeHistoryState) {
    this.state = state;
    this._states.unshift(state);
  }
  back() {}
  forward() {}
  go() {}
  scrollRestoration: ScrollRestoration = 'auto';
  get length() {
    return this._states.length;
  }
}

type FakeHistoryState = Record<string, unknown>;
