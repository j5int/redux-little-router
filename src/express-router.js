// @flow
import createMemoryHistory from 'history/createMemoryHistory';

import createLocation from './util/create-location';
import installRouter from './store-enhancer';
import routerMiddleware from './middleware';

type ServerRouterArgs = {
  routes: Object,
  request: {
    path: string,
    baseUrl: string,
    url: string,
    query: {[key: string]: string}
  },
  passRouterStateToReducer?: bool,
  immutable?: false
};

const locationForRequest = request => {
  const { path: pathname, baseUrl: basename, query } = request;
  const descriptor = basename
    ? { pathname, basename, query }
    : { pathname, query };
  return createLocation(descriptor);
};

export default ({
  routes,
  request,
  passRouterStateToReducer = false,
  immutable = false
}: ServerRouterArgs) => {
  const history = createMemoryHistory();

  const location = locationForRequest(request);

  return {
    routerEnhancer: installRouter({
      routes,
      history,
      location,
      passRouterStateToReducer,
      immutable
    }),
    routerMiddleware: routerMiddleware({ history })
  };
};
