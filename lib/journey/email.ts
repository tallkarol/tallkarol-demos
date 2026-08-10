import { Resend } from "resend"
import type { Order } from "@/lib/store"

/**
 * Journey emails, sent via Resend as `Harbor & Pine <RESEND_FROM_EMAIL>` —
 * display name carries the fiction, the address stays honest.
 *
 * Templates are hand-inlined HTML (no React Email dependency): email clients
 * ignore stylesheets, so everything is inline styles on tables and the brand
 * serif falls back to Georgia. Product images are absolute URLs into the
 * demos deployment.
 */

const BASE = "https://demos.tallkarol.com"

const WALNUT = "#5D4037"
const FOREST = "#2E4A3D"
const INK = "#1F2C2B"
const CANVAS = "#FAF6F3"

function shell(inner: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${CANVAS};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E4D9D3;">
          <tr>
            <td style="background:${FOREST};padding:22px 32px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#ffffff;letter-spacing:0.02em;">Harbor &amp; Pine</span>
            </td>
          </tr>
          ${inner}
          <tr>
            <td style="padding:20px 32px 26px;border-top:1px solid #EFE7E1;">
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:#8a7f79;">
                Harbor &amp; Pine is a fictional company — this is a live demo built by
                <a href="https://www.tallkarol.com" style="color:${WALNUT};">Tall Karol</a>.
                No payment was taken and nothing ships. Your email is used only to run
                this demo and is auto-deleted within 7 days.
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

function cta(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px;">
    <tr><td style="border-radius:8px;background:${WALNUT};">
      <a href="${href}" style="display:inline-block;padding:13px 26px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a>
    </td></tr>
  </table>`
}

export function welcomeEmail(opts: { order: Order; verifyUrl: string }) {
  const { order, verifyUrl } = opts
  const firstName = order.customerName.split(" ")[0]

  const html = shell(`
    <tr>
      <td style="padding:32px 32px 0;">
        <p style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${WALNUT};font-weight:bold;">Order ${order.number}</p>
        <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${INK};font-weight:600;">
          ${firstName}, your commission is in the queue.
        </h1>
        <p style="margin:0 0 18px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.65;color:#4a423e;">
          The <strong>${order.item.name}</strong> — ${order.item.options.map((o) => o.value).join(" · ")} —
          is registered with the workshop. One click below confirms it's really you,
          and then the whole machine starts moving: production, quality check, freight,
          white-glove delivery. You'll watch every stage happen live.
        </p>
        <img src="${BASE}${order.item.image}" width="496" alt="${order.item.name}" style="width:100%;max-width:496px;border-radius:8px;border:1px solid #EFE7E1;" />
        ${cta(verifyUrl, "Confirm & watch it live →")}
        <p style="margin:6px 0 24px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#8a7f79;">
          Nothing continues until you click — no click, no more email.
        </p>
      </td>
    </tr>`)

  return {
    subject: `Order ${order.number} — your ${order.item.name} is in the queue`,
    html,
  }
}

export function deliveredEmail(opts: { order: Order; portalUrl: string; loopUrl: string }) {
  const { order, portalUrl, loopUrl } = opts
  const firstName = order.customerName.split(" ")[0]

  const html = shell(`
    <tr>
      <td style="padding:32px 32px 0;">
        <p style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${FOREST};font-weight:bold;">Delivered · ${order.number}</p>
        <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${INK};font-weight:600;">
          ${firstName}, it's in your home.
        </h1>
        <p style="margin:0 0 18px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.65;color:#4a423e;">
          The ${order.item.name} was delivered and signed for — the full record, care guide
          included, lives in <a href="${portalUrl}" style="color:${WALNUT};">your portal</a>.
          And because you're clearly someone with taste: <strong>PINE10</strong> takes 10%
          off a companion piece. That coupon is the last wire in the diagram — click it
          and you'll have run the whole loop.
        </p>
        ${cta(loopUrl, "Use PINE10 — close the loop →")}
        <p style="margin:6px 0 24px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#8a7f79;">
          This is the "coupon.redeemed → order.created" edge, in your inbox.
        </p>
      </td>
    </tr>`)

  return {
    subject: `Delivered — and PINE10 is yours, ${firstName}`,
    html,
  }
}

export async function sendJourneyEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!key || !from) return { ok: false, error: "resend env not configured" }

  try {
    const resend = new Resend(key)
    const { data, error } = await resend.emails.send({
      from: `Harbor & Pine <${from}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id ?? "unknown" }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "resend send failed" }
  }
}
