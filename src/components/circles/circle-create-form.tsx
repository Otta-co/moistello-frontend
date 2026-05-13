"use client";

import { useState, useCallback } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Shield,
  Target,
  Shuffle,
  ArrowUpDown,
  Gavel,
  Vote,
} from "lucide-react";
import { createCircleSchema, type CreateCircleInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { CircleType, PayoutType, Frequency, Currency } from "@/types";

const STEPS = [
  { step: 1, label: "Basic Info" },
  { step: 2, label: "Financials" },
  { step: 3, label: "Payout" },
];

const CIRCLE_TYPES: { value: CircleType; label: string; description: string }[] = [
  { value: "public", label: "Public", description: "Anyone can discover and join" },
  { value: "private", label: "Private", description: "Invite-only access" },
  { value: "org", label: "Organization", description: "For organizations and teams" },
  { value: "community", label: "Community", description: "Community-governed circle" },
  { value: "premium", label: "Premium", description: "High-trust, high-value circles" },
];

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
];

const PAYOUT_TYPES: { value: PayoutType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "random",
    label: "Random",
    description: "Recipient is randomly selected each round",
    icon: <Shuffle className="h-5 w-5" />,
  },
  {
    value: "fixed",
    label: "Fixed Order",
    description: "Predetermined payout order set at creation",
    icon: <ArrowUpDown className="h-5 w-5" />,
  },
  {
    value: "auction",
    label: "Auction",
    description: "Members bid a discount for early payout",
    icon: <Gavel className="h-5 w-5" />,
  },
  {
    value: "vote",
    label: "Vote",
    description: "Members vote on who receives payout each round",
    icon: <Vote className="h-5 w-5" />,
  },
];

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "USDC", label: "USDC" },
  { value: "XLM", label: "XLM" },
];

interface FormErrors {
  [key: string]: string;
}

