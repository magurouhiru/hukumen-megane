// mediapipeのvision task を使用するためのやつ

import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

async function getVisionTasks() {
  return FilesetResolver.forVisionTasks("/mediapipe/wasm");
}

export async function getHandLandmarker(numHands = 2) {
  return getVisionTasks().then((fs) => {
    return HandLandmarker.createFromOptions(fs, {
      baseOptions: {
        modelAssetPath: `/mediapipe/hand_landmarker.task`,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands,
    });
  });
}
