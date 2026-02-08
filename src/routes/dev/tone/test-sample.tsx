import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

export const Route = createFileRoute("/dev/tone/test-sample")({
  component: TestSampleComponent,
});

// tonejsのテスト用のコンポーネント
function TestSampleComponent() {
  console.log("run");
  const oscillatorNode = useRef<Tone.Oscillator>(null);
  const gainNode = useRef<Tone.Gain>(null);
  const pannerNode = useRef<Tone.Panner>(null);
  const [volume, setVolume] = useState(0.5);
  const [frequency, setfrequency] = useState(440);
  const [panner, setPanner] = useState(0);

  useEffect(() => {
    console.log("effect");
    if (!gainNode.current) {
      console.log("new Gain");
      gainNode.current = new Tone.Gain(0.5).toDestination();
    }
    if (!pannerNode.current) {
      console.log("new Panner");
      pannerNode.current = new Tone.Panner();
    }
    if (!oscillatorNode.current) {
      console.log("new Oscillator");
      oscillatorNode.current = new Tone.Oscillator().chain(
        pannerNode.current,
        gainNode.current,
      );
    }
    return () => {
      console.log("dorop");
      oscillatorNode.current?.dispose();
      oscillatorNode.current = null;
      gainNode.current?.dispose();
      gainNode.current = null;
      pannerNode.current?.dispose();
      pannerNode.current = null;
    };
  }, []);

  const init = async () => {
    console.log("init");
    if (oscillatorNode.current?.context.state === "suspended") {
      await Tone.start();
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
          console.log(!!oscillatorNode.current, playing);
          await init();
          if (oscillatorNode.current) {
            if (playing === "false") {
              console.log("play");
              oscillatorNode.current.start();
              button.dataset.playing = "true";
            } else if (playing === "true") {
              console.log("pause");
              oscillatorNode.current.stop();
              button.dataset.playing = "false";
            }
          }
        }}
      >
        <span>Start/Stop</span>
      </button>
      <input
        type="range"
        id="volume"
        min={0}
        max={1}
        step={0.1}
        value={volume}
        onChange={(e) => {
          const v = e.target.valueAsNumber;
          console.log("volume: ", v);
          if (gainNode.current) {
            gainNode.current.gain.rampTo(v, 0.1);
            setVolume(v);
          }
        }}
      />
      <input
        type="range"
        id="frequency"
        min={0}
        max={1100}
        step={110}
        value={frequency}
        onChange={(e) => {
          const f = e.target.valueAsNumber;
          console.log("frequency: ", f);
          if (oscillatorNode.current) {
            oscillatorNode.current.frequency.rampTo(f, 0.1);
            setfrequency(f);
          }
        }}
      />
      <input
        type="range"
        id="panner"
        min={-1}
        max={1}
        step={0.01}
        value={panner}
        onChange={(e) => {
          const p = e.target.valueAsNumber;
          console.log("panner: ", p);
          if (pannerNode.current) {
            pannerNode.current.pan.rampTo(p, 0.1);
            setPanner(p);
          }
        }}
      />
    </div>
  );
}
