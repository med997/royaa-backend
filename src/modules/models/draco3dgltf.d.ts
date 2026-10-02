declare module 'draco3dgltf' {
  const draco3d: { createDecoderModule(): Promise<object>; createEncoderModule(): Promise<object> };
  export default draco3d;
}
