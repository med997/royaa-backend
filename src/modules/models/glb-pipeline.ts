import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { cloneDocument, dedup, draco, prune, resample, simplify, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
import { toUsdz } from './usdz.js';

let io: NodeIO | undefined;
const getIO = async () =>
  (io ??= new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  }));

export const isGlb = (b: Uint8Array) => b.length > 12 && b[0] === 0x67 && b[1] === 0x6c && b[2] === 0x54 && b[3] === 0x46;

const USDZ_MAX_TRIANGLES = 80_000;

// USDZ stores geometry as text and can't be compressed, so cap its triangle count (the GLB keeps full detail)
async function usdFriendly(doc: Document) {
  const tris = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives()).reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION')?.getCount() ?? 0) / 3, 0);
  if (tris <= USDZ_MAX_TRIANGLES) return doc;
  const copy = cloneDocument(doc);
  await copy.transform(simplify({ simplifier: MeshoptSimplifier, ratio: USDZ_MAX_TRIANGLES / tris, error: 0.01 }));
  return copy;
}

// Optimised GLB (Android / web) + USDZ (iOS Quick Look) built from one source GLB
export async function processGlb(input: Uint8Array, useDraco: boolean) {
  const nodeIO = await getIO();
  const doc = await nodeIO.readBinary(input);
  await doc.transform(dedup(), prune(), resample(), weld(), textureCompress({ encoder: sharp, resize: [2048, 2048], quality: 85 }));
  const usdz = await toUsdz(await usdFriendly(doc));
  if (useDraco) await doc.transform(draco());
  const glb = await nodeIO.writeBinary(doc);
  return { glb, usdz };
}
