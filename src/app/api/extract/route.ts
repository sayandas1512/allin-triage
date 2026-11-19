import { extractText, getDocumentProxy } from "unpdf";
import { rateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

const MAX_BYTES = 4_000_000; // stays under Vercel's 4.5 MB request body limit

/** Extracts text from one uploaded PDF (deck or form). One file per request. */
export async function POST(req: Request) {
  const limited = rateLimit(req, "extract");
  if (limited) return limited;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data with a 'file' field" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: `${file.name} is larger than 4 MB` }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  // %PDF magic number
  if (!(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46)) {
    return Response.json({ error: `${file.name} is not a PDF` }, { status: 415 });
  }

  try {
    const pdf = await getDocumentProxy(bytes);
    const { totalPages, text } = await extractText(pdf, { mergePages: false });
    const pages = (text as string[]).map((t, i) => `--- page ${i + 1} ---\n${t.replace(/[ \t]+/g, " ").trim()}`);
    const joined = pages.join("\n").slice(0, 40_000);
    if (joined.replace(/--- page \d+ ---/g, "").trim().length < 40) {
      return Response.json({ error: `${file.name} has no extractable text (scanned image?)` }, { status: 422 });
    }
    return Response.json({ name: file.name, pages: totalPages, text: joined });
  } catch (e) {
    return Response.json({ error: `Could not read ${file.name}: ${e instanceof Error ? e.message.slice(0, 120) : "unknown"}` }, { status: 422 });
  }
}
