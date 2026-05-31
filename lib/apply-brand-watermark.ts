import {
  effectiveLogoDataUrl,
  type BrandWatermarkSettings,
  type WatermarkLogoCrop,
  type WatermarkPosition,
  type WatermarkTemplateSettings,
} from "@/lib/watermark-brand";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image."));
    img.src = src;
  });
}

function blobToObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not export image."))),
      type || "image/jpeg",
      quality ?? 0.92,
    );
  });
}

/** Inset from photo edges so the logo is not flush against the border. */
function paddingPx(w: number, h: number): number {
  const min = Math.min(w, h);
  return Math.max(16, Math.round(min * 0.045));
}

function positionCoords(
  position: WatermarkPosition,
  canvasW: number,
  canvasH: number,
  logoW: number,
  logoH: number,
  pad: number,
): { x: number; y: number } {
  switch (position) {
    case "top-left":
      return { x: pad, y: pad };
    case "top-right":
      return { x: canvasW - logoW - pad, y: pad };
    case "bottom-left":
      return { x: pad, y: canvasH - logoH - pad };
    case "center":
      return { x: (canvasW - logoW) / 2, y: (canvasH - logoH) / 2 };
    case "bottom-right":
    default:
      return { x: canvasW - logoW - pad, y: canvasH - logoH - pad };
  }
}

function drawCroppedLogo(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  crop: WatermarkLogoCrop | null,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  if (!crop) {
    ctx.drawImage(logo, dx, dy, dw, dh);
    return;
  }
  const sw = logo.naturalWidth * crop.w;
  const sh = logo.naturalHeight * crop.h;
  const sx = logo.naturalWidth * crop.x;
  const sy = logo.naturalHeight * crop.y;
  ctx.drawImage(logo, sx, sy, sw, sh, dx, dy, dw, dh);
}

async function compositeWatermark(
  imageBlob: Blob,
  settings: BrandWatermarkSettings,
  template: WatermarkTemplateSettings,
): Promise<Blob> {
  const logoUrl = effectiveLogoDataUrl(settings);
  if (!logoUrl) return imageBlob;

  const objectUrl = blobToObjectUrl(imageBlob);
  try {
    const [baseImg, logoImg] = await Promise.all([loadImage(objectUrl), loadImage(logoUrl)]);

    const canvas = document.createElement("canvas");
    canvas.width = baseImg.naturalWidth;
    canvas.height = baseImg.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return imageBlob;

    ctx.drawImage(baseImg, 0, 0);

    const minEdge = Math.min(canvas.width, canvas.height);
    const targetW = (minEdge * template.sizePercent) / 100;
    const aspect = logoImg.naturalWidth / Math.max(1, logoImg.naturalHeight);
    let logoW = targetW;
    let logoH = targetW / aspect;
    if (logoH > minEdge * 0.4) {
      logoH = minEdge * 0.4;
      logoW = logoH * aspect;
    }

    const pad = paddingPx(canvas.width, canvas.height);
    const { x, y } = positionCoords(
      template.position,
      canvas.width,
      canvas.height,
      logoW,
      logoH,
      pad,
    );

    ctx.save();
    ctx.globalAlpha = template.opacity / 100;
    drawCroppedLogo(ctx, logoImg, settings.crop, x, y, logoW, logoH);
    ctx.restore();

    const outType =
      imageBlob.type === "image/png" || imageBlob.type === "image/webp"
        ? imageBlob.type
        : "image/jpeg";
    return canvasToBlob(canvas, outType, outType === "image/jpeg" ? 0.92 : undefined);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Composite brand logo onto a raster image blob using portrait vs landscape template.
 */
export async function applyBrandWatermarkToImageBlob(
  imageBlob: Blob,
  settings: BrandWatermarkSettings,
): Promise<Blob> {
  if (!settings.enabled) return imageBlob;
  const logoUrl = effectiveLogoDataUrl(settings);
  if (!logoUrl) return imageBlob;
  if (!imageBlob.type || !imageBlob.type.startsWith("image/") || imageBlob.type.includes("svg")) {
    return imageBlob;
  }

  const objectUrl = blobToObjectUrl(imageBlob);
  try {
    const baseImg = await loadImage(objectUrl);
    const isPortrait = baseImg.naturalHeight > baseImg.naturalWidth;
    const template = isPortrait ? settings.portrait : settings.landscape;
    return compositeWatermark(imageBlob, settings, template);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Preview compositing with an explicit template (settings UI). */
export async function renderWatermarkPreviewDataUrl(
  sampleImageUrl: string,
  settings: BrandWatermarkSettings,
  template: WatermarkTemplateSettings,
): Promise<string> {
  const res = await fetch(sampleImageUrl);
  const blob = await res.blob();
  const out = await compositeWatermark(blob, { ...settings, enabled: true }, template);
  return blobToDataUrl(out);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read preview."));
    r.readAsDataURL(blob);
  });
}