interface CircleCreateFormProps {
  onSubmit: (data: CreateCircleInput) => void;
  isPending?: boolean;
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((s, index) => {
          const isCompleted = s.step < currentStep;
          const isCurrent = s.step === currentStep;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={s.step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isCompleted && !isCurrent && "bg-gray-200 text-gray-500",
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : s.step}
                </div>
                <span
                  className={cn(
                    "mt-1.5 text-xs font-medium",
                    isCurrent ? "text-primary" : "text-gray-500",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2",
                    s.step < currentStep ? "bg-primary" : "bg-gray-200",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CircleCreateForm({ onSubmit, isPending }: CircleCreateFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({});

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [circleType, setCircleType] = useState<CircleType>("public");
  const [maxMembers, setMaxMembers] = useState(10);
  const [startDate, setStartDate] = useState("");

  const [contributionAmount, setContributionAmount] = useState(100);
  const [currency, setCurrency] = useState<Currency>("USDC");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [lateFeePercent, setLateFeePercent] = useState(5);
  const [gracePeriodHours, setGracePeriodHours] = useState(24);
  const [maxStrikes, setMaxStrikes] = useState(3);

  const [payoutType, setPayoutType] = useState<PayoutType>("random");
  const [collateralPercent, setCollateralPercent] = useState<number | undefined>(10);
  const [minMoiScore, setMinMoiScore] = useState<number | undefined>(0);

  const buildFormData = useCallback((): CreateCircleInput => {
    const startDateISO = startDate ? new Date(startDate).toISOString() : new Date().toISOString();

    return {
      name,
      description: description || undefined,
      circleType,
      payoutType,
      contributionAmount,
      currency,
      frequency,
      maxMembers,
      minMoiScore,
      collateralPercent,
      lateFeePercent,
      gracePeriodHours,
      maxStrikes,
      startDate: startDateISO,
    };
  }, [
    name,
    description,
    circleType,
    payoutType,
    contributionAmount,
    currency,
    frequency,
    maxMembers,
    minMoiScore,
    collateralPercent,
    lateFeePercent,
    gracePeriodHours,
    maxStrikes,
    startDate,
  ]);

  const validateStep = useCallback(
    (step: number): boolean => {
      setErrors({});

      if (step === 1) {
        if (name.length < 3) {
          setErrors({ name: "Name must be at least 3 characters" });
          return false;
        }
        if (name.length > 100) {
          setErrors({ name: "Name must be at most 100 characters" });
          return false;
        }
        if (maxMembers < 2) {
          setErrors({ maxMembers: "Must have at least 2 members" });
          return false;
        }
        if (maxMembers > 100) {
          setErrors({ maxMembers: "Must have at most 100 members" });
          return false;
        }
        return true;
      }

      if (step === 2) {
        if (contributionAmount <= 0) {
          setErrors({ contributionAmount: "Contribution must be positive" });
          return false;
        }
        if (lateFeePercent < 0 || lateFeePercent > 50) {
          setErrors({ lateFeePercent: "Late fee must be between 0% and 50%" });
          return false;
        }
        if (gracePeriodHours < 1 || gracePeriodHours > 168) {
          setErrors({ gracePeriodHours: "Grace period must be between 1 and 168 hours" });
          return false;
        }
        if (maxStrikes < 1 || maxStrikes > 10) {
          setErrors({ maxStrikes: "Max strikes must be between 1 and 10" });
          return false;
        }
        return true;
      }

      if (step === 3) {
        if (collateralPercent != null && (collateralPercent < 0 || collateralPercent > 100)) {
          setErrors({ collateralPercent: "Collateral must be between 0% and 100%" });
          return false;
        }
        if (minMoiScore != null && (minMoiScore < 0 || minMoiScore > 1000)) {
          setErrors({ minMoiScore: "MoiScore must be between 0 and 1000" });
          return false;
        }

        const data = buildFormData();
        try {
          createCircleSchema.parse(data);
          return true;
        } catch (err: unknown) {
          if (err && typeof err === "object" && "errors" in err) {
            const zodErrors = (err as { errors: { path: (string | number)[]; message: string }[] }).errors;
            const fieldErrors: FormErrors = {};
            for (const e of zodErrors) {
              const key = e.path.join(".");
              fieldErrors[key] = e.message;
            }
            setErrors(fieldErrors);
          }
          return false;
        }
      }

      return true;
    },
    [name, maxMembers, contributionAmount, lateFeePercent, gracePeriodHours, maxStrikes, collateralPercent, minMoiScore, buildFormData],
  );

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((p) => Math.min(3, p + 1));
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((p) => Math.max(1, p - 1));
  };

  const handleSubmit = () => {
    if (!validateStep(3)) return;
    const data = buildFormData();
    onSubmit(data);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <StepIndicator currentStep={currentStep} />

      {currentStep === 1 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Basic Info</h3>
          <div className="space-y-4">
            <Input
              label="Circle Name"
              placeholder="e.g., Neighborhood Savings Circle"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            <Input
              label="Description (optional)"
              placeholder="Briefly describe the purpose of this circle"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors.description}
            />
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Circle Type</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CIRCLE_TYPES.map((ct) => (
                <Card
                  key={ct.value}
                  className={cn(
                    "cursor-pointer border-2 transition-colors",
                    circleType === ct.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300",
                  )}
                  onClick={() => setCircleType(ct.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold text-gray-900">{ct.label}</span>
                    </div>
                    <p className="text-sm text-gray-500">{ct.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Max Members"
              type="number"
              min={2}
              max={100}
              value={String(maxMembers)}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              error={errors.maxMembers}
            />
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              leftIcon={<Calendar className="h-4 w-4" />}
              error={errors.startDate}
            />
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Financials</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Contribution Amount"
              type="number"
              min={1}
              value={String(contributionAmount)}
              onChange={(e) => setContributionAmount(Number(e.target.value))}
              leftIcon={<DollarSign className="h-4 w-4" />}
              error={errors.contributionAmount}
            />
            <Select
              label="Currency"
              options={CURRENCIES}
              value={currency}
              onChange={(v) => setCurrency(v as Currency)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Contribution Frequency
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {FREQUENCIES.map((f) => (
                <Card
                  key={f.value}
                  className={cn(
                    "cursor-pointer border-2 text-center transition-colors",
                    frequency === f.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300",
                  )}
                  onClick={() => setFrequency(f.value)}
                >
                  <CardContent className="p-3">
                    <Clock className="mx-auto mb-1 h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{f.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Penalty Settings</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-900">
                  Late Fee ({lateFeePercent}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={lateFeePercent}
                  onChange={(e) => setLateFeePercent(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <span className="text-xs text-gray-500">Cost per missed deadline</span>
                {errors.lateFeePercent && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.lateFeePercent}
                  </p>
                )}
              </div>
              <Input
                label="Grace Period (hrs)"
                type="number"
                min={1}
                max={168}
                value={String(gracePeriodHours)}
                onChange={(e) => setGracePeriodHours(Number(e.target.value))}
                error={errors.gracePeriodHours}
              />
              <Input
                label="Max Strikes"
                type="number"
                min={1}
                max={10}
                value={String(maxStrikes)}
                onChange={(e) => setMaxStrikes(Number(e.target.value))}
                error={errors.maxStrikes}
                hint="Strikes before removal"
              />
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Payout</h3>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">Payout Type</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PAYOUT_TYPES.map((pt) => (
                <Card
                  key={pt.value}
                  className={cn(
                    "cursor-pointer border-2 transition-colors",
                    payoutType === pt.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300",
                  )}
                  onClick={() => setPayoutType(pt.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full",
                          payoutType === pt.value
                            ? "bg-primary/10 text-primary"
                            : "bg-gray-100 text-gray-500",
                        )}
                      >
                        {pt.icon}
                      </div>
                      <div>
                        <span className="block font-semibold text-gray-900">{pt.label}</span>
                        <span className="text-sm text-gray-500">{pt.description}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Collateral % (optional)"
              type="number"
              min={0}
              max={100}
              value={collateralPercent != null ? String(collateralPercent) : ""}
              onChange={(e) =>
                setCollateralPercent(
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              leftIcon={<Shield className="h-4 w-4" />}
              hint="Percentage of contribution required as collateral"
              error={errors.collateralPercent}
            />
            <Input
              label="Min MoiScore (optional)"
              type="number"
              min={0}
              max={1000}
              value={minMoiScore != null ? String(minMoiScore) : ""}
              onChange={(e) =>
                setMinMoiScore(
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              leftIcon={<Target className="h-4 w-4" />}
              hint="Minimum trust score to join"
              error={errors.minMoiScore}
            />
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
        {currentStep > 1 ? (
          <Button
            variant="outline"
            size="md"
            onClick={handleBack}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Previous
          </Button>
        ) : (
          <div />
        )}

        {currentStep < 3 ? (
          <Button
            variant="primary"
            size="md"
            onClick={handleNext}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            isLoading={isPending}
            leftIcon={<Check className="h-4 w-4" />}
          >
            Create Circle
          </Button>
        )}
      </div>
    </div>
  );
}
