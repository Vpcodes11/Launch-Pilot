import { NextRequest } from "next/server";
import { receivePayment } from "@/lib/payments/webhook";

export function POST(req: NextRequest) {
  return receivePayment(req, "stripe");
}
