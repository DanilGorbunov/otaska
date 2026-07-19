import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { auth } from "./auth"

const http = httpRouter()
auth.addHttpRoutes(http)

// Verifies Stripe's webhook signature by hand (Web Crypto HMAC-SHA256) instead of pulling in
// the Node-only `stripe` SDK, which would force this file onto Convex's Node runtime.
// Scheme: https://stripe.com/docs/webhooks/signatures
async function verifyStripeSignature(payload: string, signatureHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(signatureHeader.split(",").map(p => p.split("=") as [string, string]))
  const timestamp = parts.t
  const expected = parts.v1
  if (!timestamp || !expected) return false

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`))
  const computed = [...new Uint8Array(signatureBytes)].map(b => b.toString(16).padStart(2, "0")).join("")
  return computed === expected
}

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) return new Response("STRIPE_WEBHOOK_SECRET not set", { status: 500 })

    const signatureHeader = request.headers.get("stripe-signature")
    const payload = await request.text()
    if (!signatureHeader || !(await verifyStripeSignature(payload, signatureHeader, secret))) {
      return new Response("Invalid signature", { status: 400 })
    }

    const event = JSON.parse(payload)

    if (event.type === "checkout.session.completed") {
      const session = event.data.object
      await ctx.runMutation(internal.payments.markEscrowFunded, {
        sessionId: session.id,
        paymentIntentId: session.payment_intent,
      })
    }
    // TODO once onboarding UX is wired: handle "account.updated" to flip
    // userProfiles.stripeOnboarded once a performer's Express account can receive transfers.

    return new Response(null, { status: 200 })
  }),
})

export default http
