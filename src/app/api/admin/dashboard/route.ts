import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";

export async function GET() {
  try {
    const metrics = await DbService.getDashboardMetrics();
    return NextResponse.json({ metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
