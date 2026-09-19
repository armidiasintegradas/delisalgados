import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";

export async function GET() {
  try {
    const settings = await DbService.getSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await DbService.updateSettings(body);
    return NextResponse.json({ success: true, settings: updated, message: "Configurações salvas." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
