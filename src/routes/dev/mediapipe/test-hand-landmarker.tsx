import {
  DrawingUtils,
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/dev/mediapipe/test-hand-landmarker")({
  component: TestHandLandmarkerComponent,
});

// 手のランドマーク取得のテスト用コンポーネント
function TestHandLandmarkerComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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
        numHands: 2,
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
        if (results?.landmarks) {
          for (const landmarks of results.landmarks) {
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
    </div>
  );
}
