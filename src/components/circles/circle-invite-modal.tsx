"use client";

import { useState, useEffect } from "react";
import { Clock, Users, Link2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/copy-button";

interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  useCount: number;
  expiresAt?: string | null;
  createdAt: string;
}

interface CircleInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: string;
}

export function CircleInviteModal({
  isOpen,
  onClose,
  circleId,
}: CircleInviteModalProps) {
  const [inviteCode, setInviteCode] = useState<string>("");
  const [maxUses, setMaxUses] = useState(5);
  const [expiration, setExpiration] = useState<string>("");
  const [existingInvites, setExistingInvites] = useState<InviteCode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${inviteCode}`
      : `/invite/${inviteCode}`;

  useEffect(() => {
    if (isOpen && circleId) {
      const fetchInvites = async () => {
        try {
          const { get } = await import("@/lib/api-client");
          const response = await get<{ data: InviteCode[] }>(
            `/api/circles/${circleId}/invites`,
          );
          setExistingInvites(response.data ?? []);
        } catch {
          setExistingInvites([]);
        }
      };
      fetchInvites();
    }
  }, [isOpen, circleId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { post } = await import("@/lib/api-client");
      const payload = {
        circleId,
        maxUses,
        expiresAt: expiration || null,
      };
      const response = await post<{ data: InviteCode }>(
        `/api/circles/${circleId}/invites`,
        payload,
      );

      const newInvite = response.data;
      if (newInvite) {
        setInviteCode(newInvite.code);
        setExistingInvites((prev) => [newInvite, ...prev]);
      }
    } catch {
      // Silent fail - user can retry
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (invite: InviteCode) => {
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return <Badge variant="destructive" size="sm">Expired</Badge>;
    }
    if (invite.useCount >= invite.maxUses) {
      return <Badge variant="default" size="sm">Used Up</Badge>;
    }
    return <Badge variant="success" size="sm">Active</Badge>;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Members"
      description="Generate invite codes to share with people you want to join this circle."
      size="lg"
    >
      <div className="space-y-6">
        {inviteCode && (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <label className="block text-sm font-medium text-gray-900">
              Invite Code
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={inviteCode}
                readOnly
                className="font-mono text-sm"
                rightIcon={<CopyButton text={inviteCode} />}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-900">
                Share Link
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={inviteUrl}
                  readOnly
                  className="text-sm text-gray-600"
                  leftIcon={<Link2 className="h-4 w-4" />}
                  rightIcon={<CopyButton text={inviteUrl} label="Copy Link" />}
                />
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Invite Settings</h4>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Max Uses"
              type="number"
              min={1}
              max={100}
              value={String(maxUses)}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              leftIcon={<Users className="h-4 w-4" />}
            />
            <Input
              label="Expiration (optional)"
              type="date"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
              leftIcon={<Clock className="h-4 w-4" />}
              hint="Leave empty for no expiration"
            />
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleGenerate}
            isLoading={isGenerating}
          >
            Generate New Invite
          </Button>
        </div>

        {existingInvites.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">
              Existing Invites ({existingInvites.length})
            </h4>
            <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
              {existingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {invite.code}
                      </span>
                      <CopyButton text={invite.code} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {invite.useCount}/{invite.maxUses} uses
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(invite)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {existingInvites.length === 0 && !inviteCode && (
          <p className="text-center text-sm text-gray-500 py-4">
            No invites yet. Generate one above to get started.
          </p>
        )}
      </div>
    </Modal>
  );
}
