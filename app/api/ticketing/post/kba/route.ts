import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { title, content, published = false } = body;

    if (!title || !content) {
      return NextResponse.json(
        {
          success: false,
          message: "Title and content are required.",
        },
        { status: 400 }
      );
    }

    const slug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    const existingArticle = await prisma.kbArticle.findUnique({
      where: { slug },
    });

    if (existingArticle) {
      return NextResponse.json(
        {
          success: false,
          message: "An article with this title already exists.",
        },
        { status: 409 }
      );
    }

    const article = await prisma.kbArticle.create({
      data: {
        title,
        slug,
        content,
        published,
      },
    });

    return NextResponse.json(
      {
        success: true,
        article,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating KB article:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create article.",
      },
      { status: 500 }
    );
  }
}