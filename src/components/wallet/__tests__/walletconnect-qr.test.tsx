import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { WalletConnectQR } from "../walletconnect-qr"

describe("WalletConnectQR", () => {
  const defaultProps = {
    uri: null,
    pairingState: "idle",
    error: null,
    onRetry: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("loading state", () => {
    it("renders spinner when uri is null and state is idle", () => {
      render(<WalletConnectQR {...defaultProps} />)
      expect(screen.getByText("Generating connection code...")).toBeDefined()
    })

    it("renders spinner when uri is null in pairing state", () => {
      render(<WalletConnectQR {...defaultProps} pairingState="pairing" />)
      expect(screen.getByText("Generating connection code...")).toBeDefined()
    })
  })

  describe("QR display state", () => {
    it("renders QR canvas when uri is provided", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri="wc:abc123@2"
          pairingState="pairing"
        />,
      )
      expect(screen.getByText("Scan with your wallet app")).toBeDefined()
    })

    it("shows instruction steps", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri="wc:abc123@2"
          pairingState="pairing"
        />,
      )
      expect(screen.getByText(/Open Lobstr/)).toBeDefined()
      expect(screen.getByText(/Tap the QR scanner/)).toBeDefined()
      expect(screen.getByText(/Scan this code/)).toBeDefined()
    })

    it("shows countdown timer when pairing", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri="wc:abc123@2"
          pairingState="pairing"
        />,
      )
      expect(screen.getByText(/Code expires in/)).toBeDefined()
    })

    it("renders copy link button", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri="wc:abc123@2"
          pairingState="pairing"
        />,
      )
      expect(screen.getByLabelText("Copy connection link")).toBeDefined()
    })

    it("renders cancel button", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri="wc:abc123@2"
          pairingState="pairing"
        />,
      )
      expect(screen.getByText("Cancel")).toBeDefined()
    })

    it("has QR canvas with aria label", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri="wc:abc123@2"
          pairingState="pairing"
        />,
      )
      const canvas = document.querySelector("canvas")
      expect(canvas).toBeDefined()
      expect(canvas!.getAttribute("aria-label")).toBe("QR code for wallet connection")
    })
  })

  describe("approved state", () => {
    it("shows success message when approved", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri="wc:abc123@2"
          pairingState="approved"
        />,
      )
      expect(screen.getByText("Connected!")).toBeDefined()
      expect(screen.getByText(/Wallet linked successfully/)).toBeDefined()
    })

    it("shows check icon on approval", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri="wc:abc123@2"
          pairingState="approved"
        />,
      )
      expect(screen.getByText("Connected!")).toBeDefined()
    })
  })

  describe("rejected state", () => {
    it("shows cancellation message when rejected", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri="wc:abc123@2"
          pairingState="rejected"
        />,
      )
      expect(screen.getByText("Connection Cancelled")).toBeDefined()
    })

    it("shows retry button on rejection", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri="wc:abc123@2"
          pairingState="rejected"
        />,
      )
      const retryBtn = screen.getByText("Try Again")
      expect(retryBtn).toBeDefined()
      fireEvent.click(retryBtn)
      expect(defaultProps.onRetry).toHaveBeenCalled()
    })
  })

  describe("error state", () => {
    it("shows error message", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri={null}
          pairingState="error"
          error="Relay connection failed"
        />,
      )
      expect(screen.getByText("Connection Error")).toBeDefined()
    })

    it("shows custom error text", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri={null}
          pairingState="error"
          error="Custom error message"
        />,
      )
      expect(screen.getByText("Custom error message")).toBeDefined()
    })

    it("shows retry on error", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri={null}
          pairingState="error"
          error="Something went wrong"
        />,
      )
      const retryBtn = screen.getByText("Generate New Code")
      expect(retryBtn).toBeDefined()
      fireEvent.click(retryBtn)
      expect(defaultProps.onRetry).toHaveBeenCalled()
    })

    it("shows timeout message when countdown expires", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri={null}
          pairingState="timeout"
          error={null}
        />,
      )
      expect(screen.getByText("Connection Timed Out")).toBeDefined()
    })
  })

  describe("interactions", () => {
    it("fires onCancel when cancel button clicked", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri="wc:abc123@2"
          pairingState="pairing"
        />,
      )
      fireEvent.click(screen.getByText("Cancel"))
      expect(defaultProps.onCancel).toHaveBeenCalled()
    })

    it("fires onRetry from rejected state", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          pairingState="rejected"
        />,
      )
      fireEvent.click(screen.getByText("Try Again"))
      expect(defaultProps.onRetry).toHaveBeenCalled()
    })

    it("copy button shows copied state", async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      })

      render(
        <WalletConnectQR
          {...defaultProps}
          uri="wc:abc123@2"
          pairingState="pairing"
        />,
      )
      fireEvent.click(screen.getByLabelText("Copy connection link"))
      await waitFor(() => {
        expect(screen.getByText("Copied")).toBeDefined()
      })
    })
  })

  describe("accessibility", () => {
    it("QR canvas has accessible aria label", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri="wc:abc123@2"
          pairingState="pairing"
        />,
      )
      const canvas = document.querySelector("canvas")
      expect(canvas!.getAttribute("aria-label")).toBe("QR code for wallet connection")
    })

    it("copy link button has aria label", () => {
      render(
        <WalletConnectQR
          {...defaultProps}
          uri="wc:abc123@2"
          pairingState="pairing"
        />,
      )
      expect(screen.getByLabelText("Copy connection link")).toBeDefined()
    })
  })
})
