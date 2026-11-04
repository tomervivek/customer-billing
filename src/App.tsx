import { useEffect, useMemo, useState } from "react";
import { AppLayout, PageHeading, SummaryCards } from "./components/AppLayout";
import { CustomerDirectory } from "./components/CustomerDirectory";
import { CustomerModal } from "./components/CustomerModal";
import { InvoiceForm } from "./components/InvoiceForm";
import type { AppTab } from "./components/AppLayout";
import type { Customer, Invoice } from "./types";
import type { CustomerForm } from "./schemas";
import { getCustomers, getInvoices, saveCustomers, saveInvoices } from "./storage";

function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [activeTab, setActiveTab] = useState<AppTab>("customers");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "name">("newest");
  const [page, setPage] = useState(1);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  useEffect(() => {
    Promise.all([getCustomers(), getInvoices()])
      .then(([storedCustomers, storedInvoices]) => {
        setCustomers(storedCustomers);
        setInvoices(storedInvoices);
        setSelectedCustomerId(storedCustomers[0]?.id ?? "");
      })
      .catch(() => setStorageError("Could not load saved data from this browser."))
      .finally(() => setLoading(false));
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customers
      .filter(
        (customer) =>
          !query ||
          customer.name.toLowerCase().includes(query) ||
          customer.email.toLowerCase().includes(query) ||
          customer.phone.toLowerCase().includes(query),
      )
      .sort((a, b) =>
        sortBy === "name"
          ? a.name.localeCompare(b.name)
          : b.createdAt.localeCompare(a.createdAt),
      );
  }, [customers, search, sortBy]);

  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const visibleCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);

  async function createCustomer(data: CustomerForm) {
    const customer: Customer = {
      ...data,
      id: crypto.randomUUID(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [customer, ...customers];
    try {
      await saveCustomers(updated);
      setCustomers(updated);
      setSelectedCustomerId(customer.id);
      setShowCustomerForm(false);
      setActiveTab("customers");
      setSavedMessage("Customer added successfully.");
    } catch {
      setStorageError("Could not save this customer. Please try again.");
    }
  }

  async function createInvoice(invoice: Invoice) {
    const updated = [invoice, ...invoices];
    await saveInvoices(updated);
    setInvoices(updated);
    setSavedMessage("Invoice created successfully.");
  }

  async function toggleInvoiceStatus(invoice: Invoice) {
    const updated = invoices.map((item) =>
      item.id === invoice.id
        ? { ...item, status: item.status === "Paid" ? "Unpaid" as const : "Paid" as const }
        : item,
    );
    try {
      await saveInvoices(updated);
      setInvoices(updated);
    } catch {
      setStorageError("Could not update the invoice status. Please try again.");
    }
  }

  function showInvoices(customerId: string) {
    setSelectedCustomerId(customerId);
    setActiveTab("invoices");
  }

  if (loading) {
    return <main className="loading-screen">Loading your workspace…</main>;
  }

  return (
    <AppLayout
      activeTab={activeTab}
      customerCount={customers.length}
      invoices={invoices}
      onTabChange={setActiveTab}
    >
      <div className="page-content">
        {storageError && <div className="alert error" role="alert">{storageError}</div>}
        {savedMessage && <div className="alert success" role="status">{savedMessage}</div>}

        <PageHeading activeTab={activeTab} onAddCustomer={() => setShowCustomerForm(true)} />
        <SummaryCards customerCount={customers.length} invoices={invoices} />
        <CustomerDirectory
          activeTab={activeTab}
          customers={customers}
          invoices={invoices}
          selectedCustomerId={selectedCustomerId}
          visibleCustomers={visibleCustomers}
          filteredCount={filteredCustomers.length}
          page={page}
          pageCount={pageCount}
          search={search}
          sortBy={sortBy}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onSort={setSortBy}
          onPageChange={setPage}
          onSelectCustomer={setSelectedCustomerId}
          onShowInvoices={showInvoices}
          onToggleInvoice={(invoice) => void toggleInvoiceStatus(invoice)}
          onAddCustomer={() => setShowCustomerForm(true)}
        />
        <InvoiceForm
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={setSelectedCustomerId}
          onCreateInvoice={createInvoice}
        />
      </div>

      {showCustomerForm && (
        <CustomerModal
          onClose={() => setShowCustomerForm(false)}
          onSave={createCustomer}
          onError={setStorageError}
        />
      )}
    </AppLayout>
  );
}

export default App;
