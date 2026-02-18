import { t } from "@lingui/core/macro";
import {
  DrawingUtils,
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

export const Route = createFileRoute("/otoge")({
  component: OtogeComponent,
});

const MAX_HAND = 2;

function OtogeComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const oscillatorNode = useRef<Tone.Oscillator[]>([]);
  const gainNode = useRef<Tone.Gain[]>([]);
  const pannerNode = useRef<Tone.Panner[]>([]);

  const [enableSound, setEnableSound] = useState(
    Tone.getContext().state !== "suspended",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (gainNode.current.length !== MAX_HAND) {
      console.log("new Gain");
      gainNode.current = new Array(MAX_HAND)
        .fill(null)
        .map(() => new Tone.Gain(0).toDestination());
    }
    if (pannerNode.current.length !== MAX_HAND) {
      console.log("new Panner");
      pannerNode.current = new Array(MAX_HAND)
        .fill(null)
        .map(() => new Tone.Panner(0));
    }
    if (oscillatorNode.current.length !== MAX_HAND) {
      console.log("new Oscillator");
      oscillatorNode.current = new Array(MAX_HAND)
        .fill(null)
        .map((_, i) =>
          new Tone.Oscillator()
            .chain(pannerNode.current[i], gainNode.current[i])
            .start(),
        );
    }

    let stream: MediaStream | null = null;
    const startCamera = async () => {
      if (videoRef.current) {
        const v = videoRef.current;
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            aspectRatio: v.clientWidth > v.clientHeight ? 16 / 9 : 9 / 16,
            width: v.clientWidth > v.clientHeight ? 1920 : 1080,
            height: v.clientWidth > v.clientHeight ? 1080 : 1920,
            facingMode: "user",
          },
          audio: false,
        });
        v.srcObject = stream;
      }
    };

    let handLandmarker: HandLandmarker | null = null;
    const createHandLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `/mediapipe/hand_landmarker.task`,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: MAX_HAND,
      });
    };

    let lastVideoTime = -1;
    let results: HandLandmarkerResult | null = null;
    let canvasCtx: CanvasRenderingContext2D | null = null;
    let drawingUtils: DrawingUtils | null = null;
    let rId: number;
    const predictWebcam = () => {
      // streamが無かったら早期リターンしてmessage表示
      if (!stream) return;
      // 手のランドマーク検出
      // videoとHandLandmarkerの準備ができているかつ前回と同じ時刻でない場合、検出する。
      if (
        videoRef.current &&
        handLandmarker &&
        lastVideoTime !== videoRef.current.currentTime
      ) {
        lastVideoTime = videoRef.current.currentTime;
        results = handLandmarker.detectForVideo(
          videoRef.current,
          performance.now(),
        );
      }

      // canvasへの描画
      // canvasが無ければ(コンポーネントが破棄されたら)早期リターン
      if (!canvasRef.current) return;
      if (!canvasCtx) canvasCtx = canvasRef.current.getContext("2d");
      if (!canvasCtx) return;
      if (!drawingUtils) drawingUtils = new DrawingUtils(canvasCtx);
      if (canvasCtx) {
        canvasCtx.save();
        canvasCtx.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height,
        );
        if (results?.landmarks && results.landmarks.length > 0) {
          results.landmarks.forEach((landmarks, i) => {
            const { v, p, f } = calcVPF(landmarks);
            // console.log(i, v, p, f);
            // console.log(
            //   i,
            //   gainNode.current.length,
            //   pannerNode.current.length,
            //   oscillatorNode.current.length,
            // );
            gainNode.current[i].gain.rampTo(v * 2, 0.1);
            pannerNode.current[i].pan.rampTo(p, 0.1);
            oscillatorNode.current[i].frequency.rampTo(f, 0.1);
            drawingUtils?.drawConnectors(
              landmarks,
              HandLandmarker.HAND_CONNECTIONS,
              {
                color: "#00FF00",
                lineWidth: 2,
              },
            );
            drawingUtils?.drawLandmarks(landmarks, {
              color: "#FF0000",
              radius: 2,
            });
          });
        } else {
          gainNode.current.forEach((node) => {
            node.gain.rampTo(0, 0);
          });
        }
        canvasCtx.restore();
        rId = window.requestAnimationFrame(predictWebcam);
      }
    };
    const start = async () => {
      startCamera()
        .then(createHandLandmarker)
        .then(predictWebcam)
        .catch(() => {
          setMessage(t`⚠️初期化できなんだ`);
        });
    };
    start();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
      if (rId) {
        window.cancelAnimationFrame(rId);
      }
      oscillatorNode.current.forEach((node) => {
        node.dispose();
      });
      oscillatorNode.current = [];
      gainNode.current.forEach((node) => {
        node.dispose();
      });
      gainNode.current = [];
      pannerNode.current.forEach((node) => {
        node.dispose();
      });
      pannerNode.current = [];
    };
  }, []);

  return (
    <div className="absolute inset-0 h-full w-full bg-black">
      <video
        ref={videoRef}
        autoPlay={true}
        playsInline
        className="h-screen w-full -scale-x-100 object-fill"
      >
        <track kind="captions" />
      </video>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 z-20 h-full w-full -scale-x-100"
      />
      <div className="absolute top-0 left-0 z-40 flex h-full w-full flex-col gap-2 p-2">
        <div className="flex grow">
          {message ? (
            <span className="flex h-full w-full items-center justify-center rounded bg-white text-3xl">
              {message}
            </span>
          ) : (
            !enableSound && (
              <button
                type="button"
                className="h-full w-full rounded bg-white text-3xl"
                onClick={() => {
                  Tone.start();
                  setEnableSound(true);
                }}
              >
                <div className="flex justify-center">
                  <div className="animate-bounce">👆</div>
                  <span>:🔇➡🔊</span>
                </div>
              </button>
            )
          )}
        </div>
        <div>
          <Link to="/" className="rounded bg-white text-2xl">
            🔙
          </Link>
        </div>
      </div>
    </div>
  );
}

