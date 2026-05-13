"use client";

import { useState } from "react";
import { DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";

interface CircleContributeFormProps {
  circleId: string;
  circleName: string;
  contributionAmount: number;
  currency: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CircleContributeForm({
  circleId,
  circleName,
  contributionAmount,
  currency,
  onSuccess,
  onCancel,
}: CircleContributeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { post } = await import("@/lib/api-client");
      const { signMessage, getFreighterPublicKey } = await import("@/lib/stellar");

      const publicKey = await getFreighterPublicKey();

      const payload = {
        circleId,
        amount: contributionAmount,
        currency,
        walletAddress: publicKey,
      };

      await post("/api/contributions", payload);

      const message = `Moistello Contribution: ${contributionAmount} ${currency} to ${circleName} (circle: ${circleId})`;
      const signedXdr = await signMessage(message);

      await post("/api/contributions/verify", {
        circleId,
        signedXdr,
        walletAddress: publicKey,
      });

      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to process contribution. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900">{circleName}</h4>
            <p className="text-sm text-gray-500">Confirm your contribution</p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Your contribution:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(contributionAmount, currency)}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
            <DollarSign className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              You are about to contribute{" "}
              <strong>{formatCurrency(contributionAmount, currency)}</strong> to{" "}
              <strong>{circleName}</strong>. This transaction will be signed using your
              Freighter wallet and processed on the Stellar network.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="md"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleSubmit}
          isLoading={isLoading}
          leftIcon={<DollarSign className="h-4 w-4" />}
        >
          Confirm & Sign with Freighter
        </Button>
      </div>
    </div>
  );
}
