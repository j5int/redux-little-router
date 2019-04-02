// @flow
import type { Action } from 'redux';
import type { Location } from 'history';
import {LOCATION_CHANGED, GO_BACK, PUSH, GO_BACK_TO_CHECKPOINT} from './action-types';

export default (state: ?Location | Object = {}, action: Action) => {
  let get = (obj, prop) => obj[prop];
  if (state.get) {
    let get = (immutableObj, prop) => immutableObj.get(prop);
  }
  if (action.type === LOCATION_CHANGED) {
    // No-op the initial route action
    if (
      state &&
      get(state, 'pathname') === action.payload.pathname &&
      get(state, 'search') === action.payload.search
    ) {
      return state;
    }

    // Extract the previous state, but dump the
    // previous state's previous state so that the
    // state tree doesn't keep growing indefinitely
    if (state) {
      if (state.get) {
        // state is an immutable object - use its constructor to make the next state
        return state.constructor({previous: state.delete("previous"), basename: state.get("basename")}).merge(action.payload);
      }
      // eslint-disable-next-line no-unused-vars
      const { previous, ...oldState } = state;

      const nextState = {
        ...action.payload,
        previous: oldState
      };

      // reuse the initial basename if not provided
      return oldState.basename ? {
        basename: oldState.basename,
        ...nextState
      } : nextState;
    }
  }
  if (action.payload.checkPoint){
    return state.set('checkPointCounter', 1)
  }
  let checkPointCounter = state.get('checkPointCounter')
  if (checkPointCounter !== undefined){
    if (action.type === GO_BACK){
      return state.set('checkPointCounter', checkPointCounter-1)
    }
    if (action.type === PUSH){
      return state.set('checkPointCounter', checkPointCounter+1)
    }
  }
  if (action.type === GO_BACK_TO_CHECKPOINT){
    return state.delete('checkPointCounter')
  }
  return state;
};
