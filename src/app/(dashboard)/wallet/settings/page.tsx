"use client"

import { PageHeader } from "@/components/shared/page-header"
import { WalletSettings } from "@/components/wallet/wallet-settings"

export default function WalletSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet Settings"
        description="Manage your connected wallets, rename them, and control your connections."
      />
      <WalletSettings />
    </div>
  )
}
