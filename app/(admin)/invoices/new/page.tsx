"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Customer {
  id: number;
  customer_name?: string;
  customer_phone?: string;
  address1?: string;
  address2?: string;
}

interface InvoiceItem {
  item_name?: string;
  description?: string;
  qty?: number;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  amount?: number;
}

interface Order {
  id: number;
  order_number?: string;
  customer_id: number;
  deposit_paid?: number;
  deposit_amount?: number;
  total_price?: number;
  event_date?: string;
  items_data?: any;
  customers?: Customer;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Data Sources
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Selection States
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isCustomerLocked, setIsCustomerLocked] = useState(false);

  // Live Search Customer State
  const [customerSearch, setCustomerSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form Basic States
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentTerms, setPaymentTerms] = useState<number>(14);
  const [dueDate, setDueDate] = useState("");

  // Items & Financials
  const [items, setItems] = useState<InvoiceItem[]>([
    { item_name: "", qty: 1, unit_price: 0 },
  ]);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadInitialData();
    generateInvoiceNumber();

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (invoiceDate) {
      const date = new Date(invoiceDate);
      date.setDate(date.getDate() + Number(paymentTerms));
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      setDueDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [invoiceDate, paymentTerms]);

  // Ekstrak nama & telefon secara selamat
  const getCustName = (c?: Customer | null) =>
    c?.customer_name || "Pelanggan Tanpa Nama";

  const getCustPhone = (c?: Customer | null) => c?.customer_phone || "-";

  // Ekstrak barangan daripada JSONB
  const parseOrderItems = (rawItems: any): InvoiceItem[] => {
    if (!rawItems) return [];
    let parsed = rawItems;
    if (typeof rawItems === "string") {
      try {
        parsed = JSON.parse(rawItems);
      } catch (e) {
        return [];
      }
    }
    if (Array.isArray(parsed)) {
      return parsed.map((it: any) => ({
        item_name: it.item_name || it.description || "",
        qty: Number(it.qty || it.quantity || 1),
        unit_price: Number(it.unit_price || 0),
        total_price: Number(it.total_price || it.amount || 0),
      }));
    }
    return [];
  };

  const loadInitialData = async () => {
    try {
      const [custRes, ordRes] = await Promise.all([
        supabase.from("customers").select("*"),
        supabase.from("orders").select("*").order("id", { ascending: false }),
      ]);

      if (custRes.error)
        console.error("Ralat Customers:", custRes.error.message);
      if (ordRes.error) console.error("Ralat Orders:", ordRes.error.message);

      const customerList: Customer[] = custRes.data || [];
      setCustomers(customerList);

      if (ordRes.data) {
        const mergedOrders = ordRes.data.map((ord: any) => {
          const matchedCust = customerList.find(
            (c) => String(c.id) === String(ord.customer_id),
          );
          return {
            ...ord,
            customers: matchedCust || undefined,
          };
        });
        setOrders(mergedOrders);
      }
    } catch (err: any) {
      console.error("Ralat memuatkan data:", err.message || err);
    }
  };

  const generateInvoiceNumber = () => {
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`INV-${today}-${randomDigits}`);
  };

  const handleOrderSelect = (orderIdStr: string) => {
    setSelectedOrderId(orderIdStr);

    if (!orderIdStr) {
      setIsCustomerLocked(false);
      setSelectedCustomer(null);
      setCustomerSearch("");
      setEventDate("");
      setItems([{ item_name: "", qty: 1, unit_price: 0 }]);
      setDepositAmount(0);
      return;
    }

    const order = orders.find((o) => String(o.id) === orderIdStr);
    if (order) {
      if (order.customers) {
        setSelectedCustomer(order.customers);
        setCustomerSearch(getCustName(order.customers));
        setIsCustomerLocked(true);
      } else {
        setIsCustomerLocked(false);
      }

      if (order.event_date) setEventDate(order.event_date);

      const parsedItems = parseOrderItems(order.items_data);
      if (parsedItems.length > 0) {
        setItems(parsedItems);
      }

      const dep = order.deposit_paid ?? order.deposit_amount;
      if (dep !== undefined && dep !== null) {
        setDepositAmount(Number(dep));
      }
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(getCustName(customer));
    setIsDropdownOpen(false);
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { item_name: "", qty: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce(
    (sum, item) =>
      sum + (Number(item.qty) || 0) * (Number(item.unit_price) || 0),
    0,
  );
  const totalAmount = subtotal + Number(deliveryFee);
  const balanceDue = totalAmount - Number(depositAmount);

  const filteredCustomers = customers.filter(
    (c) =>
      getCustName(c).toLowerCase().includes(customerSearch.toLowerCase()) ||
      getCustPhone(c).includes(customerSearch),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert("Sila pilih pelanggan.");
      return;
    }

    setLoading(true);

    // Format items_data untuk disimpan ke lajur jsonb dalam jadual invoices
    const formattedItemsData = items.map((item) => ({
      item_name: item.item_name || "",
      description: item.description || "",
      quantity: Number(item.qty || 1),
      unit_price: Number(item.unit_price || 0),
      total_price: Number(item.qty || 1) * Number(item.unit_price || 0),
    }));

    // Generate slug rawak untuk capaian invois awam
    const generatedSlug = `${invoiceNumber.toLowerCase()}-${Math.random().toString(36).substring(2, 7)}`;

    const invoicePayload = {
      invoice_number: invoiceNumber,
      order_id: selectedOrderId ? Number(selectedOrderId) : null,
      customer_id: selectedCustomer.id,
      event_date: eventDate || null,
      invoice_date: invoiceDate,
      due_date: dueDate,
      payment_terms: paymentTerms,
      items_data: formattedItemsData,
      subtotal: subtotal,
      delivery_fee: Number(deliveryFee),
      deposit_paid: Number(depositAmount),
      total_amount: totalAmount,
      balance_due: balanceDue,
      notes: notes,
      slug: generatedSlug,
      status:
        balanceDue <= 0 ? "paid" : depositAmount > 0 ? "partial" : "unpaid",
    };

    const { error } = await supabase.from("invoices").insert([invoicePayload]);

    if (error) {
      alert("Gagal mencipta invois: " + error.message);
      setLoading(false);
    } else {
      router.push("/invoices");
    }
  };

  const activeOrder = orders.find((o) => String(o.id) === selectedOrderId);
  const extractedOrderItems = activeOrder
    ? parseOrderItems(activeOrder.items_data)
    : [];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          Tambah Invois Baharu
        </h1>
        <p className="text-xs text-slate-500">
          Jana invois rasmi berasaskan pesanan atau senarai pelanggan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KAD RUJUKAN TEMPAHAN */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                  Rujukan Tempahan
                </span>
                <h2 className="text-sm font-bold text-slate-900">
                  {activeOrder
                    ? activeOrder.order_number || `#ORD-${activeOrder.id}`
                    : "Pilih Order Untuk Rujukan"}
                </h2>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  activeOrder
                    ? "bg-blue-50 text-blue-600 border border-blue-100"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {activeOrder ? "Data Ditarik" : "Tiada Order"}
              </span>
            </div>

            {activeOrder ? (
              <>
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Pelanggan
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    {getCustName(activeOrder.customers)}
                  </p>
                  <p className="text-[11px] font-mono text-slate-600">
                    {getCustPhone(activeOrder.customers)}
                  </p>
                </div>

                {activeOrder.event_date && (
                  <div className="flex justify-between items-center text-xs px-1">
                    <span className="text-slate-500 font-medium">
                      Tarikh Majlis:
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      {activeOrder.event_date}
                    </span>
                  </div>
                )}

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-bold text-slate-500 block">
                    Menu / Barangan Tempahan ({extractedOrderItems.length})
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {extractedOrderItems.length > 0 ? (
                      extractedOrderItems.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                        >
                          <span className="truncate max-w-[150px] text-slate-700 font-medium">
                            {it.item_name || "Barang"}
                          </span>
                          <span className="font-mono text-[11px] text-slate-600 font-bold">
                            {it.qty} x RM {(it.unit_price || 0).toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Tiada maklumat item dijumpai.
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs bg-slate-50/50 p-3 rounded-xl">
                  <div className="flex justify-between text-slate-600">
                    <span>Jumlah Rekod Order:</span>
                    <span className="font-mono font-bold text-slate-800">
                      RM {(Number(activeOrder.total_price) || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Deposit Rekod Order:</span>
                    <span className="font-mono font-bold">
                      RM{" "}
                      {(
                        Number(
                          activeOrder.deposit_paid ||
                            activeOrder.deposit_amount,
                        ) || 0
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                <p>
                  Sila pilih nombor order di borang sebelah untuk memuatkan data
                  tempahan asal di sini.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* BORANG INVOIS */}
        <div className="lg:col-span-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombor Invois (Automatik)
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  readOnly
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Nombor Order (Opsional)
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleOrderSelect(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="">-- Pilih Order (Jika ada) --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number || `#ORD-${o.id}`}
                      {o.customers ? ` - ${getCustName(o.customers)}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Pelanggan * {isCustomerLocked && "(Dikunci dari Order)"}
                </label>
                <input
                  type="text"
                  placeholder="Taip untuk cari nama atau no. telefon pelanggan..."
                  value={customerSearch}
                  disabled={isCustomerLocked}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => !isCustomerLocked && setIsDropdownOpen(true)}
                  className={`w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                    isCustomerLocked
                      ? "bg-slate-100 text-slate-600 cursor-not-allowed"
                      : "bg-white"
                  }`}
                />

                {isDropdownOpen && !isCustomerLocked && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400">
                        Tiada pelanggan dijumpai
                      </div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-none text-xs"
                        >
                          <p className="font-bold text-slate-800">
                            {getCustName(c)}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {getCustPhone(c)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tarikh Majlis
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tarikh Invois
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Terma (Hari)
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(Number(e.target.value))}
                  className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value={7}>7 Hari</option>
                  <option value={14}>14 Hari</option>
                  <option value={30}>30 Hari</option>
                  <option value={60}>60 Hari</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tarikh Due (Locked)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  readOnly
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">
                Senarai Barangan / Perkhidmatan Invois
              </label>

              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Nama Perkhidmatan / Menu"
                    value={item.item_name || ""}
                    onChange={(e) =>
                      handleItemChange(index, "item_name", e.target.value)
                    }
                    required
                    className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Kuantiti"
                    value={item.qty || 1}
                    onChange={(e) =>
                      handleItemChange(index, "qty", Number(e.target.value))
                    }
                    required
                    className="w-20 text-xs px-3 py-2 border border-slate-200 rounded-xl text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Harga Unit (RM)"
                    value={item.unit_price || 0}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "unit_price",
                        Number(e.target.value),
                      )
                    }
                    required
                    className="w-28 text-xs px-3 py-2 border border-slate-200 rounded-xl text-right focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="w-24 text-right text-xs font-mono font-bold text-slate-700">
                    RM {((item.qty || 0) * (item.unit_price || 0)).toFixed(2)}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl text-xs transition cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                + Tambah Barangan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cas Penghantaran (RM) - Opsional
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={deliveryFee || ""}
                  onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Deposit / Bayaran Awal (RM)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={depositAmount || ""}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nota / Terma Bayaran (Opsional)
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Sila buat pembayaran ke akaun bank Maybank/CIMB..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="w-full md:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">
                    RM {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cas Penghantaran:</span>
                  <span className="font-mono font-bold">
                    RM {Number(deliveryFee).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2">
                  <span>Jumlah Keseluruhan:</span>
                  <span className="font-mono">RM {totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Deposit Dibayar:</span>
                  <span className="font-mono font-bold">
                    - RM {Number(depositAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-blue-600 border-t border-slate-200 pt-2">
                  <span>Baki Tuntut:</span>
                  <span className="font-mono">RM {balanceDue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Menyimpan..." : "Simpan Invois"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
