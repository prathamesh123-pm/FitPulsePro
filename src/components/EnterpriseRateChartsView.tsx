import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  DollarSign,
  Plus,
  FileText,
  Download,
  Share2,
  Printer,
  CheckCircle2,
  Edit,
  Trash2,
  Sparkles,
  Shield,
  Layers,
  Search,
  Filter,
  Tag,
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";
import { AppState, EnterpriseRateChart, RateChartItem } from "../types";
import { exportRateChartDocx, exportRateChartPDF } from "../utils/exportUtils";
import { createAuditEntry } from "../utils/auditLogger";

interface EnterpriseRateChartsViewProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export const EnterpriseRateChartsView: React.FC<EnterpriseRateChartsViewProps> = ({
  state,
  onUpdateState,
  onNotify,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  
  const currentChart = state.rateCharts?.[0] || {
    id: "rc-2026-v1",
    title: "FitPulse Pro Standard Gym & Training Tariff 2026",
    version: "v3.2",
    effectiveDate: "2026-08-01",
    currency: "$",
    status: "Published",
    createdBy: "Alex Miller (Admin)",
    updatedAt: "2026-08-25T14:30:00.000Z",
    items: [],
  };

  // Form state for new rate chart item
  const [serviceCode, setServiceCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<RateChartItem["category"]>("Gym Membership");
  const [duration, setDuration] = useState("1 Month");
  const [basePrice, setBasePrice] = useState(100);
  const [discountPct, setDiscountPct] = useState(0);
  const [taxPct, setTaxPct] = useState(0);
  const [featureInput, setFeatureInput] = useState("");

  const categories = [
    "All",
    "Gym Membership",
    "Personal Training",
    "Diet & Nutrition Consultation",
    "Body Composition Scan",
    "Supplement Pack",
    "Recovery & Spa",
  ];

  const filteredItems = (currentChart.items || []).filter((item) => {
    const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serviceCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleExportWord = async () => {
    await exportRateChartDocx(currentChart);
    onNotify("Export Complete", `Rate Chart exported to Word (.docx) format.`, "success");
    
    // Audit log
    if (state.currentUserAccount) {
      const entry = await createAuditEntry(
        state.currentUserAccount.uid,
        state.currentUserAccount.displayName,
        state.currentUserAccount.role,
        "Exported",
        "Rate Charts",
        `Exported Rate Chart "${currentChart.title}" to Word document (.docx)`
      );
      onUpdateState((prev) => ({ ...prev, auditLogs: [entry, ...(prev.auditLogs || [])] }));
    }
  };

  const handleExportPDF = () => {
    exportRateChartPDF(currentChart);
    onNotify("Export Complete", `Rate Chart exported to PDF format.`, "success");
  };

  const handlePrint = () => {
    window.print();
    onNotify("Print Job Sent", "Sending official Rate Chart to printer.", "info");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentChart.title,
          text: `FitPulse Pro Tariff Schedule ${currentChart.version}`,
          url: window.location.href,
        });
        onNotify("Shared Successfully", "Rate chart shared via system dialog.", "success");
      } catch (e) {
        // Ignored
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      onNotify("Link Copied", "Tariff schedule link copied to clipboard.", "info");
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !serviceCode) {
      onNotify("Validation Error", "Please fill in service code and name.", "warning");
      return;
    }

    const finalPrice = Number((basePrice * (1 - discountPct / 100) * (1 + taxPct / 100)).toFixed(2));
    const newItem: RateChartItem = {
      id: `item-${Date.now()}`,
      serviceCode: serviceCode.toUpperCase(),
      name,
      category,
      duration,
      basePrice: Number(basePrice),
      discountPct: Number(discountPct),
      taxPct: Number(taxPct),
      finalPrice,
      currency: currentChart.currency || "$",
      features: featureInput.split(",").map((s) => s.trim()).filter(Boolean),
      isActive: true,
      updatedAt: new Date().toISOString(),
    };

    const updatedChart: EnterpriseRateChart = {
      ...currentChart,
      updatedAt: new Date().toISOString(),
      items: [newItem, ...currentChart.items],
    };

    onUpdateState((prev) => ({
      ...prev,
      rateCharts: [updatedChart, ...(prev.rateCharts?.slice(1) || [])],
    }));

    onNotify("Item Added", `New service "${name}" added to official tariff schedule.`, "success");
    setIsAddingItem(false);
    setName("");
    setServiceCode("");
    setFeatureInput("");
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = currentChart.items.filter((i) => i.id !== itemId);
    const updatedChart: EnterpriseRateChart = {
      ...currentChart,
      updatedAt: new Date().toISOString(),
      items: updatedItems,
    };
    onUpdateState((prev) => ({
      ...prev,
      rateCharts: [updatedChart, ...(prev.rateCharts?.slice(1) || [])],
    }));
    onNotify("Item Removed", "Tariff item removed from rate chart.", "info");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Official Tariff {currentChart.version}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Status: {currentChart.status}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              {currentChart.title}
            </h1>
            <p className="text-xs text-slate-400">
              Effective Date: {currentChart.effectiveDate} • Managed by: {currentChart.createdBy} • Auto Cloud Synced
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddingItem(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-slate-950 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Service Item
            </button>
            <button
              onClick={handleExportWord}
              className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              Export Word (.docx)
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4 text-rose-400" />
              Export PDF
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Print Rate Chart"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Share Rate Chart"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                  : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service or code..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Add Item Modal / Inline Form */}
      <AnimatePresence>
        {isAddingItem && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Add New Enterprise Service Tariff Entry
              </h3>
              <button
                onClick={() => setIsAddingItem(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300">Service Code</label>
                <input
                  type="text"
                  required
                  value={serviceCode}
                  onChange={(e) => setServiceCode(e.target.value)}
                  placeholder="e.g. PT-PRO-20"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300">Plan / Service Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Master Strength Conditioning"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  {categories.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300">Duration</label>
                <input
                  type="text"
                  required
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 6 Months / 20 Sessions"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300">Base Price ($)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300">Discount (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discountPct}
                  onChange={(e) => setDiscountPct(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-semibold text-slate-300">Features / Inclusions (Comma separated)</label>
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="24/7 Access, InBody Scan, Sauna Pass, Nutrition Guide"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-slate-950 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save to Tariff Schedule
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tariff Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-4 transition-all hover:shadow-xl group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {item.serviceCode}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">{item.duration}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {item.name}
                </h3>
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Tag className="w-3 h-3 text-slate-500" />
                  {item.category}
                </span>
              </div>

              {/* Features List */}
              {item.features && item.features.length > 0 && (
                <div className="pt-2 space-y-1">
                  {item.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price and Actions */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xl font-black text-white">{item.currency}{item.finalPrice}</span>
                {item.discountPct > 0 && (
                  <span className="ml-2 text-xs line-through text-slate-500 font-medium">
                    {item.currency}{item.basePrice}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleDeleteItem(item.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
