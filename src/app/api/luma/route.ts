import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url param required" }, { status: 400 });

  try {
    const res = await fetch(
      `https://api.lu.ma/public/v1/event/get?url=${encodeURIComponent(url)}`,
      { headers: { Accept: "application/json" } }
    );

    if (!res.ok) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const data = await res.json();
    const event = data.event;

    // Normalise to what the form needs
    const startAt = event?.start_at ? new Date(event.start_at) : null;

    return NextResponse.json({
      name: event?.name ?? "",
      location: event?.geo_address_info?.full_address ?? event?.geo_address_info?.city_state ?? "",
      date: startAt ? startAt.toISOString().split("T")[0] : "",
      topic: (event?.tags ?? []).join(", "),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}
