import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import * as Tone from "tone";

export const Route = createFileRoute("/dev/tone/test-scheduling")({
  component: TestSchedulingComponent,
});

// tonejsのテスト用のコンポーネント
function TestSchedulingComponent() {
  console.log("run");
  const synthA = useRef<Tone.FMSynth>(null);
  const synthB = useRef<Tone.AMSynth>(null);

  const onclick = () => {
    console.log("init");
    if (!synthA.current || !synthB.current) {
      if (!synthA.current) {
        const synth = new Tone.FMSynth().toDestination();
        synthA.current = synth;
        //play a note every quarter-note
        new Tone.Loop((time) => {
          synth.triggerAttackRelease("C2", "8n", time);
        }, "4n").start(0);
      }
      if (!synthB.current) {
        const synth = new Tone.AMSynth().toDestination();
        synthB.current = synth;
        //play another note every off quarter-note, by starting it "8n"
        new Tone.Loop((time) => {
          synth.triggerAttackRelease("C4", "8n", time);
        }, "4n").start("8n");
      }
    }
    // all loops start when the Transport is started
    Tone.getTransport().start();
    // ramp up to 800 bpm over 10 seconds
    Tone.getTransport().bpm.rampTo(800, 10);
  };

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onclick}>
        <span>triggerAttack / triggerRelease</span>
      </button>
    </div>
  );
}
