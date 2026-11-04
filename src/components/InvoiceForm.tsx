import { useState } from "react";
import type { Customer, Invoice, InvoiceItem } from "../types";
import { invoiceSchema } from "../schemas";
import { formatCurrency } from "../utils";

const today = new Date().toISOString().slice(0, 10);
const makeItem = (): InvoiceItem => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: 1,
  price: 0,
});

type InvoiceFormProps = {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (id: string) => void;
  onCreateInvoice: (invoice: Invoice) => Promise<void>;
};

export function InvoiceForm({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onCreateInvoice,
}: InvoiceFormProps) {
  const [items, setItems] = useState<InvoiceItem[]>([makeItem()]);
  const [date, setDate] = useState(today);
  const [dueDate, setDueDate] = useState(today);
  const [error, setError] = useState("");
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  function updateItem(id: string, field: keyof InvoiceItem, value: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === "quantity" || field === "price" ? Number(value) || 0 : value,
            }
          : item,
      ),
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedCustomerId) {
      setError("Select a customer before creating an invoice.");
      return;
    }

    const result = invoiceSchema.safeParse({ date, dueDate, items });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check the invoice details.");
      return;
    }

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      customerId: selectedCustomerId,
      ...result.data,
      total: result.data.items.reduce((sum, item) => sum + item.quantity * item.price, 0),
      status: "Unpaid",
    };

    try {
      await onCreateInvoice(invoice);
      setItems([makeItem()]);
      setDate(today);
      setDueDate(today);
    } catch {
      setError("Could not save this invoice. Please try again.");
    }
  }

  return (
    <section className="content-card create-invoice">
      <div className="section-heading">
        <div><h2>Create an invoice</h2><p>Create a new invoice for one of your customers.</p></div>
      </div>
      <form onSubmit={submit}>
        <div className="invoice-form-grid">
          <label className="field">
            <span>Customer</span>
            <select
              value={selectedCustomerId}
              onChange={(event) => onSelectCustomer(event.target.value)}
              disabled={!customers.length}
            >
              {customers.length === 0
                ? <option value="">Add a customer first</option>
                : customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
            </select>
          </label>
          <label className="field">
            <span>Invoice date</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="field">
            <span>Due date</span>
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>
        </div>
        <div className="items-header">
          <h3>Items</h3><span>{items.length} {items.length === 1 ? "item" : "items"}</span>
        </div>
        <div className="item-head">
          <span>DESCRIPTION</span><span>QTY</span><span>PRICE</span><span>AMOUNT</span><span></span>
        </div>
        {items.map((item) => (
          <div className="item-row" key={item.id}>
            <input
              aria-label="Item description"
              placeholder="e.g. Design services"
              value={item.description}
              onChange={(event) => updateItem(item.id, "description", event.target.value)}
            />
            <input
              aria-label="Item quantity"
              type="number"
              min="1"
              value={item.quantity}
              onChange={(event) => updateItem(item.id, "quantity", event.target.value)}
            />
            <label className="price-input">
              <span>$</span>
              <input
                aria-label="Item price"
                type="number"
                min="0"
                step="0.01"
                value={item.price}
                onChange={(event) => updateItem(item.id, "price", event.target.value)}
              />
            </label>
            <strong className="line-total">{formatCurrency(item.quantity * item.price)}</strong>
            <button
              type="button"
              className="remove-item"
              aria-label="Remove item"
              disabled={items.length === 1}
              onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className="add-item" onClick={() => setItems((current) => [...current, makeItem()])}>
          ＋ Add line item
        </button>
        <div className="invoice-bottom">
          <div className="invoice-note">Invoices are stored locally in this browser.</div>
          <div className="invoice-total"><span>Total due</span><strong>{formatCurrency(total)}</strong></div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-footer">
          <span>Payment status will be set to unpaid.</span>
          <button className="button primary" type="submit" disabled={!customers.length}>
            Create invoice <span>→</span>
          </button>
        </div>
      </form>
    </section>
  );
}
