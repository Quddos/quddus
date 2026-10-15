import { QUD_MODEL } from "@/lib/qud";
import { CORS } from "../cors";

export function GET() {
  return Response.json(
    {
      object: "list",
      data: [{ id: QUD_MODEL, object: "model", created: 1791936000, owned_by: "raheem-qudus" }],
    },
    { headers: CORS },
  );
}
