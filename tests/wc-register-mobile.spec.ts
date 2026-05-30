import { test, expect } from "@playwright/test"

test("WalletConnect generates deeplink on mobile /register", async ({ page }) => {
  // Simulate iPhone user agent
  await page.setExtraHTTPHeaders({
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
  })
  
  await page.goto("https://moistello.com/register")
  
  await page.getByRole("button", { name: /walletconnect/i }).click()
  
  // Mobile shows "Preparing connection..." while awaiting URI
  await page.waitForSelector("text=Preparing connection", { timeout: 5000 })
  await expect(page.locator("text=Preparing connection")).toBeVisible()
  
  // Then should show mobile deeplink UI
  await page.waitForSelector("text=Open your wallet app", { timeout: 30000 })
  await expect(page.locator("text=Open your wallet app")).toBeVisible()
  
  // Should have "Open Wallet App" button
  const openButton = page.locator("button:has-text('Open Wallet App')")
  await expect(openButton).toBeVisible()
})
