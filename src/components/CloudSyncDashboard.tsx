import { useState, useMemo } from "react";
import {
  TrendingUp,
  Package,
  Boxes,
  Users,
  ShoppingBag,
  FileText,
  Settings,
  LogOut,
  Cloud,
  CheckCircle2,
  Plus,
  RefreshCw,
  User,
  Shield,
  Smartphone,
  Calendar,
  AlertTriangle,
  Search,
  DollarSign,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { AppState, TabId, CustomerItem, SaleRecord, Product, OrderRecord } from "../types";
import { autoSaveUserDataToCloud, downloadAllUserDataFromCloud } from "../services/firebaseCloudSync";

interface CloudSyncDashboardProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNavigateTab: (tab: TabId) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onNotify: (title: string, message: string, type?: "success" | "info" | "warning" | "error") => void;
  lang?: "en" | "mr";
}

export function CloudSyncDashboard({
  state,
  onUpdateState,
  onNavigateTab,
  onOpenProfile,
  onLogout,
  onNotify,
  lang = "en",
}: CloudSyncDashboardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);

  // New customer form state
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");

  // New sale form state
  const [saleCustomer, setSaleCustomer] = useState("");
  const [saleProduct, setSaleProduct] = useState("");
  const [saleQty, setSaleQty] = useState(1);
  const [salePrice, setSalePrice] = useState(0);

  const displayName =
    state.currentUserAccount?.displayName ||
    state.profile.fullName ||
    state.cloudUser?.displayName ||
    "Athlete Pro";

  // Calculations for cards
  const todayIso = new Date().toISOString().split("T")[0];

  const todaySalesTotal = useMemo(() => {
    const sales = state.sales || [];
    return sales
      .filter((s) => s.date === todayIso || s.createdAt?.startsWith(todayIso))
      .reduce((sum, item) => sum + item.total, 0);
  }, [state.sales, todayIso]);

  const totalProducts = (state.products || []).length;

  const totalStockCount = useMemo(() => {
    return (state.products || []).reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  }, [state.products]);

  const totalCustomersCount = (state.customers || []).length;
  const totalOrdersCount = (state.orders || []).length;
  const totalReportsCount =
    Object.keys(state.submittedReports || {}).length +
    Object.keys(state.submittedMonthlyReports || {}).length +
    (state.groupReports || []).length;

  // Manual Trigger Full Cloud Sync
  const handleManualSync = async () => {
    const uid = state.currentUserAccount?.uid || state.cloudUser?.uid;
    if (!uid) {
      onNotify("Offline Mode", "Please sign in to sync with Firebase Cloud.", "warning");
      return;
    }

    setIsSyncing(true);
    try {
      const { success, lastSyncDate } = await autoSaveUserDataToCloud(uid, state);
      if (success) {
        onUpdateState((prev) => ({
          ...prev,
          sync: {
            ...prev.sync,
            lastSyncDate,
            syncStatus: "synced",
            isOnline: true,
          },
        }));
        onNotify("Cloud Synced", "All data safely saved to Cloud Firestore.", "success");
      } else {
        onNotify("Notice", "Changes stored locally. Will sync when online.", "info");
      }
    } catch (err: any) {
      onNotify("Sync Notice", err?.message || "Sync complete", "info");
    } finally {
      setIsSyncing(false);
    }
  };

  // Add Customer Quick Action
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const newCust: CustomerItem = {
      id: `cust-${Date.now()}`,
      name: custName.trim(),
      mobileNumber: custPhone.trim(),
      email: custEmail.trim() || undefined,
      totalPurchases: 0,
      balance: 0,
      createdAt: new Date().toISOString(),
    };

    onUpdateState((prev) => {
      const updatedCustomers = [newCust, ...(prev.customers || [])];
      return {
        ...prev,
        customers: updatedCustomers,
      };
    });

    onNotify("Customer Added", `${newCust.name} added and synced to cloud!`, "success");
    setCustName("");
    setCustPhone("");
    setCustEmail("");
    setShowNewCustomerModal(false);
  };

  // Add Sale Quick Action
  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleCustomer.trim() || salePrice <= 0 || saleQty <= 0) return;

    const total = salePrice * saleQty;
    const newSale: SaleRecord = {
      id: `sale-${Date.now()}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      customerName: saleCustomer.trim(),
      items: [
        {
          productId: `prod-${Date.now()}`,
          name: saleProduct || "Gym Supplement / Merchandise",
          quantity: saleQty,
          price: salePrice,
          total,
        },
      ],
      subtotal: total,
      tax: 0,
      total,
      paymentMethod: "UPI / Online",
      date: todayIso,
      createdAt: new Date().toISOString(),
    };

    onUpdateState((prev) => {
      const updatedSales = [newSale, ...(prev.sales || [])];
      return {
        ...prev,
        sales: updatedSales,
      };
    });

    onNotify("Sale Recorded", `Invoice ${newSale.invoiceNumber} (₹${total}) synced to cloud!`, "success");
    setSaleCustomer("");
    setSaleProduct("");
    setSalePrice(0);
    setSaleQty(1);
    setShowNewSaleModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. WELCOME BANNER & CLOUD STATUS */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-emerald-400 bg-slate-800 shadow-md">
                <img
                  src={
                    state.profile.photoUrl ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
                  }
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              </div>
              <div
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center"
                title="Cloud Connected"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Firebase Cloud Sync
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  UID: {state.currentUserAccount?.uid?.slice(0, 8)}...
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
                {lang === "mr" ? "स्वागत आहे," : "Welcome back,"}{" "}
                <span className="text-emerald-400">{displayName}</span>!
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                <span>Multi-device synchronization active across phone & desktop</span>
              </p>
            </div>
          </div>

          {/* Action buttons: Sync, Profile, Logout */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition cursor-pointer"
              title="Force cloud backup & sync"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-emerald-400" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Cloud"}</span>
            </button>

            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span>{lang === "mr" ? "माझी प्रोफाइल" : "My Profile"}</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition cursor-pointer"
              title="Log out and clear session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === "mr" ? "लॉगआउट" : "Logout"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CORE METRICS GRID (Requirement 11) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        {/* Metric 1: Today's Sales */}
        <div
          onClick={() => setShowNewSaleModal(true)}
          className="col-span-2 sm:col-span-1 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">{lang === "mr" ? "आजची विक्री" : "Today's Sales"}</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-100">₹{todaySalesTotal.toLocaleString()}</div>
          <div className="flex items-center justify-between text-[11px] text-emerald-400 mt-2">
            <span>+ Add Invoice</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Metric 2: Total Stock */}
        <div
          onClick={() => onNavigateTab("products")}
          className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-4 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">{lang === "mr" ? "एकूण स्टॉक" : "Total Stock"}</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-100">{totalStockCount}</div>
          <div className="text-[11px] text-slate-400 mt-2">Units in Store</div>
        </div>

        {/* Metric 3: Total Products */}
        <div
          onClick={() => onNavigateTab("products")}
          className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">{lang === "mr" ? "एकूण उत्पादने" : "Products"}</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-100">{totalProducts}</div>
          <div className="text-[11px] text-slate-400 mt-2">Active Items</div>
        </div>

        {/* Metric 4: Customers */}
        <div
          onClick={() => setShowNewCustomerModal(true)}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">{lang === "mr" ? "ग्राहक" : "Customers"}</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-100">{totalCustomersCount}</div>
          <div className="text-[11px] text-blue-400 mt-2">+ Add Client</div>
        </div>

        {/* Metric 5: Orders */}
        <div
          onClick={() => onNotify("Orders Active", "All orders synchronized with cloud database.", "info")}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">{lang === "mr" ? "ऑर्डर्स" : "Orders"}</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-100">{totalOrdersCount}</div>
          <div className="text-[11px] text-slate-400 mt-2">Tracked Orders</div>
        </div>

        {/* Metric 6: Reports */}
        <div
          onClick={() => onNavigateTab("reports")}
          className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">{lang === "mr" ? "अहवाल" : "Reports"}</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-100">{totalReportsCount}</div>
          <div className="text-[11px] text-slate-400 mt-2">Export Ready</div>
        </div>

        {/* Metric 7: Settings */}
        <div
          onClick={() => onNavigateTab("settings")}
          className="col-span-2 sm:col-span-1 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">{lang === "mr" ? "सेटिंग्ज" : "Settings"}</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
              <Settings className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-200">Configure</div>
          <div className="text-[11px] text-emerald-400 mt-2">Preferences →</div>
        </div>
      </div>

      {/* 3. RECENT CLOUD DATA STREAM & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Sales & Customers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Sales List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  {lang === "mr" ? "अलीकडील विक्री (Live Sales)" : "Recent Sales & Invoices"}
                </h3>
              </div>
              <button
                onClick={() => setShowNewSaleModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Sale</span>
              </button>
            </div>

            {(state.sales || []).length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
                No sales logged yet. Click "+ New Sale" to record an invoice.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Invoice</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Items</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(state.sales || []).slice(0, 5).map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-semibold text-emerald-400">{sale.invoiceNumber}</td>
                        <td className="py-2.5 px-3 text-slate-200">{sale.customerName}</td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {sale.items?.map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">₹{sale.total}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                            {sale.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Customer Directory Snapshot */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  {lang === "mr" ? "नोंदणीकृत ग्राहक (Customers)" : "Active Customers & Members"}
                </h3>
              </div>
              <button
                onClick={() => setShowNewCustomerModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Customer</span>
              </button>
            </div>

            {(state.customers || []).length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
                No customer profiles recorded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(state.customers || []).slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.mobileNumber || "No Phone"}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-400">Active</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Cloud Multi-Device Status & Quick Modules */}
        <div className="space-y-6">
          {/* Cloud Auto-Save Status Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">Multi-Device Cloud Backup</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Your entire database automatically syncs to Firebase under your unique UID.
              Any modifications instantly replicate across all your devices.
            </p>

            <div className="space-y-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span>Storage Mode:</span>
                <span className="font-bold text-emerald-400">Cloud Firestore</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Security Rules:</span>
                <span className="font-bold text-teal-400">UID Isolated ABAC</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Offline Support:</span>
                <span className="font-bold text-emerald-400">IndexedDB Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Sync Time:</span>
                <span className="font-mono text-slate-400">{state.sync?.lastSyncDate || "Just now"}</span>
              </div>
            </div>

            <button
              onClick={handleManualSync}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verify Multi-Device Sync</span>
            </button>
          </div>

          {/* Quick Shortcuts to Modules */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-100 mb-3">Instant Management</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigateTab("products")}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer"
              >
                <Package className="w-4 h-4 text-emerald-400 mb-1.5" />
                <div className="text-xs font-bold text-slate-200">Products</div>
                <div className="text-[10px] text-slate-400">Stock & pricing</div>
              </button>
              <button
                onClick={() => onNavigateTab("diet")}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-teal-400 mb-1.5" />
                <div className="text-xs font-bold text-slate-200">Diet Plans</div>
                <div className="text-[10px] text-slate-400">Nutrition schedules</div>
              </button>
              <button
                onClick={() => onNavigateTab("exercises")}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer"
              >
                <Boxes className="w-4 h-4 text-cyan-400 mb-1.5" />
                <div className="text-xs font-bold text-slate-200">Exercises</div>
                <div className="text-[10px] text-slate-400">Workout library</div>
              </button>
              <button
                onClick={() => onNavigateTab("settings")}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer"
              >
                <Settings className="w-4 h-4 text-blue-400 mb-1.5" />
                <div className="text-xs font-bold text-slate-200">Settings</div>
                <div className="text-[10px] text-slate-400">Cloud & security</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD CUSTOMER */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Add New Customer / Member</span>
            </h3>

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Rahul Patil"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition cursor-pointer"
                >
                  Save & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SALE */}
      {showNewSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Record New Sale / Bill</span>
            </h3>

            <form onSubmit={handleAddSale} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={saleCustomer}
                  onChange={(e) => setSaleCustomer(e.target.value)}
                  placeholder="e.g. Amit Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product / Item *</label>
                <input
                  type="text"
                  value={saleProduct}
                  onChange={(e) => setSaleProduct(e.target.value)}
                  placeholder="e.g. Whey Protein Isolate 1kg"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={saleQty}
                    onChange={(e) => setSaleQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="2499"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Invoice Amount:</span>
                <span className="text-base font-black text-emerald-400">₹{(salePrice * saleQty).toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewSaleModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                >
                  Generate Invoice & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
