import { Reducer } from "preact/hooks";
import { ivySaurProgram, IProgram, Program } from "../models/program";
import { IHistoryRecord } from "../models/history";
import { IProgress, Progress } from "../models/progress";
import { IExcercise } from "../models/excercise";
import { StateError } from "./stateError";
import { History } from "../models/history";

export interface IState {
  programs: IProgram[];
  current?: ICurrent;
  history: IHistoryRecord[];
}

export interface ICurrent {
  programName: string;
  progress?: IProgress;
}

export function getInitialState(): IState {
  const state = window.localStorage.getItem("liftosaur");
  let parsedState: IState | undefined;
  if (state != null) {
    try {
      parsedState = JSON.parse(state);
    } catch (e) {
      parsedState = undefined;
    }
  }
  if (parsedState != null) {
    return parsedState;
  } else {
    return {
      programs: [ivySaurProgram],
      history: []
    };
  }
}

export type IChangeProgramAction = {
  type: "ChangeProgramAction";
  name: string;
};

export type IChangeRepsAction = {
  type: "ChangeRepsAction";
  excercise: IExcercise;
  setIndex: number;
};

export type IFinishProgramDayAction = {
  type: "FinishProgramDayAction";
};

export type IStartProgramDayAction = {
  type: "StartProgramDayAction";
};

export type IAction = IChangeRepsAction | IStartProgramDayAction | IChangeProgramAction | IFinishProgramDayAction;

export const reducerWrapper: Reducer<IState, IAction> = (state, action) => {
  const newState = reducer(state, action);
  console.log(newState);
  window.localStorage.setItem("liftosaur", JSON.stringify(newState));
  return newState;
};

export const reducer: Reducer<IState, IAction> = (state, action) => {
  if (action.type === "ChangeRepsAction") {
    const current = state.current!;
    const progress = current.progress!;
    return {
      ...state,
      current: {
        ...current,
        progress: Progress.updateRepsInExcercise(
          progress,
          Program.current(state.programs, current.programName)!,
          action.excercise,
          action.setIndex
        )
      }
    };
  } else if (action.type === "StartProgramDayAction") {
    const current = state.current!;
    if (current.progress != null) {
      throw new StateError("Progress is already started");
    } else {
      return {
        ...state,
        current: { ...current, progress: Progress.create(Program.current(state.programs, current.programName)!, 0) }
      };
    }
  } else if (action.type === "FinishProgramDayAction") {
    const current = state.current!;
    if (current.progress == null) {
      throw new StateError("FinishProgramDayAction: no progress");
    } else {
      const historyRecord = History.finishProgramDay(current.programName, current.progress);
      return {
        ...state,
        history: [historyRecord, ...state.history],
        current: { ...current, progress: undefined }
      };
    }
  } else if (action.type === "ChangeProgramAction") {
    return { ...state, current: { programName: action.name } };
  } else {
    return state;
  }
};
