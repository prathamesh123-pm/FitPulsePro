import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Barcode,
  DollarSign,
  Boxes,
  AlertCircle,
  CheckCircle2,
  Upload,
  RefreshCw,
  Eye,
  X,
  Sparkles,
  ShoppingBag,
  Layers,
  ArrowUpDown,
  Tag,
} from "lucide-react";
import { Product, AppState } from "../types";
import {
  saveProductToCloud,
  fetchProductsFromCloud,
  deleteProductFromCloud,
} from "../services/firebase";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { readFileAndCompress } from "../utils/imageOptimizer";

interface ProductManagementViewProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

const PRODUCT_CATEGORIES = [
  "Supplements",
  "Equipment",
  "Gym Gear",
  "Apparel",
  "Nutrition",
  "Accessories",
];

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "prod-whey-isolate",
    name: "Pure Whey Isolate 100% (Vanilla Cream)",
    category: "Supplements",
    price: 3499,
    description: "Ultra-filtered whey protein isolate, 27g protein per scoop, zero added sugar.",
    stock: 45,
    barcode: "8901234567890",
    imageUrl: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80",
    status: "In Stock",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-creatine-creapure",
    name: "Micronized Creatine Monohydrate (Creapure)",
    category: "Supplements",
    price: 1199,
    description: "100% pure pharmaceutical grade creatine for ATP explosive power and strength.",
    stock: 8,
    barcode: "8901234567891",
    imageUrl: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&auto=format&fit=crop&q=80",
    status: "Low Stock",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-leather-belt",
    name: "Olympic Powerlifting Lever Belt 10mm",
    category: "Gym Gear",
    price: 2499,
    description: "Heavy duty genuine steerhide leather with steel chrome lever buckle.",
    stock: 22,
    barcode: "8901234567892",
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
    status: "In Stock",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-lifting-straps",
    name: "Padded Cotton Weightlifting Wrist Straps",
    category: "Accessories",
    price: 499,
    description: "Neoprene padded industrial stitching for heavy deadlifts and shrugs.",
    stock: 60,
    barcode: "8901234567893",
    imageUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80",
    status: "In Stock",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const ProductManagementView: React.FC<ProductManagementViewProps> = ({
  state,
  onUpdateState,
  onNotify,
}) => {
  const [products, setProducts] = useState<Product[]>(state.products || SAMPLE_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [stockFilter, setStockFilter] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  // Delete confirmation
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    category: "Supplements",
    price: 0,
    stock: 0,
    barcode: "",
    description: "",
    imageUrl: "",
  });

  // Fetch products from Firebase on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const cloudProducts = await fetchProductsFromCloud();
      if (cloudProducts && cloudProducts.length > 0) {
        setProducts(cloudProducts);
        onUpdateState((prev) => ({ ...prev, products: cloudProducts }));
      } else if (!state.products || state.products.length === 0) {
        setProducts(SAMPLE_PRODUCTS);
        onUpdateState((prev) => ({ ...prev, products: SAMPLE_PRODUCTS }));
      }
    } catch (err) {
      console.warn("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: "Supplements",
      price: 999,
      stock: 20,
      barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      description: "",
      imageUrl: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80",
    });
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setIsFormOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await readFileAndCompress(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 });
      setFormData((prev) => ({ ...prev, imageUrl: base64 }));
      onNotify("Image Uploaded", "Product image prepared successfully", "info");
    } catch (err) {
      onNotify("Upload Error", "Failed to compress product image", "error");
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      onNotify("Validation Error", "Product name is required", "error");
      return;
    }
    if ((formData.price ?? 0) < 0) {
      onNotify("Validation Error", "Price must be non-negative", "error");
      return;
    }

    const stockNum = Number(formData.stock) || 0;
    const computedStatus =
      stockNum <= 0 ? "Out of Stock" : stockNum <= 10 ? "Low Stock" : "In Stock";

    const productPayload: Product = {
      id: editingProduct?.id || `prod-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category || "Supplements",
      price: Number(formData.price) || 0,
      stock: stockNum,
      barcode: formData.barcode?.trim() || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      description: formData.description?.trim() || "",
      imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80",
      status: computedStatus,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: state.currentUserAccount?.displayName || state.profile.fullName,
    };

    // Optimistic local update
    const updatedList = editingProduct
      ? products.map((p) => (p.id === editingProduct.id ? productPayload : p))
      : [productPayload, ...products];

    setProducts(updatedList);
    onUpdateState((prev) => ({ ...prev, products: updatedList }));
    setIsFormOpen(false);

    // Save to Firestore
    const res = await saveProductToCloud(productPayload);
    if (res.success) {
      onNotify(
        editingProduct ? "Product Updated" : "Product Created",
        `${productPayload.name} saved directly to Firebase Firestore`,
        "success"
      );
    } else {
      onNotify("Offline Saved", "Saved locally, will synchronize once online", "info");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    const targetId = deletingProduct.id;
    const updatedList = products.filter((p) => p.id !== targetId);

    setProducts(updatedList);
    onUpdateState((prev) => ({ ...prev, products: updatedList }));

    const res = await deleteProductFromCloud(targetId);
    setIsDeleting(false);
    setDeletingProduct(null);

    if (res.success) {
      onNotify("Product Deleted", "Product removed from database", "success");
    } else {
      onNotify("Offline Removed", "Removed locally", "info");
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "All" || p.category === categoryFilter;
      const matchesStock =
        stockFilter === "All" || p.status === stockFilter;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, stockFilter]);

  // Statistics
  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + p.stock * p.price, 0);
  const lowStockCount = products.filter((p) => p.status === "Low Stock").length;
  const outOfStockCount = products.filter((p) => p.status === "Out of Stock").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
              <Package className="w-3 h-3 text-blue-400" />
              Store & Inventory
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Firebase Synced
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-blue-400" />
            Product Management
          </h1>
          <p className="text-xs text-slate-400">
            Add, edit, track stock, scan barcodes, and manage prices across supplements, equipment, and gear.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={loadProducts}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Refresh from Firebase"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Total Products</div>
            <div className="text-lg font-bold text-white">{products.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Inventory Value</div>
            <div className="text-lg font-bold text-emerald-400">₹{totalInventoryValue.toLocaleString()}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Low Stock Alerts</div>
            <div className="text-lg font-bold text-amber-400">{lowStockCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Out of Stock</div>
            <div className="text-lg font-bold text-rose-400">{outOfStockCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, barcode, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900">All Categories</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-slate-900">{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Boxes className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900">All Status</option>
              <option value="In Stock" className="bg-slate-900">In Stock</option>
              <option value="Low Stock" className="bg-slate-900">Low Stock</option>
              <option value="Out of Stock" className="bg-slate-900">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Products Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Try adjusting your search criteria or add a new fitness product to your inventory.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 overflow-hidden flex flex-col transition-all shadow-md hover:shadow-xl"
            >
              {/* Product Image */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden">
                <img
                  src={product.imageUrl || "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm text-slate-200 border border-slate-700">
                    {product.category}
                  </span>
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${
                      product.status === "In Stock"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : product.status === "Low Stock"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {product.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">Price</div>
                      <div className="text-base font-black text-emerald-400">
                        ₹{product.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">In Stock</div>
                      <div className="text-sm font-bold text-white">{product.stock} units</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-950/50 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="flex items-center gap-1 font-mono">
                      <Barcode className="w-3 h-3 text-slate-400" />
                      {product.barcode}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => setViewProduct(product)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(product)}
                    className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors border border-blue-500/20"
                    title="Edit Product"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingProduct(product)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 relative my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {editingProduct ? "Edit Product" : "Add New Product"}
                    </h3>
                    <p className="text-xs text-slate-400">Save directly into Firebase Firestore</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pure Whey Isolate 100%"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Category & Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category || "Supplements"}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      {PRODUCT_CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-slate-900">{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Price (₹ INR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="e.g. 2499"
                      value={formData.price ?? ""}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Stock & Barcode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Available Stock (Units) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="e.g. 50"
                      value={formData.stock ?? ""}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Barcode / SKU
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 8901234567890"
                      value={formData.barcode || ""}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Product Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide nutritional highlights, materials, dosage or usage instructions..."
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Image Upload / URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Product Image
                  </label>
                  <div className="flex items-center gap-3">
                    {formData.imageUrl && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                        <img src={formData.imageUrl} alt="preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <input
                        type="url"
                        placeholder="Image URL or upload below"
                        value={formData.imageUrl || ""}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload from device</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {editingProduct ? "Update Product" : "Save to Firebase"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
        {viewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
            >
              <div className="relative aspect-video bg-slate-950">
                <img
                  src={viewProduct.imageUrl || "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80"}
                  alt={viewProduct.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setViewProduct(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/80 text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/80 text-slate-200 border border-slate-700">
                    {viewProduct.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      viewProduct.status === "In Stock"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {viewProduct.status}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{viewProduct.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {viewProduct.description || "No detailed description."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div>
                    <div className="text-slate-400">Price</div>
                    <div className="text-base font-bold text-emerald-400">₹{viewProduct.price.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Stock Quantity</div>
                    <div className="text-base font-bold text-white">{viewProduct.stock} units</div>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Barcode className="w-3.5 h-3.5 text-slate-400" />
                      Barcode / SKU
                    </span>
                    <span className="font-mono font-bold text-slate-200">{viewProduct.barcode}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setViewProduct(null);
                      handleOpenEditModal(viewProduct);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Product
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog before Delete */}
      <ConfirmationDialog
        isOpen={Boolean(deletingProduct)}
        title="Delete Product?"
        message={`Are you sure you want to permanently remove "${deletingProduct?.name}" from your Firebase database? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Keep Product"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingProduct(null)}
      />
    </div>
  );
};
