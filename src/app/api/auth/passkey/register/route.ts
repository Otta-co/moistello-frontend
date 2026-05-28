import { NextRequest, NextResponse } from "next/server"
import { verifyRegistrationResponse } from "@simplewebauthn/server"
import {
  getAndVerifyChallenge,
  storeCredential,
  getPepper,
  getRpId,
  getExpectedOrigin,
} from "@/lib/passkey/store"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { attestation, email } = body

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 })
    }

    if (!attestation || typeof attestation !== "object") {
      return NextResponse.json({ error: "invalid_attestation" }, { status: 400 })
    }

    const attestationRecord = attestation as { id?: string; rawId?: string; response?: { clientDataJSON?: string } }
    const credentialId = attestationRecord.rawId || attestationRecord.id || ""

    if (!credentialId) {
      return NextResponse.json({ error: "missing_credential_id" }, { status: 400 })
    }

    const clientDataJSON = attestationRecord.response?.clientDataJSON
    if (!clientDataJSON) {
      return NextResponse.json({ error: "invalid_attestation" }, { status: 400 })
    }

    let parsed: { challenge: string }
    try {
      parsed = JSON.parse(atob(clientDataJSON))
    } catch {
      return NextResponse.json({ error: "invalid_client_data" }, { status: 400 })
    }

    if (!getAndVerifyChallenge(email, parsed.challenge, email)) {
      return NextResponse.json({ error: "challenge_mismatch" }, { status: 400 })
    }

    const rpID = getRpId()
    const expectedOrigin = getExpectedOrigin()

    const verification = await verifyRegistrationResponse({
      response: attestation,
      expectedChallenge: parsed.challenge,
      expectedOrigin,
      expectedRPID: rpID,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "verification_failed" }, { status: 400 })
    }

    const { credential } = verification.registrationInfo
    storeCredential(credential.id, {
      credentialId: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
      transports: credential.transports as string[] | undefined,
    })

    const pepper = getPepper()
    return NextResponse.json({
      verified: true,
      email,
      credentialId: credential.id,
      pepper,
    })
  } catch (err) {
    console.error("register error:", err)
    return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}
