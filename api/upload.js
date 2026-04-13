import { put } from '@vercel/blob';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const blob = await put(file.name, file, {
      access: "public",
    });

    console.log("Upload successful:", blob.url);

    return Response.json({ url: blob.url });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    return Response.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
