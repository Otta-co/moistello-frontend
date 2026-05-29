import { NextResponse } from "next/server";
import fs from "fs";

export async function GET() {
  const swaggerPath = "/opt/moistello/backend/docs/api/swagger.json";

  try {
    const specContent = fs.readFileSync(swaggerPath, "utf-8");
    const spec = JSON.parse(specContent);
    return NextResponse.json(spec, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Swagger spec not found" },
      { status: 500 }
    );
  }
}