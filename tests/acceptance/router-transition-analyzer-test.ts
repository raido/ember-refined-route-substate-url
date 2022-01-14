import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import RouterTransitionAnalyzerService from 'ember-refined-route-substate-url/services/router-transition-analyzer';
import Route from '@ember/routing/route';
import Router from 'dummy/router';
import { hbs } from 'ember-cli-htmlbars';
import { visit } from '@ember/test-helpers';

type TestContext = import('ember-test-helpers').TestContext;

module('Acceptance | router transition analyzer', function (hooks) {
  setupApplicationTest(hooks);

  module('shouldUpdateCallback', function () {
    test('is not called when route has no loading template', async function (assert) {
      const service: RouterTransitionAnalyzerService = this.owner.lookup(
        'service:router-transition-analyzer'
      );
      service.onShouldUpdateURL((path) => {
        assert.step(`onShouldUpdateURL: ${path}`);
      });

      setupRoute(this.owner, {
        route: {
          name: 'my/route',
          model() {
            return new Promise((resolve) => setTimeout(resolve, 25));
          },
        },
        setupRouter(router) {
          router.map(function () {
            this.route('my', function () {
              this.route('route');
            });
          });
        },
      });

      await visit('my/route');
      assert.verifySteps([]);
    });

    test('is called when route has loading template', async function (assert) {
      const service: RouterTransitionAnalyzerService = this.owner.lookup(
        'service:router-transition-analyzer'
      );
      service.onShouldUpdateURL((path) => {
        assert.step(`onShouldUpdateURL: ${path}`);
      });

      setupRoute(this.owner, {
        route: {
          name: 'my/route',
          model() {
            return new Promise((resolve) => setTimeout(resolve, 25));
          },
        },
        setupRouter(router) {
          router.map(function () {
            this.route('my', function () {
              this.route('route');
            });
          });
        },
        templates: ['my/loading'],
      });

      await visit('my/route');
      assert.verifySteps(['onShouldUpdateURL: /my/route']);
    });

    test('is called when route has error', async function (assert) {
      const service: RouterTransitionAnalyzerService = this.owner.lookup(
        'service:router-transition-analyzer'
      );
      service.onShouldUpdateURL((path) => {
        assert.step(`onShouldUpdateURL: ${path}`);
      });

      setupRoute(this.owner, {
        route: {
          name: 'my/route',
          model() {
            return Promise.reject();
          },
        },
        setupRouter(router) {
          router.map(function () {
            this.route('my', function () {
              this.route('route');
            });
          });
        },
        templates: ['my/error'],
      });

      await visit('my/route');
      assert.verifySteps(['onShouldUpdateURL: /my/route']);
    });

    test('is called once when route has loading -> error transition', async function (assert) {
      const service: RouterTransitionAnalyzerService = this.owner.lookup(
        'service:router-transition-analyzer'
      );
      service.onShouldUpdateURL((path) => {
        assert.step(`onShouldUpdateURL: ${path}`);
      });

      setupRoute(this.owner, {
        route: {
          name: 'my/route',
          model() {
            return new Promise((_resolve, reject) => setTimeout(reject, 25));
          },
        },
        setupRouter(router) {
          router.map(function () {
            this.route('my', function () {
              this.route('route');
            });
          });
        },
        templates: ['my/loading', 'my/error'],
      });

      await visit('my/route');
      assert.verifySteps(['onShouldUpdateURL: /my/route']);
    });

    test('route URL parameters are preserved', async function (assert) {
      const service: RouterTransitionAnalyzerService = this.owner.lookup(
        'service:router-transition-analyzer'
      );
      service.onShouldUpdateURL((path) => {
        assert.step(`onShouldUpdateURL: ${path}`);
      });

      setupRoute(this.owner, {
        route: {
          name: 'params/child',
          model() {
            return new Promise((resolve) => setTimeout(resolve, 25));
          },
        },
        setupRouter(router) {
          router.map(function () {
            this.route('params', { path: '/some-route/:param' }, function () {
              this.route('child');
            });
          });
        },
        templates: ['params/loading'],
      });

      await visit('/some-route/my-param/child');
      assert.verifySteps(['onShouldUpdateURL: /some-route/my-param/child']);
    });
  });

  module('handling on/offShouldUpdateURL', function () {
    test('shouldUpdateURL callback should not be called', async function (assert) {
      const service: RouterTransitionAnalyzerService = this.owner.lookup(
        'service:router-transition-analyzer'
      );
      const handler = () => {
        assert.step('should not be called');
      };
      service.onShouldUpdateURL(handler);
      service.offShouldUpdateURL(handler);

      Router.map(function () {
        this.route('my', function () {
          this.route('route');
        });
      });

      setupRoute(this.owner, {
        route: {
          name: 'my/route',
          model() {
            return new Promise((resolve) => setTimeout(resolve, 25));
          },
        },
        setupRouter(router) {
          router.map(function () {
            this.route('my', function () {
              this.route('route');
            });
          });
        },
        templates: ['my/loading'],
      });

      await visit('my/route');
      assert.verifySteps([]);
    });
  });
});

function setupRoute(
  owner: TestContext['owner'],
  setup: {
    route: {
      name: string;
      model: () => Promise<void>;
    };
    setupRouter: (router: typeof Router) => void;
    templates?: string[];
  }
) {
  setup.setupRouter(Router);
  owner.register(
    `route:${setup.route.name}`,
    class MyRoute extends Route {
      model() {
        return setup.route.model();
      }
    }
  );

  setup.templates?.forEach((template) => {
    owner.register(`template:${template}`, hbs``);
  });
}
