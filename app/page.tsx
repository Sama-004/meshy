import ModelViewer from "@/components/model-viewer";

export default function Home() {
  return (
    <main className="bg-white">
      <h1>3D Model Viewer</h1>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2>Preview Model</h2>
          <ModelViewer modelPath="/models/preview_model.glb" />
        </div>
        <div>
          <h2>Refined Model</h2>
          <ModelViewer modelPath="/models/refined_model.glb" />
        </div>
      </div>
    </main>
  );
}
