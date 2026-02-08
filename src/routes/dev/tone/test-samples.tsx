import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import * as Tone from "tone";

export const Route = createFileRoute("/dev/tone/test-samples")({
  component: TestSamplesComponent,
});

// tonejsのテスト用のコンポーネント
function TestSamplesComponent() {
  console.log("run");
  const player = useRef<Tone.Player>(null);

  useEffect(() => {
    console.log("effect");
    if (!player.current) {
      console.log("new Player");
      player.current = new Tone.Player("/music/420_BPM108.mp3").toDestination();
    }
    return () => {
      console.log("dorop");
      player.current?.dispose();
      player.current = null;
    };
  }, []);

  const init = async () => {
    console.log("init");
    if (player.current?.context.state === "suspended") {
      await Tone.start();
      await Tone.loaded();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        data-playing="false"
        role="switch"
        aria-checked="false"
        onClick={async (e) => {
          console.log(e);
          const button = e.currentTarget;
          const playing = button.dataset.playing;
          console.log(!!player.current, playing);
          await init();
          if (player.current) {
            if (playing === "false") {
              console.log("play");
              player.current.start();
              button.dataset.playing = "true";
            } else if (playing === "true") {
              console.log("pause");
              player.current.stop();
              button.dataset.playing = "false";
            }
          }
        }}
      >
        <span>Start/Stop</span>
      </button>
    </div>
  );
}
