import { test, expect } from "@playwright/test"

test("WalletConnect generates QR code AND code on /register", async ({ page }) => {
  await page.goto("/register")

  await page.getByRole("button", { name: /walletconnect/i }).click()

  await page.waitForSelector("canvas[aria-label*='QR code']", { timeout: 15000 })

  const canvas = page.locator("canvas[aria-label*='QR code']")
  await expect(canvas).toBeVisible()

  await expect(page.locator("text=Scan with your wallet app")).toBeVisible()

  await expect(page.locator("text=Or use this link:")).toBeVisible()

  const codeBlock = page.locator("code").first()
  await expect(codeBlock).toBeVisible()
  const codeText = await codeBlock.textContent()
  expect(codeText).toMatch(/wc:/)
})