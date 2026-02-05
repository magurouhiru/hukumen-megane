import {
  DrawingUtils,
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/dev/test-hand-landmarker")({
  component: TestHandLandmarkerComponent,
});

function TestHandLandmarkerComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        if (videoRef.current) {
          console.log(
            videoRef.current.clientHeight,
            videoRef.current.clientWidth,
          );
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
    let drawingUtils: DrawingUtils | null = null;
    let results: HandLandmarkerResult | null = null;
    let rId: number;
    let canvasCtx: CanvasRenderingContext2D | null = null;
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

    const predictWebcam = () => {
      let lastVideoTime = -1;
      const startTimeMs = performance.now();
      if (
        videoRef.current &&
        lastVideoTime !== videoRef.current.currentTime &&
        handLandmarker
      ) {
        lastVideoTime = videoRef.current.currentTime;
        results = handLandmarker.detectForVideo(videoRef.current, startTimeMs);
      }
      if (canvasRef.current) {
        if (!canvasCtx) canvasCtx = canvasRef.current.getContext("2d");
        if (canvasCtx) {
          canvasCtx.save();
          canvasCtx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height,
          );
          if (!drawingUtils) drawingUtils = new DrawingUtils(canvasCtx);
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
                lineWidth: 2,
              });
            }
          }
          canvasCtx.restore();
          rId = window.requestAnimationFrame(predictWebcam);
        }
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
