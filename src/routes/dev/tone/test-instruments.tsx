import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import * as Tone from "tone";

export const Route = createFileRoute("/dev/tone/test-instruments")({
  component: TestInstrumentsComponent,
});

// tonejsのテスト用のコンポーネント
function TestInstrumentsComponent() {
  console.log("run");
  const synth = useRef<Tone.PolySynth>(null);

  const init = async () => {
    console.log("init");
    if (!synth.current) {
      synth.current = new Tone.PolySynth().toDestination();
      await Tone.start();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={async () => {
          await init();
          if (synth.current) {
            const now = Tone.now();
            synth.current.triggerAttack("D4", now);
            synth.current.triggerAttack("F4", now + 0.5);
            synth.current.triggerAttack("A4", now + 1);
            synth.current.triggerAttack("C5", now + 1.5);
            synth.current.triggerAttack("E5", now + 2);
            synth.current.triggerRelease(
              ["D4", "F4", "A4", "C5", "E5"],
              now + 4,
            );
          }
        }}
      >
        <span>start</span>
      </button>
    </div>
  );
}
