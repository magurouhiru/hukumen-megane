import { getVideoStream } from "@/util/user-media";
import { getHandLandmarker } from "@/util/vision-tasks";
import { t } from "@lingui/core/macro";
import {
  DrawingUtils,
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
  // vidoe関係
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStream = useRef<MediaStream>(null);
  const [videoReady, setVideoReady] = useState(false);

  // mediapipe関係
  const handLandmarker = useRef<HandLandmarker>(null);
  const [handLandmarkerReady, setHandLandmarkerReady] = useState(false);

  // Tone関係
  const oscillatorNode = useRef<Tone.Oscillator[]>([]);
  const gainNode = useRef<Tone.Gain[]>([]);
  const pannerNode = useRef<Tone.Panner[]>([]);
  const [toneReady, setToneReady] = useState(false);

  // canvas関係
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasCtx = useRef<CanvasRenderingContext2D>(null);
  const drawingUtils = useRef<DrawingUtils>(null);
  const [canvasReady, setCanvasReady] = useState(false);

  const [enableSound, setEnableSound] = useState(
    Tone.getContext().state !== "suspended",
  );
  const [message, setMessage] = useState("");

  const [isDevMode, setIsDevMode] = useState(false);
  const [fps, setFps] = useState(NaN);
  const [width, setWidth] = useState(NaN);
  const [height, setHeight] = useState(NaN);

  // vidoe関係の初期化
  useEffect(() => {
    const init = async () => {
      const v = videoRef.current;
      if (!v) {
        // refなので、ここには来ない想定
        // ここにエラー処理をかく
        console.error("videoRef がないよ！");
        return;
      }
      if (!videoStream.current) {
        getVideoStream({ width: v.width, height: v.height })
          .then((s) => {
            videoStream.current = s;
            v.srcObject = s;
            setVideoReady(true);
          })
          .catch((e) => {
            // カメラを拒否したらここに来る想定
            // ここにエラー処理をかく
            console.error("video stream が取得できないよ！", e);
            return;
          })
          .finally(() => {
            console.log("完了: vidoe関係");
          });
      }
    };

    init();

    return () => {
      videoStream.current?.getTracks().forEach((t) => {
        t.stop();
      });
      setVideoReady(false);
    };
  }, []);

  // mediapipe関係の初期化
  useEffect(() => {
    const init = async () => {
      getHandLandmarker(MAX_HAND)
        .then((hl) => {
          handLandmarker.current = hl;
          setHandLandmarkerReady(true);
        })
        .catch((e) => {
          // pathがおかしかったりしたらここに来る想定
          // ここにエラー処理をかく
          console.error("HandLandmarker が取得できないよ！", e);
          return;
        })
        .finally(() => {
          console.log("完了: mediapipe関係の初期化");
        });
    };

    init();

    return () => {
      handLandmarker.current?.close();
      setHandLandmarkerReady(false);
    };
  }, []);

  // Tone関係の初期化
  useEffect(() => {
    gainNode.current = new Array(MAX_HAND)
      .fill(null)
      .map(() => new Tone.Gain(0).toDestination());

    pannerNode.current = new Array(MAX_HAND)
      .fill(null)
      .map(() => new Tone.Panner(0));

    oscillatorNode.current = new Array(MAX_HAND)
      .fill(null)
      .map((_, i) =>
        new Tone.Oscillator()
          .chain(pannerNode.current[i], gainNode.current[i])
          .start(),
      );

    setToneReady(true);
    console.log("完了: Tone関係の初期化");

    return () => {
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
      setToneReady(false);
    };
  }, []);

  // canvas関係の初期化
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) {
      // refなので、ここには来ない想定
      // ここにエラー処理をかく
      console.error("canvasRef がないよ！");
      return;
    }
    canvasCtx.current = c.getContext("2d");

    if (!canvasCtx.current) {
      // ここには来ない想定
      // ここにエラー処理をかく
      console.error("canvas context がないよ！");
      return;
    }
    drawingUtils.current = new DrawingUtils(canvasCtx.current);

    setCanvasReady(true);
    console.log("完了: canvas関係の初期化");
    return () => {
      drawingUtils.current?.close();
      setCanvasReady(false);
    };
  }, []);

  // 解析
  useEffect(() => {
    let lastVideoTime = -1;
    let results: HandLandmarkerResult | null = null;
    let rId: number;
    if (!videoReady || !handLandmarkerReady || !toneReady || !canvasReady) {
      // 準備ができていなければ早期リターン
      return;
    }
    const predictWebcam = () => {
      if (
        !videoReady ||
        !videoRef.current ||
        !(videoRef.current.videoWidth > 0) ||
        !(videoRef.current.videoHeight > 0) ||
        !videoStream.current ||
        !handLandmarkerReady ||
        !handLandmarker.current ||
        !toneReady ||
        gainNode.current.length !== MAX_HAND ||
        pannerNode.current.length !== MAX_HAND ||
        oscillatorNode.current.length !== MAX_HAND ||
        !canvasReady ||
        !canvasRef.current ||
        !canvasCtx.current ||
        !drawingUtils.current
      ) {
        // 準備ができていなければ早期リターン
        return;
      }
      // 手のランドマーク検出
      // videoとHandLandmarkerの準備ができているかつ前回と同じ時刻でない場合、検出する。
      const v = videoRef.current;
      const c = canvasRef.current;
      const ctx = canvasCtx.current;
      const d = drawingUtils.current;
      if (lastVideoTime !== v.currentTime) {
        lastVideoTime = v.currentTime;
        results = handLandmarker.current.detectForVideo(v, performance.now());
      }

      ctx.save();
      ctx.clearRect(0, 0, c.width, c.height);
      if (results?.landmarks && results.landmarks.length > 0) {
        results.landmarks.forEach((landmarks, i) => {
          const { v, p, f } = calcVPF(landmarks);
          gainNode.current[i].gain.rampTo(v * 2, 0.1);
          pannerNode.current[i].pan.rampTo(p, 0.1);
          oscillatorNode.current[i].frequency.rampTo(f, 0.1);
          d.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 2,
          });
          d.drawLandmarks(landmarks, {
            color: "#FF0000",
            radius: 2,
          });
        });
      } else {
        gainNode.current.forEach((node) => {
          node.gain.rampTo(0, 0);
        });
      }
      ctx.restore();
      rId = window.requestAnimationFrame(predictWebcam);
    };
    predictWebcam();

    return () => {
      if (rId) {
        window.cancelAnimationFrame(rId);
      }
    };
  }, [videoReady, handLandmarkerReady, toneReady, canvasReady]);

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
        {isDevMode ? (
          <div>
            <p>devmode</p>
            <p>fps: {fps}</p>
            <p>width: {width}</p>
            <p>height: {height}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsDevMode(true);
              const so = videoRef.current?.srcObject;
              if (!(so && so instanceof MediaStream)) return;
              const settings = so.getVideoTracks()[0].getSettings();
              if (settings.frameRate) setFps(settings.frameRate);
              if (settings.width) setWidth(settings.width);
              if (settings.height) setHeight(settings.height);
            }}
          >
            switch dev mode
          </button>
        )}
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