const r = 100;

function calcVPF(landmarks: NormalizedLandmark[]) {
  const thumbTip = landmarks[4];
  const indexFingerTip = landmarks[8];
  const middleFingerTip = landmarks[12];
  const ringFingerTip = landmarks[16];
  const pinkyFingerTip = landmarks[20];
  const d = Math.sqrt(
    (thumbTip.x - indexFingerTip.x) ** 2 +
      (thumbTip.y - indexFingerTip.y) ** 2 +
      (indexFingerTip.x - middleFingerTip.x) ** 2 +
      (indexFingerTip.y - middleFingerTip.y) ** 2 +
      (middleFingerTip.x - ringFingerTip.x) ** 2 +
      (middleFingerTip.y - ringFingerTip.y) ** 2 +
      (ringFingerTip.x - pinkyFingerTip.x) ** 2 +
      (ringFingerTip.y - pinkyFingerTip.y) ** 2 +
      (pinkyFingerTip.x - thumbTip.x) ** 2 +
      (pinkyFingerTip.y - thumbTip.y) ** 2,
  );
  const v = Math.min(Math.max(0, d > 0.2 ? Math.round(d * r) / r : 0), 1);
  const aX =
    (thumbTip.x +
      indexFingerTip.x +
      middleFingerTip.x +
      ringFingerTip.x +
      pinkyFingerTip.x) /
    5;
  const p = Math.min(Math.max(-1, Math.round((aX - 0.5) * r * -1.5) / r), 1);
  const aY =
    (thumbTip.y +
      indexFingerTip.y +
      middleFingerTip.y +
      ringFingerTip.y +
      pinkyFingerTip.y) /
    5;
  const f = Math.min(Math.max(0, Math.round(1100 * (1 - aY) * r) / r), 1100);
  return {
    v,
    p,
    f,
  };
}
