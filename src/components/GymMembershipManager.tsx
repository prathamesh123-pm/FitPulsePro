import React, { useState, useMemo } from "react";
import {
  Building2,
  MapPin,
  Phone,
  UserCheck,
  Calendar,
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  RefreshCw,
  FileText,
  ShieldCheck,
  X,
  Plus,
  Bell,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { GymMembership, MembershipType } from "../types";

interface GymMembershipManagerProps {
  membership: GymMembership;
  onUpdateMembership: (updated: GymMembership) => void;
}

export function GymMembershipManager({
  membership,
  onUpdateMembership,
}: GymMembershipManagerProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isPayBalanceModalOpen, setIsPayBalanceModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Edit form state initialized with current membership
  const [formData, setFormData] = useState<GymMembership>(() => ({
    ...membership,
    gymAddress: membership.gymAddress || "742 Evergreen Fitness Blvd, Suite 400, Metro City",
    gymContactNumber: membership.gymContactNumber || "+1 (555) 348-4967",
    trainerName: membership.trainerName || "Coach Marcus Vance (CSCS)",
    membershipType: (membership.membershipType as MembershipType) || "Yearly",
    fees: membership.fees || 850,
    amountPaid: typeof membership.amountPaid === "number" ? membership.amountPaid : (membership.fees || 850),
    remainingAmount: typeof membership.remainingAmount === "number" ? membership.remainingAmount : 0,
    paymentDate: membership.paymentDate || membership.startDate || "2026-01-15",
    renewalDate: membership.renewalDate || "2026-09-10",
    notes: membership.notes || "Includes 24/7 all-access weight room, Olympic lifting platforms, and recovery sauna.",
    autoReminder: membership.autoReminder ?? true,
  }));

  // Renew duration selection
  const [renewType, setRenewType] = useState<MembershipType>(
    (membership.membershipType as MembershipType) || "Yearly"
  );
  const [renewCost, setRenewCost] = useState<number>(membership.fees || 850);

  // Days remaining calculation
  const { daysRemaining, isExpired, reminderTier } = useMemo(() => {
    if (!membership.expiryDate) {
      return { daysRemaining: 0, isExpired: false, reminderTier: null };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(membership.expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const expired = diffDays <= 0;

    let tier: "expired" | "1day" | "3days" | "7days" | "15days" | "30days" | null = null;
    if (diffDays <= 0) {
      tier = "expired";
    } else if (diffDays === 1) {
      tier = "1day";
    } else if (diffDays <= 3) {
      tier = "3days";
    } else if (diffDays <= 7) {
      tier = "7days";
    } else if (diffDays <= 15) {
      tier = "15days";
    } else if (diffDays <= 30) {
      tier = "30days";
    }

    return {
      daysRemaining: diffDays,
      isExpired: expired,
      reminderTier: tier,
    };
  }, [membership.expiryDate]);

  // Open edit modal with fresh membership data
  const handleOpenEdit = () => {
    const calculatedRemaining = Math.max(0, (membership.fees || 0) - (membership.amountPaid || 0));
    setFormData({
      ...membership,
      gymAddress: membership.gymAddress || "",
      gymContactNumber: membership.gymContactNumber || "",
      membershipType: (membership.membershipType as MembershipType) || "Yearly",
      fees: membership.fees || 0,
      amountPaid: typeof membership.amountPaid === "number" ? membership.amountPaid : membership.fees,
      remainingAmount: calculatedRemaining,
      notes: membership.notes || "",
    });
    setIsEditModalOpen(true);
  };

  // When fees or amount paid change in form, auto-update remainingAmount
  const handleFeeChange = (newFees: number, newPaid: number) => {
    const rem = Math.max(0, Number((newFees - newPaid).toFixed(2)));
    setFormData((prev) => ({
      ...prev,
      fees: newFees,
      amountPaid: newPaid,
      remainingAmount: rem,
    }));
  };

  // Helper to calculate new expiry date based on type
  const calculateNextExpiry = (fromDateStr: string, type: MembershipType): string => {
    const base = new Date(fromDateStr || new Date());
    if (type === "Monthly") {
      base.setMonth(base.getMonth() + 1);
    } else if (type === "Quarterly") {
      base.setMonth(base.getMonth() + 3);
    } else if (type === "Half-Yearly") {
      base.setMonth(base.getMonth() + 6);
    } else if (type === "Yearly") {
      base.setFullYear(base.getFullYear() + 1);
    }
    return base.toISOString().split("T")[0];
  };

  // Auto adjust expiry date when membership type changes in form
  const handleTypeChange = (newType: MembershipType) => {
    const updatedExpiry = calculateNextExpiry(formData.startDate, newType);
    setFormData((prev) => ({
      ...prev,
      membershipType: newType,
      expiryDate: updatedExpiry,
    }));
  };

  // Save edited membership details
  const handleSaveMembership = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRemaining = Math.max(0, Number((formData.fees - formData.amountPaid).toFixed(2)));
    const updated: GymMembership = {
      ...formData,
      fees: Number(formData.fees) || 0,
      amountPaid: Number(formData.amountPaid) || 0,
      remainingAmount: cleanRemaining,
      feesUSD: Number(formData.fees) || 0,
      paymentStatus: cleanRemaining === 0 ? "Paid" : cleanRemaining < formData.fees ? "Pending" : "Overdue",
    };
    onUpdateMembership(updated);
    setIsEditModalOpen(false);
    showNotice("Gym membership details updated successfully!");
  };

  // Execute renewal
  const handleConfirmRenew = () => {
    // If expired, renew from today. If still active, renew from current expiry date
    const baseDate = isExpired ? new Date().toISOString().split("T")[0] : membership.expiryDate;
    const newExpiry = calculateNextExpiry(baseDate, renewType);
    const todayStr = new Date().toISOString().split("T")[0];

    const updated: GymMembership = {
      ...membership,
      membershipType: renewType,
      startDate: isExpired ? todayStr : membership.startDate,
      expiryDate: newExpiry,
      renewalDate: newExpiry,
      fees: renewCost,
      amountPaid: renewCost,
      remainingAmount: 0,
      paymentDate: todayStr,
      paymentStatus: "Paid",
    };

    onUpdateMembership(updated);
    setIsRenewModalOpen(false);
    showNotice(`Membership successfully renewed until ${newExpiry}!`);
  };

  // Quick pay remaining balance
  const handlePayRemaining = () => {
    const updated: GymMembership = {
      ...membership,
      amountPaid: membership.fees,
      remainingAmount: 0,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentStatus: "Paid",
    };
    onUpdateMembership(updated);
    setIsPayBalanceModalOpen(false);
    showNotice("Remaining membership balance paid in full!");
  };

  const showNotice = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6" id="gym-membership-module">
      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-semibold animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* RENEWAL REMINDER BANNERS (30, 15, 7, 3, 1 Days & Expired) */}
      {reminderTier && (
        <div
          id="membership-renewal-reminder-banner"
          className={`p-5 rounded-3xl border shadow-lg transition-all ${
            reminderTier === "expired"
              ? "bg-rose-950/40 border-rose-600/50 text-rose-200 shadow-rose-950/30"
              : reminderTier === "1day" || reminderTier === "3days"
              ? "bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-amber-950/30"
              : "bg-sky-950/40 border-sky-500/40 text-sky-200 shadow-sky-950/20"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                  reminderTier === "expired"
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse"
                    : reminderTier === "1day" || reminderTier === "3days"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-sky-500/20 text-sky-300 border-sky-500/40"
                }`}
              >
                {reminderTier === "expired" ? (
                  <AlertTriangle className="h-6 w-6" />
                ) : (
                  <Bell className="h-6 w-6" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm uppercase tracking-wide">
                    {reminderTier === "expired" && "Membership Expired"}
                    {reminderTier === "1day" && "Final Notice: 1 Day Left!"}
                    {reminderTier === "3days" && "3 Days Remaining"}
                    {reminderTier === "7days" && "7 Days Renewal Reminder"}
                    {reminderTier === "15days" && "15 Days Renewal Notice"}
                    {reminderTier === "30days" && "30 Days Renewal Notice"}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-900/60 border border-slate-700">
                    Expiry: {membership.expiryDate}
                  </span>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  {reminderTier === "expired" &&
                    `Your gym membership expired on ${membership.expiryDate}. Facility access may be restricted. Renew now to continue your training streak without interruption.`}
                  {reminderTier === "1day" &&
                    `Your gym membership expires tomorrow (${membership.expiryDate}). Please renew today to maintain continuous gym and locker access.`}
                  {reminderTier === "3days" &&
                    `You have ${daysRemaining} days left on your membership plan at ${membership.gymName}. Take care of your renewal to prevent any training downtime.`}
                  {reminderTier === "7days" &&
                    `Your membership at ${membership.gymName} is up for renewal next week (${daysRemaining} days left).`}
                  {reminderTier === "15days" &&
                    `Friendly reminder: your membership expires in 15 days on ${membership.expiryDate}.`}
                  {reminderTier === "30days" &&
                    `Upcoming membership renewal reminder: your active plan expires in 30 days on ${membership.expiryDate}.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setIsRenewModalOpen(true)}
                className={`px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-md ${
                  reminderTier === "expired"
                    ? "bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-600/30"
                    : "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20"
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Renew Membership</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN MEMBERSHIP CARD */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6">
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-black text-slate-100">{membership.gymName}</h2>
                {/* AUTOMATIC STATUS DISPLAY */}
                <span
                  id="membership-status-badge"
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                    isExpired
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isExpired ? "bg-rose-400 animate-ping" : "bg-emerald-400 animate-pulse"
                    }`}
                  />
                  {isExpired ? "Membership Expired" : "Membership Active"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {membership.membershipType || "Yearly"} Plan
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400 mt-1.5">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <span>{membership.gymAddress || "742 Evergreen Fitness Blvd"}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span>{membership.gymContactNumber || "+1 (555) 348-4967"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons & Remaining Days Box */}
          <div className="flex flex-wrap items-center gap-3">
            {/* AUTOMATIC DISPLAY: REMAINING DAYS */}
            <div
              id="membership-remaining-days-box"
              className={`px-4 py-2.5 rounded-2xl border text-right min-w-[120px] ${
                isExpired
                  ? "bg-rose-950/30 border-rose-800/40 text-rose-300"
                  : daysRemaining <= 7
                  ? "bg-amber-950/30 border-amber-800/40 text-amber-300"
                  : "bg-slate-950 border-slate-800 text-emerald-400"
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                {isExpired ? "Expired Since" : "Remaining Days"}
              </span>
              <span className="text-xl font-black">
                {isExpired
                  ? `${Math.abs(daysRemaining)} Days Ago`
                  : `${daysRemaining} Days`}
              </span>
            </div>

            <button
              onClick={handleOpenEdit}
              id="edit-membership-button"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer flex items-center gap-2 border border-slate-700"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={() => setIsRenewModalOpen(true)}
              id="renew-membership-button"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Renew</span>
            </button>
          </div>
        </div>

        {/* 13 PARAMETERS INFORMATION GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* 1. Trainer Name */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>Personal Trainer</span>
              <UserCheck className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <span className="text-base font-extrabold text-sky-400 block">
              {membership.trainerName || "No Trainer Assigned"}
            </span>
            <span className="text-[11px] text-slate-400 block">
              Contact: {membership.trainerContact || "+1 (555) 782-9012"}
            </span>
          </div>

          {/* 2. Membership Dates */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>Validity Dates</span>
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1.5 text-sm font-extrabold text-slate-100">
              <span>{membership.startDate}</span>
              <ArrowRight className="h-3 w-3 text-slate-500" />
              <span className={isExpired ? "text-rose-400" : "text-emerald-400"}>
                {membership.expiryDate}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">
              Renewal Date: {membership.renewalDate || membership.expiryDate}
            </span>
          </div>

          {/* 3. Membership Fees & Paid */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>Fees & Payment</span>
              <CreditCard className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold text-slate-100">
                ${membership.fees || 0} USD
              </span>
              <span className="text-[11px] font-bold text-emerald-400">
                Paid: ${membership.amountPaid ?? membership.fees ?? 0}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">
              Payment Date: {membership.paymentDate || membership.startDate || "N/A"}
            </span>
          </div>

          {/* 4. Remaining Amount */}
          <div
            className={`p-4 rounded-2xl border space-y-1 ${
              (membership.remainingAmount || 0) > 0
                ? "bg-amber-950/30 border-amber-800/50"
                : "bg-slate-950/60 border-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
              <span>Remaining Amount</span>
              <DollarSign
                className={`h-3.5 w-3.5 ${
                  (membership.remainingAmount || 0) > 0 ? "text-amber-400" : "text-emerald-400"
                }`}
              />
            </div>
            <div className="flex items-center justify-between">
              <span
                className={`text-base font-black ${
                  (membership.remainingAmount || 0) > 0 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                ${membership.remainingAmount || 0} USD
              </span>
              {(membership.remainingAmount || 0) > 0 && (
                <button
                  onClick={() => setIsPayBalanceModalOpen(true)}
                  className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] transition cursor-pointer"
                >
                  Pay Now
                </button>
              )}
            </div>
            <span className="text-[11px] text-slate-400 block font-medium">
              {(membership.remainingAmount || 0) > 0
                ? "Pending balance on account"
                : "Zero balance — Fully Paid"}
            </span>
          </div>
        </div>

        {/* Notes & Facility Amenities */}
        <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span>Membership Notes & Terms</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Auto-Reminders Enabled</span>
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {membership.notes ||
              "Standard all-access membership terms with 24/7 RFID keycard access, locker service, sauna, and complimentary quarterly fitness consultation."}
          </p>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* EDIT MEMBERSHIP MODAL (SAVE ALL 13 FIELDS) */}
      {/* ===================================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100 animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-black text-slate-100">
                  Edit Gym Membership Details
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMembership} className="space-y-4 text-xs">
              {/* Row 1: Gym Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">Gym Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.gymName}
                    onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
                    placeholder="e.g. Metropolis Barbell Club"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Membership Type *</label>
                  <select
                    value={formData.membershipType}
                    onChange={(e) => handleTypeChange(e.target.value as MembershipType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly (3 Months)</option>
                    <option value="Half-Yearly">Half-Yearly (6 Months)</option>
                    <option value="Yearly">Yearly (12 Months)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Address & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Gym Address</label>
                  <input
                    type="text"
                    value={formData.gymAddress}
                    onChange={(e) => setFormData({ ...formData, gymAddress: e.target.value })}
                    placeholder="e.g. 742 Evergreen Fitness Blvd"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Gym Contact Number</label>
                  <input
                    type="text"
                    value={formData.gymContactNumber}
                    onChange={(e) => setFormData({ ...formData, gymContactNumber: e.target.value })}
                    placeholder="e.g. +1 (555) 348-4967"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Trainer Name & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Trainer Name</label>
                  <input
                    type="text"
                    value={formData.trainerName}
                    onChange={(e) => setFormData({ ...formData, trainerName: e.target.value })}
                    placeholder="e.g. Coach Marcus Vance (CSCS)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Trainer Contact</label>
                  <input
                    type="text"
                    value={formData.trainerContact || ""}
                    onChange={(e) => setFormData({ ...formData, trainerContact: e.target.value })}
                    placeholder="e.g. +1 (555) 782-9012"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Renewal Date</label>
                  <input
                    type="date"
                    value={formData.renewalDate}
                    onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Financials & Auto Calculations */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <span className="text-[11px] uppercase font-bold text-slate-400 block">
                  Financials & Auto-Remaining Balance
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Membership Fees ($) *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={formData.fees}
                      onChange={(e) => handleFeeChange(Number(e.target.value), formData.amountPaid)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Amount Paid ($) *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={formData.amountPaid}
                      onChange={(e) => handleFeeChange(formData.fees, Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Remaining Amount ($)</label>
                    <input
                      type="number"
                      readOnly
                      value={formData.remainingAmount}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-bold cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 6: Notes */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Notes & Inclusions</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Towel service included, sauna access, keycard deposit paid"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black cursor-pointer shadow-lg shadow-emerald-500/20 transition"
                >
                  Save Membership Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* RENEW MEMBERSHIP MODAL */}
      {/* ===================================================================== */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-black text-slate-100">
                  Renew Gym Membership
                </h3>
              </div>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Extend your active membership for <strong className="text-white">{membership.gymName}</strong>.
              </p>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Select Renewal Period</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Monthly", "Quarterly", "Half-Yearly", "Yearly"] as MembershipType[]).map((type) => {
                    const priceMap: Record<MembershipType, number> = {
                      Monthly: 90,
                      Quarterly: 240,
                      "Half-Yearly": 450,
                      Yearly: 850,
                    };
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setRenewType(type);
                          setRenewCost(priceMap[type]);
                        }}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          renewType === type
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                            : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <span className="font-extrabold block text-sm">{type}</span>
                        <span className="text-[11px] opacity-80">${priceMap[type]} USD</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Renewal Amount ($)</label>
                <input
                  type="number"
                  value={renewCost}
                  onChange={(e) => setRenewCost(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-bold"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Current Expiry:</span>
                  <span className="font-bold text-slate-200">{membership.expiryDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>New Expiry:</span>
                  <span className="font-bold text-emerald-400">
                    {calculateNextExpiry(
                      isExpired ? new Date().toISOString().split("T")[0] : membership.expiryDate,
                      renewType
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRenew}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
                >
                  Confirm & Process Renewal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PAY REMAINING BALANCE MODAL */}
      {/* ===================================================================== */}
      {isPayBalanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-slate-100">Pay Outstanding Balance</h3>
              <button onClick={() => setIsPayBalanceModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Clear the remaining balance of{" "}
                <strong className="text-amber-400 font-bold">${membership.remainingAmount || 0} USD</strong>{" "}
                for your membership at <strong className="text-white">{membership.gymName}</strong>.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsPayBalanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayRemaining}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md"
                >
                  Mark as Paid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
