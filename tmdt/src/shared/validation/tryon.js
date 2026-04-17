const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIN_IMAGE_BYTES = 1_024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function detectImageType(buffer) {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return "";
}

function parseRetryFlag(value) {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export async function validateTryOnPayload(formData) {
  const rawFile = formData.get("image");
  const rawProductSlug = formData.get("productSlug");
  const rawRetry = formData.get("retry");
  const rawVariantId = formData.get("variantId");

  if (!(rawFile instanceof File)) {
    return {
      success: false,
      code: "TRYON_INVALID_INPUT",
      error: "Vui lòng tải lên một ảnh hợp lệ.",
    };
  }

  const normalizedMime = rawFile.type.toLowerCase().split(";")[0].trim();

  if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
    return {
      success: false,
      code: "TRYON_INVALID_INPUT",
      error: "Định dạng ảnh chưa được hỗ trợ. Chỉ chấp nhận JPG, PNG hoặc WEBP.",
    };
  }

  if (rawFile.size < MIN_IMAGE_BYTES || rawFile.size > MAX_IMAGE_BYTES) {
    return {
      success: false,
      code: "TRYON_INVALID_INPUT",
      error: "Kích thước ảnh không hợp lệ cho demo try-on.",
    };
  }

  const imageBuffer = Buffer.from(await rawFile.arrayBuffer());
  const detectedMime = detectImageType(imageBuffer);

  if (!detectedMime || detectedMime !== normalizedMime) {
    return {
      success: false,
      code: "TRYON_INVALID_INPUT",
      error: "Nội dung ảnh không hợp lệ hoặc không khớp định dạng khai báo.",
    };
  }

  const productSlug = typeof rawProductSlug === "string" ? rawProductSlug.trim().slice(0, 120) : "";

  if (!productSlug) {
    return {
      success: false,
      code: "TRYON_INVALID_INPUT",
      error: "Thiếu productSlug hợp lệ cho yêu cầu thử đồ.",
    };
  }

  const variantId = typeof rawVariantId === "string" ? rawVariantId.trim().slice(0, 120) : "";

  return {
    success: true,
    data: {
      imageBuffer,
      mimeType: normalizedMime,
      fileName: rawFile.name,
      productSlug,
      variantContext: variantId ? { variantId } : null,
      retry: parseRetryFlag(rawRetry),
    },
  };
}
