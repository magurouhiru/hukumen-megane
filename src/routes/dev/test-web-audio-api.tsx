import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/dev/test-web-audio-api")({
  component: TestWebAudioApiComponent,
});

// web audio apiのテスト用のコンポーネント
function TestWebAudioApiComponent() {
  console.log("run");
  const audioContext = useRef<AudioContext>(null);
  const gainNode = useRef<GainNode>(null);
  const pannerNode = useRef<StereoPannerNode>(null);
  const track = useRef<MediaElementAudioSourceNode>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [volume, setVolume] = useState(1);
  const [panner, setPanner] = useState(0);

  // 初期化用
  useEffect(() => {
    const init = () => {
      console.log("init1");
      if (!audioContext.current) {
        console.log("create ctx");
        audioContext.current = new AudioContext();
      }
      if (!gainNode.current) {
        console.log("create gain");
        gainNode.current = audioContext.current.createGain();
      }
      if (!pannerNode.current) {
        console.log("create panner");
        pannerNode.current = new StereoPannerNode(audioContext.current, {
          pan: 0,
        });
      }
      if (!audioRef.current) {
        console.log("audioRef is not ready");
        setTimeout(init, 500);
        return;
      }
      if (!track.current) {
        console.log("connect");
        track.current = audioContext.current.createMediaElementSource(
          audioRef.current,
        );
        track.current
          .connect(gainNode.current)
          .connect(pannerNode.current)
          .connect(audioContext.current.destination);
      }
      return;
    };
    init();
    return () => {
      console.log("drop1");
      // []なので、本番だとclose()して問題ないが、
      // strict mode だと2回実行され、audio 要素は一回しかconnectできないので、
      // エラーになるため、closeしない。
      // track.current?.disconnect();
      // track.current = null;
      // gainNode.current?.disconnect();
      // gainNode.current = null;
      // pannerNode.current?.disconnect();
      // pannerNode.current = null;
      // audioContext.current?.close();
      // audioContext.current = null;
    };
  }, []);

  const onClick = () => {
    // check if context is in suspended state (autoplay policy)
    console.log(!audioContext.current);
    if (!audioContext.current) return;
    if (audioContext.current.state === "suspended") {
      console.log("resum");
      audioContext.current.resume();
    }

    // play or pause track depending on state
    if (buttonRef.current?.dataset.playing === "false") {
      console.log("play");
      audioRef.current?.play();
      buttonRef.current.dataset.playing = "true";
    } else if (buttonRef.current?.dataset.playing === "true") {
      console.log("pause");
      audioRef.current?.pause();
      buttonRef.current.dataset.playing = "false";
    }
  };

  const onEnded = () => {
    if (buttonRef.current?.dataset.playing)
      buttonRef.current.dataset.playing = "false";
  };

  return (
    <div>
      <audio
        ref={audioRef}
        src="/music/420_BPM108.mp3"
        itemType="audio/mpeg"
        onEnded={onEnded}
      >
        <track kind="captions" />
      </audio>
      <button
        ref={buttonRef}
        data-playing="false"
        type="button"
        role="switch"
        aria-checked="false"
        onClick={onClick}
      >
        <span>Play/Pause</span>
      </button>
      <input
        type="range"
        id="volume"
        min={0}
        max={2}
        step={0.01}
        value={volume}
        onChange={(e) => {
          if (gainNode.current) {
            setVolume(e.target.valueAsNumber);
            gainNode.current.gain.value = e.target.valueAsNumber;
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
          if (pannerNode.current) {
            setPanner(e.target.valueAsNumber);
            pannerNode.current.pan.value = e.target.valueAsNumber;
          }
        }}
      />
    </div>
  );
}
