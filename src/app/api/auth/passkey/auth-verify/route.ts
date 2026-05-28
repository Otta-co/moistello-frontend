import { NextRequest, NextResponse } from "next/server"
import { verifyAuthenticationResponse } from "@simplewebauthn/server"
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server"
import {
  getAndVerifyChallenge,
  getCredential,
  getPepper,
  getRpId,
  getExpectedOrigin,
} from "@/lib/passkey/store"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { credentialId, email, assertion } = body

    if (!credentialId || typeof credentialId !== "string") {
      return NextResponse.json({ error: "invalid_credential_id" }, { status: 400 })
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 })
    }

    if (!assertion || typeof assertion !== "object") {
      return NextResponse.json({ error: "invalid_assertion" }, { status: 400 })
    }

    const storedCredential = getCredential(credentialId)
    if (!storedCredential) {
      return NextResponse.json({ error: "credential_not_found" }, { status: 400 })
    }

    const assertionRecord = assertion as { response?: { clientDataJSON?: string } }
    const clientDataJSON = assertionRecord.response?.clientDataJSON
    if (!clientDataJSON) {
      return NextResponse.json({ error: "invalid_assertion" }, { status: 400 })
    }

    let parsed: { challenge: string }
    try {
      parsed = JSON.parse(atob(clientDataJSON))
    } catch {
      return NextResponse.json({ error: "invalid_client_data" }, { status: 400 })
    }

    if (!getAndVerifyChallenge(credentialId, parsed.challenge, "")) {
      return NextResponse.json({ error: "challenge_mismatch" }, { status: 400 })
    }

    const rpID = getRpId()
    const expectedOrigin = getExpectedOrigin()

    const verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: parsed.challenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: storedCredential.credentialId,
        publicKey: storedCredential.publicKey,
        counter: storedCredential.counter,
        transports: (storedCredential.transports ?? []) as AuthenticatorTransportFuture[],
      },
    })

    if (!verification.verified) {
      return NextResponse.json({ error: "verification_failed" }, { status: 400 })
    }

    if (verification.authenticationInfo) {
      storedCredential.counter = verification.authenticationInfo.newCounter ?? storedCredential.counter
    }

    const pepper = getPepper()
    return NextResponse.json({
      verified: true,
      email,
      credentialId,
      pepper,
    })
  } catch (err) {
    console.error("auth-verify error:", err)
    return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}
