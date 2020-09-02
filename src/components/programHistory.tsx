import { h, JSX } from "preact";
import { IProgram } from "../models/program";
import { IDispatch } from "../ducks/types";
import { HeaderView } from "./header";
import { FooterView } from "./footer";
import { IHistoryRecord } from "../models/history";
import { Program } from "../models/program";
import { Button } from "./button";
import { Screen } from "../models/screen";
import { HistoryRecordView } from "./historyRecord";
import { ISettings } from "../models/settings";
import { updateState, IState } from "../ducks/reducer";
import { lb } from "../utils/lens";

interface IProps {
  program: IProgram;
  progress?: IHistoryRecord;
  history: IHistoryRecord[];
  settings: ISettings;
  dispatch: IDispatch;
}

export function ProgramHistoryView(props: IProps): JSX.Element {
  const dispatch = props.dispatch;
  const sortedHistory = props.history.sort((a, b) => {
    return new Date(Date.parse(b.date)).getTime() - new Date(Date.parse(a.date)).getTime();
  });
  const nextHistoryRecord = props.progress || Program.nextProgramRecord(props.program, props.settings);

  const history = [nextHistoryRecord, ...sortedHistory];

  return (
    <section className="h-full">
      <HeaderView
        title={props.program.name}
        subtitle="Current program"
        left={
          <button
            className="p-3"
            onClick={() =>
              updateState(dispatch, [
                lb<IState>()
                  .p("screenStack")
                  .recordModify((s) => Screen.push(s, "editProgramExcercise")),
              ])
            }
          >
            Excercise
          </button>
        }
        right={
          props.progress == null ? (
            <button className="p-3" onClick={() => Program.editAction(props.dispatch, props.program.id)}>
              Edit Program
            </button>
          ) : undefined
        }
      />
      <section style={{ paddingTop: "3.5rem", paddingBottom: "4rem" }}>
        <div className="py-3 text-center border-b border-gray-200">
          <Button kind="green" onClick={() => props.dispatch({ type: "StartProgramDayAction" })}>
            {props.progress ? "Continue Workout" : "Start Next Workout"}
          </Button>
        </div>
        {history.map((historyRecord) => (
          <HistoryRecordView settings={props.settings} historyRecord={historyRecord} dispatch={dispatch} />
        ))}
      </section>
      <FooterView dispatch={props.dispatch} />
    </section>
  );
}
