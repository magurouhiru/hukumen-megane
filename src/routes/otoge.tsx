import {
  DrawingUtils,
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import * as Tone from "tone";

export const Route = createFileRoute("/otoge")({
  component: OtogeComponent,
});

function OtogeComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const oscillatorNode = useRef<Tone.Oscillator>(null);
  const gainNode = useRef<Tone.Gain>(null);
  const pannerNode = useRef<Tone.Panner>(null);

  useEffect(() => {
    if (!gainNode.current) {
      console.log("new Gain");
      gainNode.current = new Tone.Gain(0).toDestination();
    }
    if (!pannerNode.current) {
      console.log("new Panner");
      pannerNode.current = new Tone.Panner();
    }
    if (!oscillatorNode.current) {
      console.log("new Oscillator");
      oscillatorNode.current = new Tone.Oscillator()
        .chain(pannerNode.current, gainNode.current)
        .start();
    }

    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        if (videoRef.current) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              height: videoRef.current.clientHeight / 2,
              width: videoRef.current.clientWidth / 2,
              facingMode: "user",
            },
            audio: false,
          });
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
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
        numHands: 1,
      });
    };

    let lastVideoTime = -1;
    let results: HandLandmarkerResult | null = null;
    let canvasCtx: CanvasRenderingContext2D | null = null;
    let drawingUtils: DrawingUtils | null = null;
    let rId: number;
    const predictWebcam = () => {
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
          for (const landmarks of results.landmarks) {
            const { v, f } = calcVF(landmarks);
            // console.log(v, f);
            gainNode.current?.gain.rampTo(v * 2, 0.01);
            oscillatorNode.current?.frequency.rampTo(1100 * (1 - f), 0.01);
            drawingUtils.drawConnectors(
              landmarks,
              HandLandmarker.HAND_CONNECTIONS,
              {
                color: "#00FF00",
                lineWidth: 2,
              },
            );
            drawingUtils.drawLandmarks(landmarks, {
              color: "#FF0000",
              radius: 2,
            });
          }
        } else {
          gainNode.current?.gain.rampTo(0, 0);
        }
        canvasCtx.restore();
        rId = window.requestAnimationFrame(predictWebcam);
      }
    };
    const start = async () => {
      await startCamera();
      await createHandLandmarker();
      predictWebcam();
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
      oscillatorNode.current?.dispose();
      oscillatorNode.current = null;
      gainNode.current?.dispose();
      gainNode.current = null;
      pannerNode.current?.dispose();
      pannerNode.current = null;
    };
  }, []);

  return (
    <div>
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
        className="absolute top-0 left-0 h-full w-full -scale-x-100"
      />
      <button
        type="button"
        onClick={() => {
          Tone.start();
        }}
      >
        sound
      </button>
    </div>
  );
}

function calcVF(landmarks: NormalizedLandmark[]) {
  const thumbTip = landmarks[4];
  const indexFingerTip = landmarks[8];
  const middleFingerTip = landmarks[12];
  const ringFingerTip = landmarks[16];
  const pinkyFingerTip = landmarks[20];
  const d =
    (thumbTip.x - indexFingerTip.x) ** 2 +
    (thumbTip.y - indexFingerTip.y) ** 2 +
    (indexFingerTip.x - middleFingerTip.x) ** 2 +
    (indexFingerTip.y - middleFingerTip.y) ** 2 +
    (middleFingerTip.x - ringFingerTip.x) ** 2 +
    (middleFingerTip.y - ringFingerTip.y) ** 2 +
    (ringFingerTip.x - pinkyFingerTip.x) ** 2 +
    (ringFingerTip.y - pinkyFingerTip.y) ** 2 +
    (pinkyFingerTip.x - thumbTip.x) ** 2 +
    (pinkyFingerTip.y - thumbTip.y) ** 2;
  const v = d > 0.02 ? Math.round(Math.sqrt(d) * 100) / 100 : 0;
  const a =
    (thumbTip.y +
      indexFingerTip.y +
      middleFingerTip.y +
      ringFingerTip.y +
      pinkyFingerTip.y) /
    5;
  const f = Math.round(a * 100) / 100;
  return {
    v,
    f,
  };
}
