"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApolloClient, InMemoryCache, ApolloProvider, gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";

const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "https://back-end-smoky-alpha.vercel.app/api/graphql",
  cache: new InMemoryCache(),
});

const GET_ALL_ORDERS = gql`
  query GetAllOrders {
    getAllOrders {
      id username email phone
      items { name price qty picture }
      subtotal shipping total
      address paymentMethod status createdAt
    }
  }
`;

const GET_ALL_USERS = gql`
  query GetAllUsers {
    getAllUsers { _id username phoneNumber }
  }
`;

const GET_ALL_PRODUCTS = gql`
  query GetAllProducts {
    getAlliMac { id name price picture chip year }
    getAlliPhones { id name price picture chip year }
    getAllMacBookAir { id name price picture chip year }
    getAllMacBookPro { id name price picture chip year }
    getAllMacMini { id name price picture chip year }
    getAllMacStudio { id name price picture chip year }
    getAllMacPro { id name price picture chip year }
    getAllMacBookNeo { id name price picture chip year }
    getAlliPads { id name price picture chip year }
    getAllWatch { id name price picture year }
    getAllAirPods { id name price picture year }
    getAllVision { id name price picture year }
  }
`;

const UPDATE_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $status: String!) {
    updateOrderStatus(id: $id, status: $status) { id status }
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!, $category: String!) {
    deleteProduct(id: $id, category: $category)
  }
`;

const ADD_PRODUCT = gql`
  mutation AddProduct($name: String!, $price: Float!, $category: String!, $chip: String, $year: String, $picture: String) {
    addProduct(name: $name, price: $price, category: $category, chip: $chip, year: $year, picture: $picture) {
      id name price picture chip year
    }
  }
