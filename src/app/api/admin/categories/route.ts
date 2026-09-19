import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";

export async function GET() {
  try {
    const categories = await DbService.getCategories();
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const category = await DbService.createCategory(body);
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (body.id) {
      const updated = await DbService.updateCategory(body.id, body);
      return NextResponse.json({ success: true, category: updated });
    }
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
