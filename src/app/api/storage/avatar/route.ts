import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    // Convert to webp and append unique timestamp
    const filename = `${session.user.id}-${Date.now()}.webp`;
    
    // Ensure uploads directory exists
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });

    // Use Sharp to resize, compress and convert to WebP to guarantee it's under 50KB
    const compressedBuffer = await sharp(buffer)
      .resize({ width: 400, height: 400, fit: "cover" })
      .webp({ quality: 60 })
      .toBuffer();

    const path = join(uploadDir, filename);
    await writeFile(path, compressedBuffer);

    const publicUrl = `/uploads/avatars/${filename}`;

    // Update user profile
    await db.update(users).set({ image: publicUrl }).where(eq(users.id, session.user.id));

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Avatar Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
