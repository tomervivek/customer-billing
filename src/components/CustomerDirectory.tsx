import type { Customer, Invoice } from "../types";
import type { AppTab } from "./AppLayout";
import { formatCurrency, getInitials } from "../utils";

type CustomerDirectoryProps = {
  activeTab: AppTab;
  customers: Customer[];
  invoices: Invoice[];
  selectedCustomerId: string;
  visibleCustomers: Customer[];
  filteredCount: number;
  page: number;
  pageCount: number;
  search: string;
  sortBy: "newest" | "name";
  onSearch: (value: string) => void;
  onSort: (value: "newest" | "name") => void;
  onPageChange: (page: number) => void;
  onSelectCustomer: (id: string) => void;
  onShowInvoices: (customerId: string) => void;
  onToggleInvoice: (invoice: Invoice) => void;
  onAddCustomer: () => void;
};

export function CustomerDirectory(props: CustomerDirectoryProps) {
  const {
    activeTab,
    customers,
    invoices,
    selectedCustomerId,
    visibleCustomers,
    filteredCount,
    page,
    pageCount,
    search,
    sortBy,
    onSearch,
    onSort,
    onPageChange,
    onSelectCustomer,
    onShowInvoices,
    onToggleInvoice,
    onAddCustomer,
  } = props;
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
  const customerInvoices = invoices
    .filter((invoice) => invoice.customerId === selectedCustomerId)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section className="content-card">
      <div className="section-heading">
        <div>
          <h2>{activeTab === "customers" ? "Customer directory" : "Customer invoices"}</h2>
          <p>
            {activeTab === "customers"
              ? `${customers.length} ${customers.length === 1 ? "customer" : "customers"} in your directory`
              : selectedCustomer
                ? `Invoices for ${selectedCustomer.name}`
                : "Select a customer to view their invoices"}
          </p>
        </div>
        {activeTab === "customers" ? (
          <CustomerFilters
            search={search}
            sortBy={sortBy}
            onSearch={onSearch}
            onSort={onSort}
          />
        ) : customers.length > 0 ? (
          <select
            className="sort-select customer-select"
            aria-label="Select customer"
            value={selectedCustomerId}
            onChange={(event) => onSelectCustomer(event.target.value)}
          >
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        ) : null}
      </div>

      {activeTab === "customers" ? (
        customers.length === 0 ? (
          <EmptyState
            icon="◉"
            title="No customers yet"
            description="Add your first customer to get started with billing."
            action="Add your first customer"
            onAction={onAddCustomer}
          />
        ) : visibleCustomers.length === 0 ? (
          <div className="empty-state compact">
            <h3>No matching customers</h3>
            <p>Try a different name, email, or phone number.</p>
          </div>
        ) : (
          <CustomerTable
            customers={visibleCustomers}
            invoices={invoices}
            selectedCustomerId={selectedCustomerId}
            filteredCount={filteredCount}
            page={page}
            pageCount={pageCount}
            onPageChange={onPageChange}
            onShowInvoices={onShowInvoices}
          />
        )
      ) : customers.length === 0 ? (
        <EmptyState
          icon="▤"
          title="No customers to bill"
          description="Add a customer before creating an invoice."
          action="Add customer"
          onAction={onAddCustomer}
        />
      ) : (
        <InvoiceList invoices={customerInvoices} onToggleInvoice={onToggleInvoice} />
      )}
    </section>
  );
}

function CustomerFilters({
  search,
  sortBy,
  onSearch,
  onSort,
}: {
  search: string;
  sortBy: "newest" | "name";
  onSearch: (value: string) => void;
  onSort: (value: "newest" | "name") => void;
}) {
  return (
    <div className="table-actions">
      <label className="search-box">
        <span>⌕</span>
        <input
          aria-label="Search customers"
          placeholder="Search customers"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </label>
      <select
        className="sort-select"
        aria-label="Sort customers"
        value={sortBy}
        onChange={(event) => onSort(event.target.value as "newest" | "name")}
      >
        <option value="newest">Newest first</option>
        <option value="name">Name A–Z</option>
      </select>
    </div>
  );
}

