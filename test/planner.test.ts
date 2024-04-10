import "mocha";
import { expect } from "chai";
import { PlannerProgram } from "../src/pages/planner/models/plannerProgram";
import { PlannerTestUtils } from "./utils/plannerTestUtils";
import { IPlannerProgram } from "../src/types";
import { Settings } from "../src/models/settings";
import { PlannerSyntaxError } from "../src/pages/planner/plannerExerciseEvaluator";

describe("Planner", () => {
  it("updates weight and lp progress after completing", () => {
    const programText = `# Week 1
## Day 1
Squat / 2x5 / 100lb / progress: lp(5lb)`;
    const { program } = PlannerTestUtils.finish(programText, { completedReps: [[5, 5]] });
    const newText = PlannerProgram.generateFullText(program.planner!.weeks);
    expect(newText).to.equal(`# Week 1
## Day 1
Squat / 2x5 / 105lb / progress: lp(5lb, 1, 0, 10lb, 0, 0)


`);
  });

  it("compacts repeated exercises", () => {
    const programText = `# Week 1
## Day 1
Squat[1-2] / 2x5

# Week 2
## Day 1

# Week 3
## Day 1
Squat / 2x5
`;
    const { program } = PlannerTestUtils.finish(programText, { completedReps: [[5, 5]] });
    const newText = PlannerProgram.generateFullText(program.planner!.weeks);
    expect(newText).to.equal(`# Week 1
## Day 1
Squat[1-3] / 2x5 / 86.53%


# Week 2
## Day 1



# Week 3
## Day 1



`);
  });

  it("does not compact repeated exercises if originally didn't use ranges", () => {
    const programText = `# Week 1
## Day 1
Squat / 2x5

# Week 2
## Day 1
Squat / 2x5

# Week 3
## Day 1
Squat / 2x5
`;
    const { program } = PlannerTestUtils.finish(programText, { completedReps: [[5, 5]] });
    const newText = PlannerProgram.generateFullText(program.planner!.weeks);
    expect(newText).to.equal(`# Week 1
## Day 1
Squat / 2x5 / 86.53%


# Week 2
## Day 1
Squat / 2x5 / 86.53%


# Week 3
## Day 1
Squat / 2x5 / 86.53%


`);
  });

  it("splits and compacts after mid-program progression", () => {
    const programText = `# Week 1
## Day 1
Squat[1-5] / 2x5 / progress: custom() {~
  weights[3:*:*:*] += 10lb
~}
Bench Press[1-5] / 2x5

# Week 2
## Day 1

# Week 3
## Day 1

# Week 4
## Day 1

# Week 5
## Day 1
`;
    const { program } = PlannerTestUtils.finish(programText, {
      completedReps: [
        [5, 5],
        [5, 5],
      ],
    });
    const newText = PlannerProgram.generateFullText(program.planner!.weeks);
    expect(newText).to.equal(`# Week 1
## Day 1
Squat[1-2] / 2x5 / 86.53% / progress: custom() {~
  weights[3:*:*:*] += 10lb
~}
Bench Press[1-5] / 2x5 / 86.53%


# Week 2
## Day 1



# Week 3
## Day 1
Squat / 2x5 / 126.8lb


# Week 4
## Day 1
Squat[4-5] / 2x5 / 86.53%


# Week 5
## Day 1



`);
  });

  it("override weights", () => {
    const programText = `# Week 1
## Day 1
Squat / 1x5 100lb, 1x3 200lb / 60s / progress: dp(5lb, 3, 8)
Bench Press[1-5] / ...Squat / 120lb / progress: lp(5lb)
`;
    const { program } = PlannerTestUtils.finish(programText, {
      completedReps: [
        [5, 3],
        [5, 3],
      ],
    });
    const newText = PlannerProgram.generateFullText(program.planner!.weeks);
    expect(newText).to.equal(`# Week 1
## Day 1
Squat / 1x6 100lb, 1x4 200lb / 60s / progress: dp(5lb, 3, 8)
Bench Press / ...Squat / 1x5, 1x3 / 125lb / progress: lp(5lb, 1, 0, 10lb, 0, 0)


`);
  });

  it("use loops", () => {
    const programText = `# Week 1
## Day 1
Squat / 3x8 100lb / progress: custom() {~
  for (var.i in completedReps) {
    if (completedReps[var.i] >= reps[var.i]) {
      weights[var.i] = weights[var.i] + 5lb
    }
  }
~}
`;
    const { program } = PlannerTestUtils.finish(programText, {
      completedReps: [[8, 6, 8]],
    });
    const newText = PlannerProgram.generateFullText(program.planner!.weeks);
    expect(newText).to.equal(`# Week 1
## Day 1
Squat / 1x8 105lb, 1x8 100lb, 1x8 105lb / progress: custom() {~
  for (var.i in completedReps) {
    if (completedReps[var.i] >= reps[var.i]) {
      weights[var.i] = weights[var.i] + 5lb
    }
  }
~}


`);
  });

  it("use templates", () => {
    const programText = `# Week 1
## Day 1
tmp: Squat[1-5] / 2x5 / used: none / progress: custom() {~
  weights[3:*:*:*] += 10lb
~}
Squat[1-5] / ...tmp: Squat / progress: custom() { ...tmp: Squat }
Bench Press[1-5] / ...tmp: Squat / progress: custom() { ...tmp: Squat }

# Week 2
## Day 1

# Week 3
## Day 1

# Week 4
## Day 1

# Week 5
## Day 1
`;
    const { program } = PlannerTestUtils.finish(programText, {
      completedReps: [
        [5, 5],
        [5, 5],
      ],
    });
    const newText = PlannerProgram.generateFullText(program.planner!.weeks);
    expect(newText).to.equal(`# Week 1
## Day 1
tmp: Squat[1-5] / used: none / 2x5 / 86.53% / progress: custom() {~
  weights[3:*:*:*] += 10lb
~}
Squat[1-2] / ...tmp: Squat / 86.53% / progress: custom() { ...tmp: Squat }
Bench Press[1-2] / ...tmp: Squat / 86.53% / progress: custom() { ...tmp: Squat }


# Week 2
## Day 1



# Week 3
## Day 1
Squat / ...tmp: Squat / 126.8lb
Bench Press / ...tmp: Squat / 126.8lb


# Week 4
## Day 1
Squat[4-5] / ...tmp: Squat / 86.53%
Bench Press[4-5] / ...tmp: Squat / 86.53%


# Week 5
## Day 1



`);
  });

  it("show an error for reuse/repeat mismatch", () => {
    const programText = `# Week 1
## Day 1
tmp: Squat[1-2] / 2x5 / used: none / progress: custom() {~
  weights[3:*:*:*] += 10lb
~}
Squat[1-5] / ...tmp: Squat / progress: custom() { ...tmp: Squat }
Bench Press[1-5] / ...tmp: Squat / progress: custom() { ...tmp: Squat }

# Week 2
## Day 1

# Week 3
## Day 1

# Week 4
## Day 1

# Week 5
## Day 1
`;
    const planner: IPlannerProgram = { name: "MyProgram", weeks: PlannerProgram.evaluateText(programText) };
    const evaluatedWeeks = PlannerProgram.evaluate(planner, Settings.build()).evaluatedWeeks;
    expect(evaluatedWeeks[2][0]).to.deep.equal({
      success: false,
      error: new PlannerSyntaxError("No such exercise tmp: Squat at week: 3 (4:13)", 0, 0, 0, 0),
    });
  });

  it("preserves order of exercises", () => {
    const programText = `# Week 1
## Day 1
tmp: Squat[1-5] / 2x5 / used: none
Squat[1-5, 3] / ...tmp: Squat 
Bench Press[1-5,2] / ...tmp: Squat

# Week 2
## Day 1
Bicep Curl[2-5] / 5x5

# Week 3
## Day 1

# Week 4
## Day 1

# Week 5
## Day 1
`;
    const { program } = PlannerTestUtils.finish(programText, {
      completedReps: [
        [5, 5],
        [5, 5],
      ],
    });
    const exerciseNamesWeek3 = program.weeks[2].days
      .map((d1) =>
        program.days
          .find((d2) => d1.id === d2.id)!
          .exercises.map((e1) => program.exercises.find((e2) => e1.id === e2.id))
      )
      .flat(3)
      .map((e) => e!.name);
    expect(exerciseNamesWeek3).to.eql(["Bicep Curl", "Bench Press", "Squat"]);
    const newText = PlannerProgram.generateFullText(program.planner!.weeks);
    expect(newText).to.equal(`# Week 1
## Day 1
tmp: Squat[1-5] / used: none / 2x5 / 86.53%
Squat[3,1-5] / ...tmp: Squat / 86.53%
Bench Press[2,1-5] / ...tmp: Squat / 86.53%


# Week 2
## Day 1
Bicep Curl[2-5] / 5x5 / 86.53%


# Week 3
## Day 1



# Week 4
## Day 1



# Week 5
## Day 1



`);
  });
});