`;

const categoryRoutes: Record<string, string> = {
  getAlliMac: "imac", getAlliPhones: "iphone", getAllMacBookAir: "macbook_air",
  getAllMacBookPro: "macbook_pro", getAllMacMini: "mac_mini", getAllMacStudio: "mac_studio",
  getAllMacPro: "mac_pro", getAllMacBookNeo: "macbook", getAlliPads: "ipad",
  getAllWatch: "watch", getAllAirPods: "airpods", getAllVision: "vision",
};

const categoryLabels: Record<string, string> = {
  imac: "iMac", iphone: "iPhone", macbook_air: "MacBook Air",
  macbook_pro: "MacBook Pro", mac_mini: "Mac Mini", mac_studio: "Mac Studio",
  mac_pro: "Mac Pro", macbook: "MacBook Neo", ipad: "iPad",
  watch: "Apple Watch", airpods: "AirPods", vision: "Vision Pro",
};

const STATUS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:    { label: "Хүлээгдэж байна", color: "text-amber-400",  bg: "bg-amber-400/10",  dot: "bg-amber-400" },
  paid:       { label: "Төлөгдсөн",       color: "text-blue-400",   bg: "bg-blue-400/10",   dot: "bg-blue-400" },
  delivering: { label: "Хүргэж байна",    color: "text-purple-400", bg: "bg-purple-400/10", dot: "bg-purple-400" },
  delivered:  { label: "Хүргэгдсэн",      color: "text-green-400",  bg: "bg-green-400/10",  dot: "bg-green-400" },
  cancelled:  { label: "Цуцлагдсан",      color: "text-red-400",    bg: "bg-red-400/10",    dot: "bg-red-400" },
};

const PAY: Record<string, string> = { qpay: "QPay", socialpay: "SocialPay", monpay: "MonPay", transfer: "Дансаар" };

type Tab = "overview" | "orders" | "products" | "users";

const EMPTY_FORM = { name: "", price: "", chip: "", year: "", picture: "", category: "iphone" };

function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [selected, setSelected] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);
  

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("admin_auth")) {
      router.push("/login");
    }
  }, []);

  const { data: ordersData, loading: ordersLoading, refetch } = useQuery(GET_ALL_ORDERS);
  const { data: usersData, loading: usersLoading } = useQuery(GET_ALL_USERS);
  const { data: productsData, loading: productsLoading, refetch: refetchProducts } = useQuery(GET_ALL_PRODUCTS);
  const [updateStatus] = useMutation(UPDATE_STATUS);
  const [deleteProduct] = useMutation(DELETE_PRODUCT);
  const [addProduct] = useMutation(ADD_PRODUCT);

  const orders = ordersData?.getAllOrders ?? [];
  const users = usersData?.getAllUsers ?? [];

  const allProducts = productsData
    ? Object.entries(productsData).flatMap(([key, arr]: [string, any]) =>
        (arr ?? []).map((p: any) => ({ ...p, category: categoryRoutes[key] ?? key }))
      )
    : [];

  const filteredProducts = allProducts.filter(p => {
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    const matchSearch = !productSearch ||
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.chip?.toLowerCase().includes(productSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredOrders = orders.filter((o: any) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch = !orderSearch ||
      o.username?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.id?.includes(orderSearch);
    return matchStatus && matchSearch;
  });

  const totalRevenue = orders.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + o.total, 0);
  const todayCount = orders.filter((o: any) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length;

  const handleStatus = async (id: string, status: string) => {
    await updateStatus({ variables: { id, status } });
    refetch();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const handleDelete = async (id: string, category: string, name: string) => {
    if (!confirm(`"${name}" устгах уу?`)) return;
    setDeleting(id);
    try {
      await deleteProduct({ variables: { id, category } });
      await refetchProducts();
    } catch (e) {
      alert("Устгахад алдаа гарлаа");
    } finally {
      setDeleting(null);
    }
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.price) return;
    setAddLoading(true);
    try {
      await addProduct({
        variables: {
          name: addForm.name,
          price: parseFloat(addForm.price),
          category: addForm.category,
          chip: addForm.chip || undefined,
          year: addForm.year || undefined,
          picture: addForm.picture || undefined,
        },
      });
      await refetchProducts();
      setShowAddModal(false);
      setAddForm(EMPTY_FORM);
    } catch (e) {
      alert("Бүтээгдэхүүн нэмэхэд алдаа гарлаа");
    } finally {
      setAddLoading(false);
    }
  };

  const TABS = [
    { id: "overview",  label: "Ерөнхий",      icon: "◈" },
    { id: "orders",    label: "Захиалгууд",    icon: "◫" },
    { id: "products",  label: "Бүтээгдэхүүн", icon: "◧" },
    { id: "users",     label: "Хэрэглэгчид",  icon: "◉" },
  ] as { id: Tab; label: string; icon: string }[];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="flex h-screen">

        {/* Sidebar */}
        <aside className="w-56 border-r border-neutral-800 flex-col bg-neutral-900 hidden md:flex flex-shrink-0">
          <div className="px-5 py-5 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm">🛍️</div>
              <div>
                <p className="text-[13px] font-semibold">Admin</p>
                <p className="text-[11px] text-neutral-500">Apple Store MN</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {TABS.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left ${
                  tab === item.id ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}>
                <span>{item.icon}</span>
                {item.label}
                {item.id === "orders" && orders.length > 0 && (
                  <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{orders.length}</span>
                )}
                {item.id === "products" && allProducts.length > 0 && (
                  <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{allProducts.length}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="px-3 py-4 border-t border-neutral-800">
            <button onClick={() => { localStorage.removeItem("admin_auth"); router.push("/login"); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-neutral-500 hover:text-red-400 hover:bg-red-400/5 transition-all">
              <span>⊗</span> Гарах
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {/* Top bar */}
          <div className="sticky top-0 z-10 bg-neutral-950/90 backdrop-blur border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
            <h1 className="text-[16px] font-semibold">
              {tab === "overview" ? "Ерөнхий мэдээлэл"
                : tab === "orders" ? `Захиалгууд (${orders.length})`
                : tab === "products" ? `Бүтээгдэхүүн (${allProducts.length})`
                : `Хэрэглэгчид (${users.length})`}
            </h1>
            <div className="flex gap-1 md:hidden">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${tab === t.id ? "bg-white/10 text-white" : "text-neutral-500"}`}>
                  {t.icon}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">

            {/* OVERVIEW */}
            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Нийт орлого",       value: `${totalRevenue.toLocaleString()}₮`, sub: "Цуцлагдаагүй" },
                    { label: "Нийт захиалга",      value: orders.length,                       sub: "Бүх цаг" },
                    { label: "Өнөөдрийн захиалга", value: todayCount,                          sub: "Өнөөдөр" },
                    { label: "Бүтээгдэхүүн",       value: allProducts.length,                  sub: "Нийт" },
                  ].map(s => (
                    <div key={s.label} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                      <p className="text-[26px] font-semibold">{s.value}</p>
                      <p className="text-[12px] text-neutral-400 mt-1">{s.label}</p>
                      <p className="text-[11px] text-neutral-600 mt-0.5">{s.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                  <h3 className="text-[14px] font-medium mb-4 text-neutral-300">Захиалгын төлөв</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {Object.entries(STATUS).map(([key, cfg]) => {
                      const count = orders.filter((o: any) => o.status === key).length;
                      return (
                        <button key={key} onClick={() => { setTab("orders"); setStatusFilter(key); }}
                          className={`p-4 rounded-xl text-left transition-all hover:scale-[1.02] ${cfg.bg} border border-white/5`}>
                          <p className={`text-[24px] font-semibold ${cfg.color}`}>{count}</p>
                          <p className={`text-[11px] font-medium mt-1 ${cfg.color}`}>{cfg.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-medium text-neutral-300">Сүүлийн захиалгууд</h3>
                    <button onClick={() => setTab("orders")} className="text-[12px] text-blue-400 hover:text-blue-300">Бүгдийг харах →</button>
                  </div>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((o: any) => {
                      const cfg = STATUS[o.status];
                      return (
                        <div key={o.id} className="flex items-center justify-between py-2.5 border-b border-neutral-800 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-[12px] font-medium text-neutral-400">
                              {(o.username || o.email || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[13px] font-medium">{o.username || "Зочин"}</p>
                              <p className="text-[11px] text-neutral-500">{new Date(o.createdAt).toLocaleDateString("mn-MN")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${cfg?.dot}`} />
                              <span className={`text-[11px] font-medium ${cfg?.color}`}>{cfg?.label}</span>
                            </div>
                            <p className="text-[13px] font-semibold">{o.total.toLocaleString()}₮</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* PRODUCTS */}
            {tab === "products" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-[13px]">🔍</span>
                    <input
                      type="text"
                      placeholder="Бүтээгдэхүүн хайх..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className="w-full h-9 pl-8 pr-3 rounded-xl bg-neutral-900 border border-neutral-700 text-[13px] text-white placeholder-neutral-600 outline-none focus:border-neutral-500"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-[13px] text-white outline-none"
                  >
                    <option value="all">Бүх төрөл</option>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <div className="flex items-center h-9 px-3 rounded-xl bg-neutral-800 border border-neutral-700 text-[12px] text-neutral-400">
                    {filteredProducts.length} бүтээгдэхүүн
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="h-9 px-4 rounded-xl bg-white text-neutral-900 text-[12px] font-semibold hover:bg-neutral-100 transition-all flex items-center gap-1.5"
                  >
                    + Нэмэх
                  </button>
                </div>

                {productsLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 animate-pulse">
                        <div className="w-full h-32 bg-neutral-800 rounded-xl mb-3" />
                        <div className="h-3 w-3/4 bg-neutral-800 rounded-full mb-2" />
                        <div className="h-3 w-1/2 bg-neutral-800 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-12 text-center">
                    <p className="text-neutral-500">Бүтээгдэхүүн олдсонгүй</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredProducts.map((p: any) => (
                      <div key={p.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 hover:border-neutral-700 transition-all group relative">

                        {/* Delete button — hover дээр харагдана */}
                        <button
                          onClick={() => handleDelete(p.id, p.category, p.name)}
                          disabled={deleting === p.id}
                          className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:border-red-500/40 transition-all z-10 text-neutral-500 hover:text-red-400 text-[12px]"
                        >
                          {deleting === p.id ? (
                            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                          ) : "✕"}
                        </button>

                        <div className="w-full h-32 bg-neutral-800 rounded-xl flex items-center justify-center overflow-hidden mb-3">
                          {p.picture ? (
                            <img src={p.picture} alt={p.name} className="h-24 object-contain" />
                          ) : (
                            <span className="text-3xl opacity-30">📦</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="inline-block text-[10px] font-medium text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
                            {categoryLabels[p.category] ?? p.category}
                          </span>
                          <p className="text-[12px] font-medium text-white line-clamp-2 leading-snug">{p.name}</p>
                          {p.chip && <p className="text-[11px] text-neutral-500">{p.chip}</p>}
                          <div className="flex items-center justify-between pt-1">
                            <p className="text-[13px] font-semibold text-white">${p.price?.toLocaleString()}</p>
                            {p.year && <p className="text-[11px] text-neutral-600">{p.year}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ORDERS */}
            {tab === "orders" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="Хайх..."
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    className="flex-1 min-w-[160px] h-9 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-[13px] text-white placeholder-neutral-600 outline-none focus:border-neutral-500"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {[{ id: "all", label: "Бүгд" }, ...Object.entries(STATUS).map(([id, c]) => ({ id, label: c.label }))].map(s => (
                      <button key={s.id} onClick={() => setStatusFilter(s.id)}
                        className={`px-3 h-9 rounded-xl text-[11px] font-medium border transition-all ${
                          statusFilter === s.id ? "bg-white text-neutral-900 border-transparent" : "bg-neutral-900 text-neutral-400 border-neutral-700 hover:border-neutral-500"
                        }`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {ordersLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-neutral-900 rounded-2xl border border-neutral-800 h-20 animate-pulse" />
                  ))
                ) : (
                  <div className="space-y-2">
                    {filteredOrders.map((o: any) => {
                      const cfg = STATUS[o.status];
                      const isOpen = selected?.id === o.id;
                      return (
                        <div key={o.id} className={`bg-neutral-900 rounded-2xl border transition-all ${isOpen ? "border-white/20" : "border-neutral-800 hover:border-neutral-700"}`}>
                          <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setSelected(isOpen ? null : o)}>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-[13px] font-medium text-neutral-400 flex-shrink-0">
                                {(o.username || o.email || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-[13px] font-medium">{o.username || "Зочин"}</p>
                                  <span className="text-[11px] font-mono text-neutral-600">#{o.id.slice(-6).toUpperCase()}</span>
                                </div>
                                <p className="text-[11px] text-neutral-500">{o.email || o.phone} · {new Date(o.createdAt).toLocaleDateString("mn-MN")}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="hidden sm:flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${cfg?.dot}`} />
                                <span className={`text-[11px] font-medium ${cfg?.color}`}>{cfg?.label}</span>
                              </div>
                              <p className="text-[14px] font-semibold">{o.total.toLocaleString()}₮</p>
                              <span className="text-neutral-600 text-[12px]">{isOpen ? "▲" : "▼"}</span>
                            </div>
                          </div>
                          {isOpen && (
                            <div className="border-t border-neutral-800 p-4 space-y-4">
                              <div className="space-y-2">
                                {o.items.map((item: any, j: number) => (
                                  <div key={j} className="flex items-center gap-3">
                                    {item.picture && <img src={item.picture} alt={item.name} className="w-10 h-10 object-contain bg-neutral-800 rounded-lg" />}
                                    <div className="flex-1">
                                      <p className="text-[13px] font-medium">{item.name}</p>
                                      <p className="text-[11px] text-neutral-500">× {item.qty} · ${item.price.toLocaleString()}</p>
                                    </div>
                                    <p className="text-[13px] font-semibold">${(item.price * item.qty).toLocaleString()}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-[12px]">
                                <div className="bg-neutral-800/50 rounded-xl p-3">
                                  <p className="text-neutral-500 mb-1">Хаяг</p>
                                  <p className="text-neutral-200">{o.address}</p>
                                </div>
                                <div className="bg-neutral-800/50 rounded-xl p-3">
                                  <p className="text-neutral-500 mb-1">Төлбөр</p>
                                  <p className="text-neutral-200">{PAY[o.paymentMethod] || o.paymentMethod}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-[11px] text-neutral-500 mb-2">Төлөв өөрчлөх</p>
                                <div className="flex gap-2 flex-wrap">
                                  {Object.entries(STATUS).map(([key, cfg]) => (
                                    <button key={key} onClick={() => handleStatus(o.id, key)}
                                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                                        o.status === key ? `${cfg.bg} ${cfg.color} border-current` : "bg-neutral-800 text-neutral-500 border-neutral-700 hover:border-neutral-500"
                                      }`}>
                                      {cfg.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* USERS */}
            {tab === "users" && (
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-800">
                  <h3 className="text-[14px] font-medium text-neutral-300">Бүртгэлтэй хэрэглэгчид</h3>
                </div>
                {usersLoading ? (
                  <div className="p-5 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-12 bg-neutral-800 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800">
                    {users.map((u: any) => {
                      const userOrders = orders.filter((o: any) => o.phone === u.phoneNumber || o.userId === u._id);
                      return (
                        <div key={u._id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors">
                          <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-[13px] font-medium text-neutral-400 flex-shrink-0">
                            {u.username[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium">{u.username}</p>
                            <p className="text-[12px] text-neutral-500">{u.phoneNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[13px] font-medium">{userOrders.length} захиалга</p>
                            <p className="text-[11px] text-neutral-500">{userOrders.reduce((s: number, o: any) => s + o.total, 0).toLocaleString()}₮</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-semibold">Бүтээгдэхүүн нэмэх</h2>
              <button onClick={() => { setShowAddModal(false); setAddForm(EMPTY_FORM); }}
                className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors flex items-center justify-center text-[14px]">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-500 mb-1 block">Төрөл *</label>
                <select
                  value={addForm.category}
                  onChange={e => setAddForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl bg-neutral-800 border border-neutral-700 text-[13px] text-white outline-none focus:border-neutral-500"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {[
                { key: "name",    label: "Нэр *",        placeholder: "Бүтээгдэхүүний нэр" },
                { key: "price",   label: "Үнэ ($) *",    placeholder: "1199" },
                { key: "chip",    label: "Чип",           placeholder: "A18 Pro" },
                { key: "year",    label: "Жил",           placeholder: "2024" },
                { key: "picture", label: "Зургийн URL",   placeholder: "https://..." },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[11px] text-neutral-500 mb-1 block">{field.label}</label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={(addForm as any)[field.key]}
                    onChange={e => setAddForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-neutral-800 border border-neutral-700 text-[13px] text-white placeholder-neutral-600 outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>
              ))}

              {/* Preview */}
              {addForm.picture && (
                <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl">
                  <img src={addForm.picture} alt="preview" className="w-12 h-12 object-contain rounded-lg bg-neutral-700" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div>
                    <p className="text-[12px] font-medium text-white">{addForm.name || "Нэр оруулна уу"}</p>
                    <p className="text-[11px] text-neutral-400">{addForm.price ? `$${Number(addForm.price).toLocaleString()}` : ""}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowAddModal(false); setAddForm(EMPTY_FORM); }}
                className="flex-1 h-10 rounded-xl border border-neutral-700 text-neutral-400 text-[13px] hover:border-neutral-500 transition-all"
              >
                Цуцлах
              </button>
              <button
                onClick={handleAdd}
                disabled={!addForm.name || !addForm.price || addLoading}
                className="flex-1 h-10 rounded-xl bg-white text-neutral-900 text-[13px] font-semibold hover:bg-neutral-100 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {addLoading ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : "Нэмэх"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ApolloProvider client={client}>
      <Dashboard />
    </ApolloProvider>
  );
}