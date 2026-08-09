import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function getOwner() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  const owner = await db.user.upsert({
    where: { id: userId },
    update: { email, name },
    create: { id: userId, email, name },
  });

  return owner;
}

/**
 * GET /api/ive/user-state
 *
 * Returns only the authenticated user's workspace artifacts. The browser never
 * supplies the ownership key; Clerk is the authority for user identity.
 */
export async function GET() {
  try {
    const owner = await getOwner();
    if (!owner) return new NextResponse("Unauthorized", { status: 401 });

    const artifacts = await db.post.findMany({
      where: { authorId: owner.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      hasData: artifacts.length > 0,
      artifactCount: artifacts.length,
      artifacts,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("IVE user-state GET failed", error);
    return new NextResponse("Unable to load workspace state", { status: 500 });
  }
}

/**
 * POST /api/ive/user-state
 *
 * Creates the user's first (or subsequent) workspace artifact. Ownership is
 * derived exclusively from the authenticated Clerk session.
 */
export async function POST(request: Request) {
  try {
    const owner = await getOwner();
    if (!owner) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "Artifact title is required" }, { status: 400 });
    }

    const artifact = await db.post.create({
      data: {
        title: title.slice(0, 160),
        content: "User-created IVE workspace artifact",
        authorId: owner.id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      artifact,
      hasData: true,
    }, { status: 201 });
  } catch (error) {
    console.error("IVE user-state POST failed", error);
    return new NextResponse("Unable to create workspace artifact", { status: 500 });
  }
}
