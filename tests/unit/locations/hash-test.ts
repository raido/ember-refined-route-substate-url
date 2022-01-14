import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';
import { ShouldUpdateURLCallback } from 'ember-refined-route-substate-url/services/router-transition-analyzer';
import UpdateUrlEagerlyHashLocation from 'dummy/locations/hash';

module('Unit | Location | hash', function (hooks) {
  setupTest(hooks);

  test('should handle URL update with shouldUpdateURL', async function (assert) {
    class StubHashLocation extends UpdateUrlEagerlyHashLocation {
      setURL(path: string) {
        assert.step(`setURL: ${path}`);
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
    this.owner.register('location:hash', StubHashLocation);

    const service: StubRouterTransitionAnalyzer = this.owner.lookup(
      'service:router-transition-analyzer'
    );
    this.owner.lookup('location:hash');

    service.triggerShouldUpdateURL('/my/new/url');

    assert.verifySteps(['setURL: /my/new/url']);
  });
});
