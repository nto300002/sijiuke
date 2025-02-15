import { NextResponse } from "next/server";
import practiceTexts from "../../../api/practice-texts.json";

// POST リクエストで practiceTexts.json の内容を返す API エンドポイント
export async function POST(request) {
  return NextResponse.json(practiceTexts);
} 
