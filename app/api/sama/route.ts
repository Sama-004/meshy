import { NextResponse } from "next/server";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

export async function GET(req, res) {
  try {
    // const { prompt } = req.body;
    const prompt = "A dog mask";
    const apiKey = process.env.MESHY_API_KEY;
    console.log("api key", apiKey);
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // 1. Generate preview model
    const previewRequest = {
      mode: "preview",
      prompt: prompt || "a monster mask",
      negative_prompt: "low quality, low resolution, low poly, ugly",
      art_style: "realistic",
      should_remesh: true,
    };

    let previewResponse = await fetch(
      "https://api.meshy.ai/openapi/v2/text-to-3d",
      {
        method: "POST",
        headers,
        body: JSON.stringify(previewRequest),
      },
    );

    if (!previewResponse.ok)
      throw new Error(
        `Preview generation failed: ${previewResponse.statusText}`,
      );
    const { result: previewTaskId } = await previewResponse.json();
    console.log("Preview task created. Task ID:", previewTaskId);

    // 2. Poll preview task status
    let previewTask;
    do {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      previewResponse = await fetch(
        `https://api.meshy.ai/openapi/v2/text-to-3d/${previewTaskId}`,
        { headers },
      );
      if (!previewResponse.ok)
        throw new Error(
          `Preview status check failed: ${previewResponse.statusText}`,
        );
      previewTask = await previewResponse.json();
      console.log(
        `Preview status: ${previewTask.status} | Progress: ${previewTask.progress}`,
      );
    } while (previewTask.status !== "SUCCEEDED");

    // 3. Download preview model
    const previewModelUrl = previewTask.model_urls.glb;
    const previewModelResponse = await fetch(previewModelUrl);
    if (!previewModelResponse.ok)
      throw new Error(
        `Preview download failed: ${previewModelResponse.statusText}`,
      );

    // Save to file system (or you could return as base64)
    const previewBuffer = await previewModelResponse.buffer();
    const modelsDir = path.join(process.cwd(), "public", "models");

    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }

    // 2. Then write to a specific file
    const previewPath = path.join(modelsDir, "preview_model.glb");
    fs.writeFileSync(previewPath, previewBuffer);
    console.log("Preview model downloaded.");

    // 4. Generate refined model
    const refinedRequest = {
      mode: "refine",
      preview_task_id: previewTaskId,
    };

    let refinedResponse = await fetch(
      "https://api.meshy.ai/openapi/v2/text-to-3d",
      {
        method: "POST",
        headers,
        body: JSON.stringify(refinedRequest),
      },
    );

    if (!refinedResponse.ok)
      throw new Error(`Refinement failed: ${refinedResponse.statusText}`);
    const { result: refinedTaskId } = await refinedResponse.json();
    console.log("Refined task created. Task ID:", refinedTaskId);

    // 5. Poll refined task status
    let refinedTask;
    do {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      refinedResponse = await fetch(
        `https://api.meshy.ai/openapi/v2/text-to-3d/${refinedTaskId}`,
        { headers },
      );
      if (!refinedResponse.ok)
        throw new Error(
          `Refinement status check failed: ${refinedResponse.statusText}`,
        );
      refinedTask = await refinedResponse.json();
      console.log(
        `Refined status: ${refinedTask.status} | Progress: ${refinedTask.progress}`,
      );
    } while (refinedTask.status !== "SUCCEEDED");

    // 6. Download refined model
    const refinedModelUrl = refinedTask.model_urls.glb;
    const refinedModelResponse = await fetch(refinedModelUrl);
    if (!refinedModelResponse.ok)
      throw new Error(
        `Refined download failed: ${refinedModelResponse.statusText}`,
      );

    const refinedBuffer = await refinedModelResponse.buffer();
    const refinedPath = "./public/models/refined_model.glb";
    fs.writeFileSync(refinedPath, refinedBuffer);
    console.log("Refined model downloaded.");

    return NextResponse.json({
      status: 200,
      previewModel: "/models/preview_model.glb",
      refinedModel: "/models/refined_model.glb",
      taskIds: { previewTaskId, refinedTaskId },
    });
  } catch (error) {
    console.error("Error in 3D model generation:", error);
    return NextResponse.json({
      status: 500,
      message: `Error in 3D model generation ${error}`,
    });
  }
}
