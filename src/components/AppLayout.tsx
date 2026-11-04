import type { ReactNode } from "react";
import type { Invoice } from "../types";
import { formatCurrency } from "../utils";

export type AppTab = "customers" | "invoices";

type AppLayoutProps = {
  activeTab: AppTab;
  customerCount: number;
  invoices: Invoice[];
  onTabChange: (tab: AppTab) => void;
  children: ReactNode;
};

export function AppLayout({
  activeTab,
  customerCount,
  invoices,
  onTabChange,
  children,
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        customerCount={customerCount}
        invoiceCount={invoices.length}
        onTabChange={onTabChange}
      />
      <main className="main-content">
        <TopBar activeTab={activeTab} />
        {children}
      </main>
    </div>
  );
}

function Sidebar({
  activeTab,
  customerCount,
  invoiceCount,
  onTabChange,
}: {
  activeTab: AppTab;
  customerCount: number;
  invoiceCount: number;
  onTabChange: (tab: AppTab) => void;
}) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#" aria-label="Quantic home">
        <span className="brand-mark">q</span>
        <span>quantic</span>
      </a>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        <button
          className={activeTab === "customers" ? "nav-link active" : "nav-link"}
          onClick={() => onTabChange("customers")}
        >
          <span className="nav-icon">◉</span> Customers
          <span className="nav-count">{customerCount}</span>
        </button>
        <button
          className={activeTab === "invoices" ? "nav-link active" : "nav-link"}
          onClick={() => onTabChange("invoices")}
        >
          <span className="nav-icon">▤</span> Invoices
          <span className="nav-count">{invoiceCount}</span>
        </button>
      </nav>
      <div className="sidebar-bottom">
        <div className="avatar">JD</div>
        <div><strong>Jamie Davis</strong><small>Workspace owner</small></div>
        <span className="more-icon">···</span>
      </div>
    </aside>
  );
}

function TopBar({ activeTab }: { activeTab: AppTab }) {
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        Workspace <span>/</span> {activeTab === "customers" ? "Customers" : "Invoices"}
      </div>
      <div className="topbar-right">
        <span className="local-badge"><span /> Saved on this device</span>
        <div className="avatar small">JD</div>
      </div>
    </header>
  );
}

export function PageHeading({
  activeTab,
  onAddCustomer,
}: {
  activeTab: AppTab;
  onAddCustomer: () => void;
}) {
  return (
    <section className="page-heading">
      <div>
        <div className="eyebrow">YOUR BUSINESS</div>
        <h1>{activeTab === "customers" ? "Customers" : "Invoices"}</h1>
        <p>Manage your customers and keep billing running smoothly.</p>
      </div>
      <button className="button primary" onClick={onAddCustomer}>
        <span>＋</span> Add customer
      </button>
    </section>
  );
}

export function SummaryCards({
  customerCount,
  invoices,
}: {
  customerCount: number;
  invoices: Invoice[];
}) {
  const outstanding = invoices
    .filter((invoice) => invoice.status === "Unpaid")
    .reduce((total, invoice) => total + invoice.total, 0);

  return (
    <section className="stats-grid" aria-label="Summary">
      <article className="stat-card">
        <div className="stat-top"><span>Total customers</span><span className="stat-icon purple">◉</span></div>
        <strong>{customerCount}</strong><small>In your workspace</small>
      </article>
      <article className="stat-card">
        <div className="stat-top"><span>Total invoices</span><span className="stat-icon blue">▤</span></div>
        <strong>{invoices.length}</strong><small>Across all customers</small>
      </article>
      <article className="stat-card">
        <div className="stat-top"><span>Outstanding</span><span className="stat-icon orange">$</span></div>
        <strong>{formatCurrency(outstanding)}</strong><small>Unpaid invoices</small>
      </article>
    </section>
  );
}
