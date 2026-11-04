import localforage from "localforage";
import type { Customer, Invoice } from "./types";

const database = localforage.createInstance({
  name: "quantic-billing",
  storeName: "customer_data",
});

export async function getCustomers(): Promise<Customer[]> {
  return (await database.getItem<Customer[]>("customers")) ?? [];
}

export async function saveCustomers(customers: Customer[]): Promise<void> {
  await database.setItem("customers", customers);
}

export async function getInvoices(): Promise<Invoice[]> {
  return (await database.getItem<Invoice[]>("invoices")) ?? [];
}

export async function saveInvoices(invoices: Invoice[]): Promise<void> {
  await database.setItem("invoices", invoices);
}
