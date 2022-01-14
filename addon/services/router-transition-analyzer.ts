import Service from '@ember/service';
import RouteInfo from '@ember/routing/-private/route-info';
import Transition from '@ember/routing/-private/transition';
import RouterService from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import { debug } from '@ember/debug';

enum SUBSTATE_ROUTE_SUFFIX {
  LOADING = 'loading',
  ERROR = 'error',
}

export type ShouldUpdateURLCallback = (path: string) => void;

const LOG_TAG = '[RouterTransitionAnalyzer]';

export default class RouterTransitionAnalyzerService extends Service {
  @service('router')
  router!: RouterService;

  private shouldUpdateURLCallbacks: ShouldUpdateURLCallback[] = [];
  private transitionQueue: Transition[] = [];

  constructor(...args: []) {
    super(...args);
    this.router.on('routeWillChange', this.routeWillChangeHandler);
    this.router.on('routeDidChange', this.routeDidChangeHandler);
  }

  public onShouldUpdateURL(callbackToAdd: ShouldUpdateURLCallback): void {
    this.shouldUpdateURLCallbacks.push(callbackToAdd);
  }

  public offShouldUpdateURL(callbackToRemove: ShouldUpdateURLCallback): void {
    this.shouldUpdateURLCallbacks = this.shouldUpdateURLCallbacks.filter(
      (cb) => {
        return cb !== callbackToRemove;
      }
    );
  }

  willDestroy() {
    super.willDestroy();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - "off" method actually exists, @types package is not correct
    this.router.off('routeWillChange', this.routeWillChangeHandler);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.router.off('routeDidChange', this.routeDidChangeHandler);
    this.shouldUpdateURLCallbacks = [];
    this.transitionQueue = [];
  }

  private routeWillChangeHandler = (transition: Transition) => {
    if (!this.hasRouteInfoForAnalysis(transition)) {
      return;
    }
    debug(`${LOG_TAG}: routeWillChange -> ${transition.to.name}`);
    this.transitionQueue.push(transition);

    const newUrl = this.determineUrlForDestinationRoute(transition);
    if (newUrl) {
      debug(`${LOG_TAG}: shouldUpdateCallback -> ${newUrl}`);
      this.shouldUpdateURLCallbacks.forEach((cb) => {
        cb(newUrl);
      });
    }
  };

  private routeDidChangeHandler = (transition: Transition) => {
    this.transitionQueue = [];

    if (!this.hasRouteInfoForAnalysis(transition)) {
      return;
    }
    debug(`${LOG_TAG}: routeDidChange -> ${transition.to.name}`);
  };

  private determineUrlForDestinationRoute(
    transition: Transition
  ): string | null {
    if (!this.isIntermediateRoute(transition)) {
      return null;
    }

    // These fail-safes here should never be triggered but just to be double sure that our queue is not messed up.
    // We have those sanity checks to avoid possible TypeErrors.
    const substateTransitionIndexInQueue =
      this.transitionQueue.indexOf(transition);
    if (substateTransitionIndexInQueue <= 0) {
      return null;
    }
    const routeBeforeIntermediateRoute =
      this.transitionQueue[substateTransitionIndexInQueue - 1];
    if (!routeBeforeIntermediateRoute) {
      return null;
    }

    // Transition queue can include: "my.route, my.route.loading, my.route.error" transitions
    // Since for the first "my.route.loading" route we already triggered shouldUpdateUrlCallbacks
    // We bail out for error route ones, this avoids updating url to "my/route/loading".
    if (this.isIntermediateRoute(routeBeforeIntermediateRoute)) {
      return null;
    }
    const params = this.findAllRouteParamsForUrlLookup(
      routeBeforeIntermediateRoute
    );
    return this.router.urlFor.apply(this.router, [
      routeBeforeIntermediateRoute.to.name,
      ...params,
    ]);
  }

  // We need to collect all parent routes params, like
  // /route1/:id/route2/:id
  // So we can call router.urlFor() to give us new destination route URL which we can push
  private findAllRouteParamsForUrlLookup(transition: Transition) {
    let route: RouteInfo | null = transition.to;
    const params: RouteInfo['params'][] = [];
    const finalParams: Array<string | undefined> = [];
    while (route) {
      const keys = Object.keys(route.params);
      if (keys.length > 0) {
        params.push(route.params);
      }
      route = route.parent;
    }
    params.map((obj) => {
      const keys = Object.keys(obj);
      keys.forEach((key: string) => {
        finalParams.push(obj[key]);
      });
    });

    finalParams.reverse();
    return finalParams;
  }

  private isIntermediateRoute(transition: Transition): boolean {
    const routeName = transition.to.name;
    return (
      routeName.endsWith(SUBSTATE_ROUTE_SUFFIX.LOADING) ||
      routeName.endsWith(SUBSTATE_ROUTE_SUFFIX.ERROR)
    );
  }

  private hasRouteInfoForAnalysis(transition: Transition): boolean {
    return !!transition.to;
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    'router-transition-analyzer': RouterTransitionAnalyzerService;
  }
}
