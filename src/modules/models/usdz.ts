import type { Document, Material, Primitive, Texture, TextureInfo } from '@gltf-transform/core';
import sharp from 'sharp';

type V3 = [number, number, number];
const n6 = (x: number) => String(+x.toFixed(6));
const list = (a: ArrayLike<number>) => Array.from(a, n6).join(', ');
const num = (x: number, d: number) => String(+x.toFixed(d));
const tuple3 = (a: ArrayLike<number>, i: number, d: number) => `(${num(a[i], d)},${num(a[i + 1], d)},${num(a[i + 2], d)})`;

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (b: Uint8Array) => {
  let c = 0xffffffff;
  for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

// Uncompressed zip with 64-byte aligned file data, as USDZ requires
export function zipUsdz(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.name);
    const extraLen = 4 + ((64 - ((offset + 30 + name.length + 4) % 64)) % 64);
    const crc = crc32(f.data);
    const head = Buffer.alloc(30 + name.length + extraLen);
    head.writeUInt32LE(0x04034b50, 0);
    head.writeUInt16LE(20, 4);
    head.writeUInt32LE(crc, 14);
    head.writeUInt32LE(f.data.length, 18);
    head.writeUInt32LE(f.data.length, 22);
    head.writeUInt16LE(name.length, 26);
    head.writeUInt16LE(extraLen, 28);
    name.copy(head, 30);
    head.writeUInt16LE(0x1986, 30 + name.length);
    head.writeUInt16LE(extraLen - 4, 32 + name.length);

    const cd = Buffer.alloc(46 + name.length);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(f.data.length, 20);
    cd.writeUInt32LE(f.data.length, 24);
    cd.writeUInt16LE(name.length, 28);
    cd.writeUInt32LE(offset, 42);
    name.copy(cd, 46);
    central.push(cd);

    parts.push(head, f.data);
    offset += head.length + f.data.length;
  }
  const cdSize = central.reduce((s, c) => s + c.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cdSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, ...central, end]);
}

const mulPoint = (m: ArrayLike<number>, x: number, y: number, z: number): V3 => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
];

// Inverse-transpose of the upper 3x3, for normals
function normalMatrix(m: ArrayLike<number>) {
  const [a, b, c, d, e, f, g, h, i] = [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]];
  const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g;
  const det = a * A + b * B + c * C || 1;
  return {
    det,
    n: [A / det, B / det, C / det, (c * h - b * i) / det, (a * i - c * g) / det, (b * g - a * h) / det, (b * f - c * e) / det, (c * d - a * f) / det, (a * e - b * d) / det],
  };
}

const WRAP: Record<number, string> = { 33071: 'clamp', 33648: 'mirror', 10497: 'repeat' };

