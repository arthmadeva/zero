"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

// Define the schema column types
interface Column {
  key: string;
  label: string;
  type: "text" | "date" | "time" | "boolean";
  role: "Admin Cabang" | "Layanan Konsumen / CS" | "Staf Gudang" | "Staf Keuangan Manajemen";
}

const COLUMNS: Column[] = [
  // Cabang
  { key: "cabang", label: "Cabang", type: "text", role: "Admin Cabang" },
  // Admin Cabang fields
  { key: "nama", label: "Nama", type: "text", role: "Admin Cabang" },
  { key: "email", label: "Email", type: "text", role: "Admin Cabang" },
  { key: "tanggal_lahir", label: "Tgl Lahir", type: "date", role: "Admin Cabang" },
  { key: "no_hp", label: "No HP", type: "text", role: "Admin Cabang" },
  { key: "nomor_kartu", label: "No Kartu", type: "text", role: "Admin Cabang" },
  { key: "unit_bri", label: "Unit BRI", type: "text", role: "Admin Cabang" },
  { key: "promotor", label: "Promotor", type: "text", role: "Admin Cabang" },
  
  // CS fields
  { key: "nama_cs", label: "Nama CS", type: "text", role: "Layanan Konsumen / CS" },
  { key: "tanggal_telepon", label: "Tgl Telepon", type: "date", role: "Layanan Konsumen / CS" },
  { key: "jam_telepon", label: "Jam Telepon", type: "time", role: "Layanan Konsumen / CS" },
  { key: "plafon", label: "Plafon", type: "text", role: "Layanan Konsumen / CS" },
  { key: "resep", label: "Resep", type: "text", role: "Layanan Konsumen / CS" },
  { key: "beli", label: "Beli", type: "boolean", role: "Layanan Konsumen / CS" },

  // Gudang fields
  { key: "nomor_acc_penjualan_silang", label: "No ACC Silang", type: "text", role: "Staf Gudang" },
  { key: "nomor_sp", label: "No SP", type: "text", role: "Staf Gudang" },
  { key: "alamat_pengiriman", label: "Alamat Kirim", type: "text", role: "Staf Gudang" },
  { key: "verifikasi_no_hp", label: "Verif HP", type: "boolean", role: "Staf Gudang" },
  { key: "tanggal_kirim_frame", label: "Tgl Kirim Frame", type: "date", role: "Staf Gudang" },
  { key: "actual", label: "Actual", type: "text", role: "Staf Gudang" },
  { key: "tanggal_terima_frame", label: "Tgl Terima Frame", type: "date", role: "Staf Gudang" },
  { key: "sudah_terima_frame", label: "Sdh Terima Frame", type: "boolean", role: "Staf Gudang" },
  { key: "tanggal_kirim_lensa", label: "Tgl Kirim Lensa", type: "date", role: "Staf Gudang" },
  { key: "stock", label: "Stock", type: "boolean", role: "Staf Gudang" },
  { key: "gosok", label: "Gosok", type: "boolean", role: "Staf Gudang" },
  { key: "acc_pusat_actual", label: "Acc Pusat Actual", type: "boolean", role: "Staf Gudang" },
  { key: "no_acc_pusat_actual", label: "No Acc Pusat", type: "text", role: "Staf Gudang" },
  { key: "no_faktur", label: "No Faktur", type: "text", role: "Staf Gudang" },
  { key: "tanggal_terima_lensa", label: "Tgl Terima Lensa", type: "date", role: "Staf Gudang" },
  { key: "sudah_produksi", label: "Sdh Produksi", type: "boolean", role: "Staf Gudang" },
  { key: "petugas_produksi", label: "Petugas Prod", type: "text", role: "Staf Gudang" },
  { key: "tanggal_selesai_produksi", label: "Tgl Selesai Prod", type: "date", role: "Staf Gudang" },

  // Keuangan fields
  { key: "proses_pengiriman", label: "Proses Kirim", type: "boolean", role: "Staf Keuangan Manajemen" },
  { key: "qc", label: "QC", type: "boolean", role: "Staf Keuangan Manajemen" },
  { key: "resi_pengiriman", label: "Resi Kirim", type: "text", role: "Staf Keuangan Manajemen" },
  { key: "id_form", label: "ID Form", type: "text", role: "Staf Keuangan Manajemen" },
];

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [cabang, setCabang] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Form states for login/signup
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [registerRole, setRegisterRole] = useState<string>("Admin Cabang");
  const [registerCabang, setRegisterCabang] = useState<string>("Bandung");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");

  // Grid states
  const [rows, setRows] = useState<any[]>([]);
  const [filteredRows, setFilteredRows] = useState<any[]>([]);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // Active cell navigation
  const [activeCell, setActiveCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: number; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  
  // Validation and sync logs
  const [errorCells, setErrorCells] = useState<{ [key: string]: boolean }>({});
  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);
  const [syncing, setSyncing] = useState(false);

  // References for inputs
  const tableRef = useRef<HTMLTableElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auth state listener
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const userRole = session.user.app_metadata?.role || session.user.user_metadata?.role || "";
        const userCabang = session.user.app_metadata?.cabang || session.user.user_metadata?.cabang || "";
        setRole(userRole);
        setCabang(userCabang);
        fetchData(userRole, userCabang);
      } else {
        setLoading(false);
      }
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const userRole = session.user.app_metadata?.role || session.user.user_metadata?.role || "";
        const userCabang = session.user.app_metadata?.cabang || session.user.user_metadata?.cabang || "";
        setRole(userRole);
        setCabang(userCabang);
        fetchData(userRole, userCabang);
      } else {
        setUser(null);
        setRole("");
        setCabang("");
        setRows([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data with proper filtering based on role
  const fetchData = async (userRole: string, userCabang: string) => {
    setLoading(true);
    let query = supabase.from("collect_data").select("*");

    // RLS and frontend filtering: Admin Cabang and CS only view their own branch
    if (userRole === "Admin Cabang" || userRole === "Layanan Konsumen / CS") {
      query = query.eq("cabang", userCabang);
    }

    const { data, error } = await query.order("id", { ascending: false });

    if (error) {
      showNotification(`Failed to load data: ${error.message}`, "error");
    } else {
      setRows(data || []);
    }
    setLoading(false);
  };

  // Run filters and sorting locally
  useEffect(() => {
    let result = [...rows];

    // Filter
    Object.keys(filters).forEach((key) => {
      const val = filters[key].toLowerCase();
      if (val) {
        result = result.filter((row) =>
          String(row[key] ?? "").toLowerCase().includes(val)
        );
      }
    });

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (sortConfig.direction === "asc") {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    setFilteredRows(result);
  }, [rows, filters, sortConfig]);

  // Notifications
  const showNotification = (message: string, type: "error" | "success" | "info") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Auth Operations
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: emailInput,
        password: passwordInput,
        options: {
          data: {
            role: registerRole,
            cabang: registerCabang,
          },
        },
      });
      if (error) {
        setAuthError(error.message);
        setLoading(false);
      } else {
        showNotification("Signup successful! You can now log in.", "success");
        setIsSignUp(false);
        setLoading(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
      });
      if (error) {
        setAuthError(error.message);
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Add Row (only Admin Cabang allowed)
  const handleAddRow = async () => {
    if (role !== "Admin Cabang") {
      showNotification("Unauthorized Access: Only Admin Cabang can add rows.", "error");
      return;
    }

    setSyncing(true);
    // Create new row with preloaded user branch. Id and created_at are generated by DB
    const newRow = {
      cabang: cabang,
      nama: "Baru",
    };

    const { data, error } = await supabase
      .from("collect_data")
      .insert([newRow])
      .select();

    setSyncing(false);

    if (error) {
      showNotification(`Failed to create row: ${error.message}`, "error");
    } else if (data && data.length > 0) {
      setRows([data[0], ...rows]);
      showNotification("Row created successfully", "success");
      // Focus on the newly created row
      setActiveCell({ rowIndex: 0, colIndex: 1 });
    }
  };

  // Edit validation & DB sync
  const startEditing = (row: any, column: Column, rowIndex: number, colIndex: number) => {
    // Role-based block
    if (column.role !== role && !(role === "Staf Keuangan Manajemen" || role === "Staf Gudang")) {
      showNotification("Unauthorized Access: You do not have permissions to edit this column.", "error");
      return;
    }

    setEditingCell({ rowId: row.id, colKey: column.key });
    setEditValue(row[column.key] !== null && row[column.key] !== undefined ? String(row[column.key]) : "");
    setActiveCell({ rowIndex, colIndex });
  };

  // Save changes
  const saveCellEdit = async (rowId: number, colKey: string, value: any, columnType: string) => {
    setEditingCell(null);

    const originalRow = rows.find((r) => r.id === rowId);
    const originalValue = originalRow ? originalRow[colKey] : null;

    // Type parsing and validation
    let parsedValue: any = value;
    let isValid = true;

    if (columnType === "boolean") {
      if (typeof value === "string") {
        const clean = value.toLowerCase().trim();
        if (clean === "true" || clean === "1" || clean === "yes" || clean === "on") {
          parsedValue = true;
        } else if (clean === "false" || clean === "0" || clean === "no" || clean === "off" || clean === "") {
          parsedValue = false;
        } else {
          isValid = false;
        }
      } else {
        parsedValue = Boolean(value);
      }
    } else if (columnType === "date") {
      if (value) {
        // Date regex YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) {
          isValid = false;
        }
      } else {
        parsedValue = null;
      }
    } else if (columnType === "time") {
      if (value) {
        // Time regex HH:MM or HH:MM:SS
        const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
        if (!timeRegex.test(value)) {
          isValid = false;
        }
      } else {
        parsedValue = null;
      }
    }

    if (!isValid) {
      setErrorCells((prev) => ({ ...prev, [`${rowId}-${colKey}`]: true }));
      showNotification("Invalid Input Type Format", "error");
      return;
    }

    // Skip update if value hasn't changed
    if (parsedValue === originalValue) return;

    // Optimistic Update
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [colKey]: parsedValue } : r))
    );
    setErrorCells((prev) => {
      const copy = { ...prev };
      delete copy[`${rowId}-${colKey}`];
      return copy;
    });

    setSyncing(true);
    
    // Save to DB
    const startSaveTime = Date.now();
    const { error } = await supabase
      .from("collect_data")
      .update({ [colKey]: parsedValue })
      .eq("id", rowId);

    const elapsed = Date.now() - startSaveTime;
    setSyncing(false);

    if (error) {
      // Rollback
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, [colKey]: originalValue } : r))
      );
      showNotification(`Server sync failed: ${error.message}. Rollback performed.`, "error");
    } else {
      if (elapsed > 2000) {
        showNotification("Sync completed, but connection is slow.", "info");
      }
    }
  };

  // Keyboard navigation logic
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableElement>) => {
    if (!activeCell) return;
    
    const { rowIndex, colIndex } = activeCell;
    const maxRows = filteredRows.length;
    const maxCols = COLUMNS.length;

    // Handle editing cell keys
    if (editingCell) {
      if (e.key === "Enter") {
        e.preventDefault();
        const activeColumn = COLUMNS[colIndex];
        saveCellEdit(editingCell.rowId, editingCell.colKey, editValue, activeColumn.type);
        // Move focus down
        if (rowIndex < maxRows - 1) {
          setActiveCell({ rowIndex: rowIndex + 1, colIndex });
        }
      } else if (e.key === "Escape") {
        setEditingCell(null);
      }
      return;
    }

    // Normal navigation mode
    let nextRow = rowIndex;
    let nextCol = colIndex;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        if (rowIndex > 0) nextRow--;
        break;
      case "ArrowDown":
        e.preventDefault();
        if (rowIndex < maxRows - 1) nextRow++;
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (colIndex > 0) nextCol--;
        break;
      case "ArrowRight":
        e.preventDefault();
        if (colIndex < maxCols - 1) nextCol++;
        break;
      case "Tab":
        e.preventDefault();
        if (colIndex < maxCols - 1) {
          nextCol++;
        } else if (rowIndex < maxRows - 1) {
          nextCol = 0;
          nextRow++;
        }
        break;
      case "Enter":
        e.preventDefault();
        const row = filteredRows[rowIndex];
        const col = COLUMNS[colIndex];
        startEditing(row, col, rowIndex, colIndex);
        return;
      default:
        return;
    }

    setActiveCell({ rowIndex: nextRow, colIndex: nextCol });
  };

  // Focus effect for inputs when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Headers sorting
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filters inputs
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Helper to color headers based on roles
  const getHeaderColor = (columnRole: string) => {
    switch (columnRole) {
      case "Admin Cabang":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/30";
      case "Layanan Konsumen / CS":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/30";
      case "Staf Gudang":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/30";
      case "Staf Keuangan Manajemen":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/30";
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200";
    }
  };

  if (loading && !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-zinc-200"></div>
          <span className="text-sm font-medium">Memuat sistem...</span>
        </div>
      </div>
    );
  }

  // Login view
  if (!user) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 shadow-xl backdrop-blur-sm">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
              Akur Optic 55
            </h2>
            <p className="mt-2 text-center text-sm text-zinc-400">
              Integrasi Spreadsheet "Collect Data" (AKUR)
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleAuth}>
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label className="text-xs font-semibold text-zinc-400">Email</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="mt-1 block w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400">Password</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="mt-1 block w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="••••••••"
                />
              </div>

              {isSignUp && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-400">Role</label>
                    <select
                      value={registerRole}
                      onChange={(e) => setRegisterRole(e.target.value)}
                      className="mt-1 block w-full rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-2 text-white text-sm"
                    >
                      <option>Admin Cabang</option>
                      <option>Layanan Konsumen / CS</option>
                      <option>Staf Gudang</option>
                      <option>Staf Keuangan Manajemen</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-400">Cabang</label>
                    <select
                      value={registerCabang}
                      onChange={(e) => setRegisterCabang(e.target.value)}
                      className="mt-1 block w-full rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-2 text-white text-sm"
                    >
                      <option>Bandung</option>
                      <option>Jakarta</option>
                      <option>Surabaya</option>
                      <option>Medan</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {authError && (
              <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                {authError}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                {loading ? "Proses..." : isSignUp ? "Buat Akun Demo" : "Masuk"}
              </button>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-center text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {isSignUp ? "Sudah punya akun? Masuk" : "Belum punya akun? Buat akun untuk pengujian"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">AKUR Spreadsheet</h1>
          <span className="h-5 w-px bg-zinc-800"></span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
              Peran: {role}
            </span>
            {cabang && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                Cabang: {cabang}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {syncing && (
            <span className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              <span className="h-2 w-2 animate-ping rounded-full bg-blue-400"></span>
              Menyinkronkan...
            </span>
          )}
          {role === "Admin Cabang" && (
            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-1.5 px-4 rounded-lg transition-colors cursor-pointer"
            >
              Tambah Baris
            </button>
          )}
          <button
            onClick={handleLogout}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm font-medium py-1.5 px-3 rounded-lg border border-zinc-700 transition-colors cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-18 right-6 z-50 animate-bounce">
          <div className={`p-4 rounded-xl border shadow-lg text-sm font-semibold flex items-center gap-3 backdrop-blur-md ${
            notification.type === "error"
              ? "bg-red-500/20 text-red-200 border-red-500/30"
              : notification.type === "success"
              ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30"
              : "bg-blue-500/20 text-blue-200 border-blue-500/30"
          }`}>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Grid Area */}
      <main className="flex-1 overflow-auto p-6">
        <div className="h-full w-full bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col">
          
          {/* Scrollable Table Wrapper */}
          <div className="flex-1 overflow-auto">
            <table
              ref={tableRef}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              className="w-full border-collapse text-left text-sm table-fixed focus:outline-none"
              style={{ minWidth: "4000px" }}
            >
              <thead className="sticky top-0 z-20 bg-zinc-900 border-b border-zinc-800">
                {/* Headers */}
                <tr>
                  <th className="w-16 p-3 bg-zinc-900 border-r border-zinc-800 text-center text-xs font-semibold text-zinc-500">ID</th>
                  <th className="w-48 p-3 bg-zinc-900 border-r border-zinc-800 text-left text-xs font-semibold text-zinc-500">Created At</th>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className={`w-52 p-3 border-r border-zinc-800 text-xs font-semibold transition-colors cursor-pointer ${getHeaderColor(column.role)}`}
                      onClick={() => requestSort(column.key)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{column.label}</span>
                        {sortConfig?.key === column.key && (
                          <span className="text-[10px]">
                            {sortConfig.direction === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
                {/* Filter Inputs Row */}
                <tr className="bg-zinc-900/50 border-b border-zinc-800">
                  <td className="p-1.5 border-r border-zinc-800"></td>
                  <td className="p-1.5 border-r border-zinc-800"></td>
                  {COLUMNS.map((column) => (
                    <td key={`filter-${column.key}`} className="p-1.5 border-r border-zinc-800">
                      {column.type !== "boolean" && (
                        <input
                           type="text"
                           placeholder="Saring..."
                           value={filters[column.key] || ""}
                           onChange={(e) => handleFilterChange(column.key, e.target.value)}
                           className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-800 hover:bg-zinc-800/20 transition-colors"
                  >
                    {/* ID */}
                    <td className="p-3 border-r border-zinc-800 text-center font-mono text-xs text-zinc-500">
                      {row.id}
                    </td>
                    {/* Created At */}
                    <td className="p-3 border-r border-zinc-800 text-zinc-400 font-mono text-xs truncate">
                      {new Date(row.created_at).toLocaleString("id-ID")}
                    </td>

                    {/* Dynamic Cells */}
                    {COLUMNS.map((column, colIndex) => {
                      const cellId = `${row.id}-${column.key}`;
                      const isSelected = activeCell?.rowIndex === rowIndex && activeCell?.colIndex === colIndex;
                      const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === column.key;
                      const hasError = errorCells[cellId];
                      const isReadonly = column.role !== role && !(role === "Staf Keuangan Manajemen" || role === "Staf Gudang");

                      return (
                        <td
                          key={column.key}
                          onDoubleClick={() => !isReadonly && startEditing(row, column, rowIndex, colIndex)}
                          onClick={() => setActiveCell({ rowIndex, colIndex })}
                          className={`p-1.5 border-r border-zinc-800 relative transition-all ${
                            isSelected ? "ring-2 ring-blue-500 ring-inset" : ""
                          } ${hasError ? "bg-red-500/10 ring-2 ring-red-500 ring-inset" : ""} ${
                            isReadonly ? "bg-zinc-900/30 text-zinc-500 cursor-not-allowed" : "cursor-pointer"
                          }`}
                        >
                          {isEditing ? (
                            column.type === "boolean" ? (
                              <input
                                ref={inputRef as any}
                                type="checkbox"
                                checked={editValue === "true"}
                                onChange={(e) => {
                                  const val = e.target.checked ? "true" : "false";
                                  setEditValue(val);
                                  saveCellEdit(row.id, column.key, e.target.checked, column.type);
                                }}
                                onBlur={() => saveCellEdit(row.id, column.key, editValue === "true", column.type)}
                                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-700 bg-zinc-800"
                              />
                            ) : (
                              <input
                                ref={inputRef as any}
                                type={column.type}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => saveCellEdit(row.id, column.key, editValue, column.type)}
                                className="w-full bg-zinc-950 text-white rounded px-2 py-0.5 border border-blue-500 focus:outline-none focus:border-blue-400 font-mono text-xs"
                              />
                            )
                          ) : column.type === "boolean" ? (
                            <input
                              type="checkbox"
                              disabled={isReadonly}
                              checked={Boolean(row[column.key])}
                              onChange={(e) => {
                                if (isReadonly) return;
                                saveCellEdit(row.id, column.key, e.target.checked, column.type);
                              }}
                              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-700 bg-zinc-800 cursor-pointer disabled:cursor-not-allowed"
                            />
                          ) : (
                            <span className="font-mono text-xs block truncate min-h-[1.5rem] py-0.5 px-1">
                              {row[column.key] !== null && row[column.key] !== undefined ? String(row[column.key]) : ""}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={COLUMNS.length + 2}
                      className="p-8 text-center text-zinc-500 bg-zinc-900/50"
                    >
                      Tidak ada data yang cocok dengan filter aktif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
        </div>
      </main>
    </div>
  );
}
