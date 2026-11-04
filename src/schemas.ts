import { z } from "zod";

const addressSchema = z.object({
  street: z.string().trim().min(1, "Street address is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State or region is required"),
  postalCode: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().min(1, "Country is required"),
});

export const customerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter the customer's name"),
    email: z.string().trim().email("Enter a valid email address").or(z.literal("")),
    phone: z
      .string()
      .trim()
      .refine(
        (phone) => !phone || /^[+\d().\-\s]{7,20}$/.test(phone),
        "Enter a valid phone number",
      ),
    billingAddress: addressSchema,
    shippingAddress: addressSchema,
  })
  .refine((customer) => customer.email || customer.phone, {
    message: "Add an email address or phone number",
    path: ["email"],
  });

export const invoiceSchema = z
  .object({
    date: z.string().min(1, "Invoice date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    items: z
      .array(
        z.object({
          id: z.string(),
          description: z.string().trim().min(1, "Add an item description"),
          quantity: z.number().int().min(1, "Quantity must be at least one"),
          price: z.number().min(0, "Price cannot be negative"),
        }),
      )
      .min(1, "Add at least one item"),
  })
  .refine((invoice) => invoice.dueDate >= invoice.date, {
    message: "Due date cannot be before invoice date",
    path: ["dueDate"],
  });

export type CustomerForm = z.infer<typeof customerSchema>;
export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export type CustomerField =
  | "name"
  | "email"
  | "phone"
  | "billingAddress.street"
  | "billingAddress.city"
  | "billingAddress.state"
  | "billingAddress.postalCode"
  | "billingAddress.country"
  | "shippingAddress.street"
  | "shippingAddress.city"
  | "shippingAddress.state"
  | "shippingAddress.postalCode"
  | "shippingAddress.country";