export async function toUsdz(doc: Document): Promise<Uint8Array> {
  const root = doc.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  if (!scene) throw new Error('GLB has no scene');

  const textures = new Map<Texture, string>();
  const files: { name: string; data: Uint8Array }[] = [];
  const texFile = async (t: Texture) => {
    let name = textures.get(t);
    if (!name) {
      const jpeg = t.getMimeType() === 'image/jpeg';
      name = `textures/tex_${textures.size}.${jpeg ? 'jpg' : 'png'}`;
      textures.set(t, name);
      const image = Buffer.from(t.getImage()!);
      files.push({ name, data: jpeg ? image : await sharp(image).png().toBuffer() });
    }
    return name;
  };

  const materials = new Map<Material | null, string>();
  const matBlocks: string[] = [];
  const matPath = (n: string) => `/Root/Materials/${n}`;

  const addMaterial = async (m: Material | null) => {
    const key = m ?? null;
    if (materials.has(key)) return materials.get(key)!;
    const name = `Material_${materials.size}`;
    materials.set(key, name);
    const base = `${matPath(name)}`;
    const inputs: string[] = [];
    const shaders: string[] = [];

    const tex = async (id: string, texture: Texture, info: TextureInfo | null, space: 'sRGB' | 'raw', scale = '(1, 1, 1, 1)', bias = '(0, 0, 0, 0)') => {
      const file = await texFile(texture);
      const wrapS = WRAP[info?.getWrapS() ?? 10497] ?? 'repeat';
      const wrapT = WRAP[info?.getWrapT() ?? 10497] ?? 'repeat';
      shaders.push(`            def Shader "${id}"
            {
                uniform token info:id = "UsdUVTexture"
                asset inputs:file = @${file}@
                float2 inputs:st.connect = <${base}/uvReader.outputs:result>
                token inputs:wrapS = "${wrapS}"
                token inputs:wrapT = "${wrapT}"
                float4 inputs:scale = ${scale}
                float4 inputs:bias = ${bias}
                token inputs:sourceColorSpace = "${space}"
                float3 outputs:rgb
                float outputs:r
                float outputs:g
                float outputs:b
                float outputs:a
            }`);
      return `<${base}/${id}`;
    };

    const bc = m?.getBaseColorFactor() ?? [1, 1, 1, 1];
    const baseTex = m?.getBaseColorTexture();
    const mode = m?.getAlphaMode() ?? 'OPAQUE';
    let baseRef: string | null = null;
    if (baseTex) baseRef = await tex('BaseColorTex', baseTex, m!.getBaseColorTextureInfo(), 'sRGB', `(${n6(bc[0])}, ${n6(bc[1])}, ${n6(bc[2])}, ${n6(bc[3])})`);
    inputs.push(baseRef ? `color3f inputs:diffuseColor.connect = ${baseRef}.outputs:rgb>` : `color3f inputs:diffuseColor = (${n6(bc[0])}, ${n6(bc[1])}, ${n6(bc[2])})`);

    const em = m?.getEmissiveFactor() ?? [0, 0, 0];
    const emTex = m?.getEmissiveTexture();
    if (emTex) inputs.push(`color3f inputs:emissiveColor.connect = ${await tex('EmissiveTex', emTex, m!.getEmissiveTextureInfo(), 'sRGB', `(${n6(em[0])}, ${n6(em[1])}, ${n6(em[2])}, 1)`)}.outputs:rgb>`);
    else inputs.push(`color3f inputs:emissiveColor = (${n6(em[0])}, ${n6(em[1])}, ${n6(em[2])})`);

    const rf = m?.getRoughnessFactor() ?? 1;
    const mf = m?.getMetallicFactor() ?? 1;
    const mrTex = m?.getMetallicRoughnessTexture();
    if (mrTex) {
      const ref = await tex('MetalRoughTex', mrTex, m!.getMetallicRoughnessTextureInfo(), 'raw', `(1, ${n6(rf)}, ${n6(mf)}, 1)`);
      inputs.push(`float inputs:roughness.connect = ${ref}.outputs:g>`, `float inputs:metallic.connect = ${ref}.outputs:b>`);
    } else inputs.push(`float inputs:roughness = ${n6(rf)}`, `float inputs:metallic = ${n6(mf)}`);

    const occ = m?.getOcclusionTexture();
    if (occ) inputs.push(`float inputs:occlusion.connect = ${await tex('OcclusionTex', occ, m!.getOcclusionTextureInfo(), 'raw')}.outputs:r>`);
    const nrm = m?.getNormalTexture();
    if (nrm) {
      const s = m!.getNormalScale();
      inputs.push(`normal3f inputs:normal.connect = ${await tex('NormalTex', nrm, m!.getNormalTextureInfo(), 'raw', `(${n6(2 * s)}, ${n6(2 * s)}, 2, 1)`, '(-1, -1, -1, 0)')}.outputs:rgb>`);
    }

    if (mode === 'OPAQUE') inputs.push('float inputs:opacity = 1');
    else {
      inputs.push(baseRef ? `float inputs:opacity.connect = ${baseRef}.outputs:a>` : `float inputs:opacity = ${n6(bc[3])}`);
      if (mode === 'MASK') inputs.push(`float inputs:opacityThreshold = ${n6(m!.getAlphaCutoff())}`);
    }

    matBlocks.push(`        def Material "${name}"
        {
            token outputs:surface.connect = <${base}/PreviewSurface.outputs:surface>

            def Shader "PreviewSurface"
            {
                uniform token info:id = "UsdPreviewSurface"
${inputs.map((l) => `                ${l}`).join('\n')}
                token outputs:surface
            }

            def Shader "uvReader"
            {
                uniform token info:id = "UsdPrimvarReader_float2"
                token inputs:varname = "st"
                float2 outputs:result
            }

${shaders.join('\n\n')}
        }`);
    return name;
  };

  const meshBlocks: string[] = [];
  let meshIndex = 0;
  const jobs: Array<{ prim: Primitive; world: ArrayLike<number> }> = [];
  scene.traverse((node) => {
    const mesh = node.getMesh();
    if (mesh) for (const prim of mesh.listPrimitives()) jobs.push({ prim, world: node.getWorldMatrix() });
  });

  for (const { prim, world } of jobs) {
    const pos = prim.getAttribute('POSITION');
    if (!pos || prim.getMode() !== 4) continue;
    const count = pos.getCount();
    const uvAcc = prim.getAttribute('TEXCOORD_0');
    const nAcc = prim.getAttribute('NORMAL');
    const { det, n: nm } = normalMatrix(world);

    const points: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    const tmp: number[] = [0, 0, 0];
    for (let i = 0; i < count; i++) {
      pos.getElement(i, tmp);
      const p = mulPoint(world, tmp[0], tmp[1], tmp[2]);
      points.push(...p);
      for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]); }
      if (nAcc) {
        nAcc.getElement(i, tmp);
        const x = nm[0] * tmp[0] + nm[3] * tmp[1] + nm[6] * tmp[2];
        const y = nm[1] * tmp[0] + nm[4] * tmp[1] + nm[7] * tmp[2];
        const z = nm[2] * tmp[0] + nm[5] * tmp[1] + nm[8] * tmp[2];
        const len = Math.hypot(x, y, z) || 1;
        normals.push(x / len, y / len, z / len);
      }
      if (uvAcc) {
        uvAcc.getElement(i, tmp);
        uvs.push(tmp[0], 1 - tmp[1]);
      }
    }

    const idxAcc = prim.getIndices();
    const total = idxAcc ? idxAcc.getCount() : count;
    const indices: number[] = new Array(total);
    for (let i = 0; i < total; i++) indices[i] = idxAcc ? idxAcc.getScalar(i) : i;
    if (det < 0) for (let i = 0; i + 2 < total; i += 3) [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];

    const mat = prim.getMaterial();
    const matName = await addMaterial(mat);
    const id = `Mesh_${meshIndex++}`;
    meshBlocks.push(`            def Mesh "${id}" (
                prepend apiSchemas = ["MaterialBindingAPI"]
            )
            {
                int[] faceVertexCounts = [${Array(total / 3).fill(3).join(',')}]
                int[] faceVertexIndices = [${indices.join(',')}]
                point3f[] points = [${Array.from({ length: count }, (_, i) => tuple3(points, i * 3, 5)).join(',')}]
                float3[] extent = [(${list(min)}), (${list(max)})]
${normals.length ? `                normal3f[] normals = [${Array.from({ length: count }, (_, i) => tuple3(normals, i * 3, 4)).join(',')}] (
                    interpolation = "vertex"
                )\n` : ''}${uvs.length ? `                texCoord2f[] primvars:st = [${Array.from({ length: count }, (_, i) => `(${num(uvs[i * 2], 5)},${num(uvs[i * 2 + 1], 5)})`).join(',')}] (
                    interpolation = "vertex"
                )\n` : ''}                rel material:binding = <${matPath(matName)}>
                uniform bool doubleSided = ${mat?.getDoubleSided() ? 'true' : 'false'}
                uniform token subdivisionScheme = "none"
            }`);
  }
  if (!meshBlocks.length) throw new Error('GLB has no triangle meshes');

  const usda = `#usda 1.0
(
    customLayerData = {
        string creator = "Royaa GLB to USDZ"
    }
    defaultPrim = "Root"
    metersPerUnit = 1
    upAxis = "Y"
)

def Xform "Root"
{
    def Scope "Scenes" (
        kind = "sceneLibrary"
    )
    {
        def Xform "Scene" (
            customData = {
                bool preliminary_collidesWithEnvironment = 0
                string sceneName = "Scene"
            }
            sceneName = "Scene"
        )
        {
            token preliminary:anchoring:type = "plane"
            token preliminary:planeAnchoring:alignment = "horizontal"

${meshBlocks.join('\n\n')}
        }
    }

    def Scope "Materials"
    {
${matBlocks.join('\n\n')}
    }
}
`;
  return zipUsdz([{ name: 'model.usda', data: Buffer.from(usda) }, ...files]);
}
