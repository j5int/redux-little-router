// @flow
import type {
  StoreCreator,
  StoreEnhancer,
  Reducer,
  State
} from 'redux';

import Immutable from 'immutable'

import type { History } from 'history';

import qs from 'query-string';
import _assign from 'lodash.assign';
import _omit from 'lodash.omit';

import { default as matcherFactory } from './create-matcher';
import attachRouterToReducer from './reducer-enhancer';
import { locationDidChange } from './action-creators';

import matchCache from './match-cache';

import validateRoutes from './util/validate-routes';
import flattenRoutes from './util/flatten-routes';

type StoreEnhancerArgs = {
  routes: Object,
  history: History,
  location: Location,
  createMatcher?: Function,
  passRouterStateToReducer?: bool,
  immutable?: bool
};

export default ({
  routes: nestedRoutes,
  history,
  location,
  createMatcher = matcherFactory,
  passRouterStateToReducer = false,
  immutable = false
}: StoreEnhancerArgs) => {
  validateRoutes(nestedRoutes);
  const routes = flattenRoutes(nestedRoutes);
  let assign = _assign;
  let omit = _omit;
  let get = (obj, prop) => obj[prop];
  if (immutable === true) {
    assign = (immutableObj, obj2) => {
      if (typeof immutableObj === 'undefined') {
        return immutableObj;
      }
      else if (typeof immutableObj === 'object' && immutableObj.constructor == Object) {
        return _assign(immutableObj, obj2);
      }
      return immutableObj.merge(obj2)
    };
    omit = (immutableObj, props) => {
      if (typeof immutableObj === 'undefined') {
        return immutableObj;
      }
      else if (typeof immutableObj === 'object' && immutableObj.constructor == Object) {
        return _omit(immutableObj, props);
      }
      return immutableObj.filter((value, key) => props.indexOf(key) === -1);
    };
    get = (immutableObj, prop) => {
      if (typeof immutableObj === 'object' && immutableObj.constructor == Object) {
        return immutableObj[prop];
      }
      return immutableObj.get(prop);
    }
  }
  return (createStore: StoreCreator) => (
    reducer: Reducer,
    initialState: State,
    enhancer: StoreEnhancer
  ) => {
    const enhancedReducer =
      attachRouterToReducer(passRouterStateToReducer, assign, omit, get)(reducer);

    const matchRoute = createMatcher(routes);
    const matchWildcardRoute = createMatcher(routes, true);

    let initialRouterState = {
      ...location,
      ...matchRoute(location.basename ? location.pathname.replace(location.basename, ""): location.pathname)
    }
    if (immutable === true) {
      initialRouterState = Immutable.fromJS(initialRouterState)
    }

    const initialStateWithRouter = assign(
      initialState,
      {
        router: initialRouterState
      }
    );

    const store = createStore(
      enhancedReducer,
      initialStateWithRouter,
      enhancer
    );

    history.listen(newLocation => {
      /* istanbul ignore else */
      if (newLocation) {
        matchCache.clear();
        newLocation.query = qs.parse(newLocation.search);
        store.dispatch(locationDidChange({
          location: newLocation,
          matchRoute
        }));
      }
    });

    return {
      ...store,

      // We attach routes here to allow <RouterProvider>
      // to access unserializable properties of route results.
      routes,

      history,
      matchRoute,
      matchWildcardRoute
    };
  };
};
