import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import RouterTransitionAnalyzerService from 'ember-refined-route-substate-url/services/router-transition-analyzer';

module('Unit | Service | router-transition-analyzer', function (hooks) {
  setupTest(hooks);

  test('it exists', async function (assert) {
    const service: RouterTransitionAnalyzerService = this.owner.lookup(
      'service:router-transition-analyzer'
    );
    assert.ok(service);
  });
});
