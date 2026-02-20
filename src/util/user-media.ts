// カメラを使用するためのやつ

// アスペクト比を丸める
function roundAspectRatio(size: { width: number; height: number }) {
  const r = size.width / size.height;
  if (r > 16 / 9) return 16 / 9;
  if (r > 4 / 3) return 4 / 3;
  if (r > 1 / 1) return 1 / 1;
  if (r > 3 / 4) return 3 / 4;
  return 9 / 16;
}

// カメラの解像度
const QUALITY = ["auto", "low", "mid", "high"] as const;
type QUALITY = (typeof QUALITY)[number];

export function getVideoStream(
  size: { width: number; height: number },
  quality: QUALITY = "auto",
) {
  let width = size.width;
  switch (quality) {
    case "low":
      width = 640; // px単位
      break;
    case "mid":
      width = 1080; // px単位
      break;
    case "high":
      width = 1920; // px単位
      break;
  }

  return navigator.mediaDevices.getUserMedia({
    audio: false, // 音声はなし
    video: {
      // 縦横指定だとうまくいかないことがあったので、アスペクト比と横幅を指定する
      aspectRatio: roundAspectRatio(size),
      width,
      facingMode: "user", // インカメラ
    },
  });
}
