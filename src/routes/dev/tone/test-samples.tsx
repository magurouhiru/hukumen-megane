import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import * as Tone from "tone";

export const Route = createFileRoute("/dev/tone/test-samples")({
  component: TestSamplesComponent,
});

// tonejsのテスト用のコンポーネント
function TestSamplesComponent() {
  console.log("run");
  const player = useRef<Tone.Player>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const init = async () => {
    console.log("init");
    if (!player.current) {
      player.current = new Tone.Player("/music/420_BPM108.mp3").toDestination();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        ref={buttonRef}
        type="button"
        data-playing="false"
        role="switch"
        aria-checked="false"
        onClick={async (e) => {
          await init();
          await Tone.loaded();
          console.log(e);
          if (player.current && buttonRef.current) {
            if (buttonRef.current?.dataset.playing === "false") {
              console.log("play");
              Tone.getTransport().start();
              buttonRef.current.dataset.playing = "true";
            } else if (buttonRef.current?.dataset.playing === "true") {
              console.log("pause");
              Tone.getTransport().pause();
              buttonRef.current.dataset.playing = "false";
            }
          }
        }}
      >
        <span>Start/Stop</span>
      </button>
    </div>
  );
}
