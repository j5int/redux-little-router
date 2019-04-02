/* eslint-disable consistent-return */

import {
  PUSH, REPLACE, GO,
  GO_BACK, GO_FORWARD,
  GO_BACK_TO_CHECKPOINT
} from './action-types';

export default ({ history, getState }) => () => next => action => {
  switch (action.type) {
  case PUSH:
    history.push(action.payload.path ? action.payload.path : action.payload);
    // No return, no next() here
    // We stop all history events from progressing further through the dispatch chain...
    break;
  case REPLACE:
    history.replace(action.payload);
    break;
  case GO:
    history.go(action.payload);
    break;
  case GO_BACK:
    history.goBack();
    break;
  case GO_FORWARD:
    history.goForward();
    break;
  case GO_BACK_TO_CHECKPOINT:
    const checkPointCounter = getState().get('checkPointCounter');
    history.go(-1*checkPointCounter);
    break;
  }
  return next(action);
};
