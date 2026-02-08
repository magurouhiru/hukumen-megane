import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import * as Tone from "tone";

export const Route = createFileRoute("/dev/tone/test-hello")({
  component: TestHelloComponent,
});

// tonejsのテスト用のコンポーネント
function TestHelloComponent() {
  console.log("run");
  const synth = useRef<Tone.Synth>(null);

  const init = async () => {
    console.log("init");
    if (!synth.current) {
      synth.current = new Tone.Synth().toDestination();
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
            // trigger the attack immediately
            synth.current.triggerAttack("C4", now);
            // wait one second before triggering the release
            synth.current.triggerRelease(now + 1);
          }
        }}
      >
        <span>triggerAttack / triggerRelease</span>
      </button>
      <button
        type="button"
        onClick={async () => {
          await init();
          if (synth.current) {
            const now = Tone.now();
            synth.current.triggerAttackRelease("C4", "8n", now);
            synth.current.triggerAttackRelease("E4", "8n", now + 0.5);
            synth.current.triggerAttackRelease("G4", "8n", now + 1);
          }
        }}
      >
        <span>triggerAttackRelease</span>
      </button>
    </div>
  );
}
