import { NextRequest, NextResponse } from "next/server"
import { generateRegistrationOptions, generateAuthenticationOptions } from "@simplewebauthn/server"
import { setChallenge, getRpId } from "@/lib/passkey/store"

const RP_NAME = "Moistello"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, mode, credentialId } = body

    if (mode === "register") {
      if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "invalid_email" }, { status: 400 })
      }

      const rpID = getRpId()
      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID,
        userName: email,
        userID: new TextEncoder().encode(email),
        attestationType: "none",
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "required",
        },
        timeout: 120_000,
      })

      setChallenge(email, options.challenge, email)

      return NextResponse.json({ options, challenge: options.challenge })
    }

    if (mode === "authenticate") {
      if (!credentialId || typeof credentialId !== "string") {
        return NextResponse.json({ error: "invalid_credential_id" }, { status: 400 })
      }

      const rpID = getRpId()
      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: [
          { id: credentialId, transports: ["internal"] },
        ],
        userVerification: "required",
        timeout: 60_000,
      })

      setChallenge(credentialId, options.challenge, "")

      return NextResponse.json({ options, challenge: options.challenge })
    }

    return NextResponse.json({ error: "invalid_mode" }, { status: 400 })
  } catch (err) {
    console.error("generate-options error:", err)
    return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}
