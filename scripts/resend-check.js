// scripts/resend-check.js
import { Resend } from "resend";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  from: process.env.RESEND_FROM,          // 'Acme <onboarding@resend.dev>'
  to: [process.env.TEST_EMAIL || "tuemail@xxx.com"],
  subject: "Resend OK",
  html: "<p>Resend funcionando ✅</p>",
});

console.log("data:", data);
console.log("error:", error);