function CustomerTable({
  customers,
  invoices,
  selectedCustomerId,
  filteredCount,
  page,
  pageCount,
  onPageChange,
  onShowInvoices,
}: {
  customers: Customer[];
  invoices: Invoice[];
  selectedCustomerId: string;
  filteredCount: number;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onShowInvoices: (customerId: string) => void;
}) {
  return (
    <>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>CUSTOMER</th><th>CONTACT</th><th>LOCATION</th><th>INVOICES</th><th></th></tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => {
              const count = invoices.filter((invoice) => invoice.customerId === customer.id).length;
              return (
                <tr
                  key={customer.id}
                  className={selectedCustomerId === customer.id ? "selected-row" : ""}
                >
                  <td>
                    <button className="customer-name" onClick={() => onShowInvoices(customer.id)}>
                      <span className={`customer-avatar tone-${index % 5}`}>
                        {getInitials(customer.name)}
                      </span>
                      <span>
                        <strong>{customer.name}</strong>
                        <small>Added {new Date(customer.createdAt).toLocaleDateString()}</small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <span className="contact-main">{customer.email || "No email"}</span>
                    <small className="contact-sub">{customer.phone || "No phone"}</small>
                  </td>
                  <td>
                    <span className="contact-main">
                      {customer.billingAddress.city}, {customer.billingAddress.state}
                    </span>
                    <small className="contact-sub">{customer.billingAddress.country}</small>
                  </td>
                  <td>
                    <span className="invoice-count">{count} {count === 1 ? "invoice" : "invoices"}</span>
                  </td>
                  <td>
                    <button
                      className="row-action"
                      aria-label={`View invoices for ${customer.name}`}
                      onClick={() => onShowInvoices(customer.id)}
                    >
                      →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span>
          Showing {Math.min((page - 1) * 5 + 1, filteredCount)}–{Math.min(page * 5, filteredCount)} of {filteredCount}
        </span>
        <div>
          <button disabled={page === 1} onClick={() => onPageChange(page - 1)}>Previous</button>
          <span className="page-number">{page} / {pageCount}</span>
          <button disabled={page === pageCount} onClick={() => onPageChange(page + 1)}>Next</button>
        </div>
      </div>
    </>
  );
}

function InvoiceList({
  invoices,
  onToggleInvoice,
}: {
  invoices: Invoice[];
  onToggleInvoice: (invoice: Invoice) => void;
}) {
  if (invoices.length === 0) {
    return (
      <div className="empty-state compact">
        <div className="empty-icon">▤</div>
        <h3>No invoices yet</h3>
        <p>Create an invoice below to see it here.</p>
      </div>
    );
  }

  return (
    <div className="invoice-list">
      {invoices.map((invoice) => (
        <article className="invoice-row" key={invoice.id}>
          <div className="invoice-symbol">▤</div>
          <div className="invoice-info">
            <strong>Invoice #{invoice.id.slice(0, 6).toUpperCase()}</strong>
            <small>
              Issued {new Date(`${invoice.date}T00:00:00`).toLocaleDateString()} · Due{" "}
              {new Date(`${invoice.dueDate}T00:00:00`).toLocaleDateString()}
            </small>
          </div>
          <span className={invoice.status === "Paid" ? "status paid" : "status unpaid"}>
            {invoice.status}
          </span>
          <strong className="invoice-amount">{formatCurrency(invoice.total)}</strong>
          <button className="text-button" onClick={() => onToggleInvoice(invoice)}>
            {invoice.status === "Paid" ? "Mark unpaid" : "Mark paid"}
          </button>
        </article>
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: string;
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="button primary" onClick={onAction}>{action}</button>
    </div>
  );
}
