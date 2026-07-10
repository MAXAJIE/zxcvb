const ARTIFACT_IMAGE_IDS = new Set([
  "keris-panjang",
  "meriam-melaka",
  "terabai",
  "tengkolok",
  "baju-kurung-diraja",
  "set-perak-diraja",
  "gong-gamelan",
  "rebana-ubi",
  "seruling-tradisional",
  "alat-tenun-songket",
  "wau-bulan",
  "canting-batik",
  "congkak",
  "diabolo-cina",
  "catur-cina",
]);

export function artifactImageUrl(id: string, imageUrl?: string | null): string | null {
  if (imageUrl) return imageUrl;
  return ARTIFACT_IMAGE_IDS.has(id) ? `/artifacts/${id}.jpg` : null;
}
