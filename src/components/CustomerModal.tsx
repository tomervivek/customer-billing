import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { UseFormRegister, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Address } from "../types";
import { customerSchema, type CustomerField, type CustomerForm } from "../schemas";
import { getCustomers } from "../storage";

const emptyAddress: Address = {
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

type CustomerModalProps = {
  onClose: () => void;
  onSave: (data: CustomerForm) => Promise<void>;
  onError: (message: string) => void;
};

export function CustomerModal({ onClose, onSave, onError }: CustomerModalProps) {
  const [step, setStep] = useState(0);
  const [sameAddress, setSameAddress] = useState(true);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const form = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      billingAddress: emptyAddress,
      shippingAddress: emptyAddress,
    },
  });
  const billingAddress = useWatch({
    control: form.control,
    name: "billingAddress",
  });

  useEffect(() => {
    if (sameAddress) {
      form.setValue("shippingAddress", billingAddress, { shouldValidate: false });
    }
  }, [billingAddress, form.setValue, sameAddress]);

  async function continueForm() {
    form.clearErrors("email");
    let fields: CustomerField[] = [];

    if (step === 0) {
      fields = ["name", "email", "phone"];
    } else if (step === 1) {
      fields = [
        "billingAddress.street",
        "billingAddress.city",
        "billingAddress.state",
        "billingAddress.postalCode",
        "billingAddress.country",
      ];
      if (!sameAddress) {
        fields.push(
          "shippingAddress.street",
          "shippingAddress.city",
          "shippingAddress.state",
          "shippingAddress.postalCode",
          "shippingAddress.country",
        );
      }
    }

    if (fields.length && !(await form.trigger(fields))) return;
    if (step === 0) {
      const email = form.getValues("email").trim().toLowerCase();
      if (email) {
        setIsCheckingEmail(true);
        try {
          const customers = await getCustomers();
          if (customers.some((customer) => customer.email.toLowerCase() === email)) {
            form.setError("email", {
              type: "validate",
              message: "A customer with this email already exists",
            });
            setIsCheckingEmail(false);
            return;
          }
        } catch {
          onError("Could not check whether this email is already in use.");
          setIsCheckingEmail(false);
          return;
        }
        setIsCheckingEmail(false);
      }
    }
    setStep((current) => Math.min(current + 1, 2));
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="customer-modal" role="dialog" aria-modal="true" aria-labelledby="customer-modal-title">
        <div className="modal-heading">
          <div><div className="eyebrow">NEW CUSTOMER</div><h2 id="customer-modal-title">Add a customer</h2></div>
          <button className="close-button" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className="step-track">
          {["Personal", "Addresses", "Review"].map((label, index) => (
            <div className={index <= step ? "step active" : "step"} key={label}>
              <span>{index < step ? "✓" : index + 1}</span><small>{label}</small>
            </div>
          ))}
        </div>

        {step === 0 && <PersonalStep form={form} />}
        {step === 1 && (
          <AddressStep
            form={form}
            sameAddress={sameAddress}
            onSameAddressChange={setSameAddress}
          />
        )}
        {step === 2 && <ReviewStep form={form} />}

        <div className="modal-footer">
          {step > 0
            ? <button className="button secondary" onClick={() => setStep((current) => current - 1)}>Back</button>
            : <button className="button secondary" onClick={onClose}>Cancel</button>}
          {step < 2 ? (
            <button
              className="button primary"
              onClick={() => void continueForm()}
              disabled={form.formState.isValidating || isCheckingEmail}
            >
              {isCheckingEmail ? "Checking email…" : <>Continue <span>→</span></>}
            </button>
          ) : (
            <button
              className="button primary"
              onClick={form.handleSubmit(onSave)}
              disabled={form.formState.isSubmitting}
            >
              Save customer
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

type CustomerFormMethods = UseFormReturn<CustomerForm>;

function PersonalStep({ form }: { form: CustomerFormMethods }) {
  return (
    <div className="step-content">
      <h3>Personal information</h3>
      <p>Add the customer's name and at least one way to contact them.</p>
      <label className="field">
        <span>Full name <b>*</b></span>
        <input {...form.register("name")} placeholder="e.g. Alex Morgan" autoFocus />
        {form.formState.errors.name && <small className="field-error">{form.formState.errors.name.message}</small>}
      </label>
      <label className="field">
        <span>Email address</span>
        <input
          {...form.register("email", { onChange: () => form.clearErrors("email") })}
          type="email"
          placeholder="alex@company.com"
        />
        {form.formState.errors.email && <small className="field-error">{form.formState.errors.email.message}</small>}
      </label>
      <label className="field">
        <span>Phone number</span>
        <input {...form.register("phone")} type="tel" placeholder="+1 (555) 000-0000" />
        {form.formState.errors.phone && <small className="field-error">{form.formState.errors.phone.message}</small>}
      </label>
      <p className="field-hint">Email or phone is required. If you enter an email, a phone number is optional.</p>
    </div>
  );
}

function AddressStep({
  form,
  sameAddress,
  onSameAddressChange,
}: {
  form: CustomerFormMethods;
  sameAddress: boolean;
  onSameAddressChange: (same: boolean) => void;
}) {
  return (
    <div className="step-content address-step">
      <h3>Address information</h3>
      <p>Add billing and shipping addresses for this customer.</p>
      <h4>Billing address</h4>
      <AddressFields prefix="billingAddress" register={form.register} errors={form.formState.errors} />
      <label className="copy-toggle">
        <input
          type="checkbox"
          checked={sameAddress}
          onChange={(event) => onSameAddressChange(event.target.checked)}
        />
        <span>Shipping address is the same as billing</span>
      </label>
      {!sameAddress && (
        <>
          <h4>Shipping address</h4>
          <AddressFields prefix="shippingAddress" register={form.register} errors={form.formState.errors} />
        </>
      )}
    </div>
  );
}

function ReviewStep({ form }: { form: CustomerFormMethods }) {
  const values = form.getValues();
  return (
    <div className="step-content review-step">
      <h3>Review customer</h3>
      <p>Check the details before saving this customer.</p>
      <div className="review-block">
        <span>PERSONAL INFORMATION</span>
        <strong>{values.name}</strong>
        <small>{values.email || "No email"} · {values.phone || "No phone"}</small>
      </div>
      <div className="review-columns">
        <AddressReview title="BILLING ADDRESS" address={values.billingAddress} />
        <AddressReview title="SHIPPING ADDRESS" address={values.shippingAddress} />
      </div>
    </div>
  );
}

function AddressReview({ title, address }: { title: string; address: Address }) {
  return (
    <div className="review-block">
      <span>{title}</span>
      <strong>{address.street}</strong>
      <small>
        {address.city}, {address.state} {address.postalCode}<br />{address.country}
      </small>
    </div>
  );
}

type AddressPrefix = "billingAddress" | "shippingAddress";

function AddressFields({
  prefix,
  register,
  errors,
}: {
  prefix: AddressPrefix;
  register: UseFormRegister<CustomerForm>;
  errors: CustomerFormMethods["formState"]["errors"];
}) {
  const fields: { key: keyof Address; label: string; placeholder: string }[] = [
    { key: "street", label: "Street address", placeholder: "Street and number" },
    { key: "city", label: "City", placeholder: "City" },
    { key: "state", label: "State / region", placeholder: "State or region" },
    { key: "postalCode", label: "Postal code", placeholder: "Postal code" },
    { key: "country", label: "Country", placeholder: "Country" },
  ];

  return (
    <div className="address-grid">
      {fields.map((field) => {
        const path = `${prefix}.${field.key}` as const;
        const error = errors[prefix]?.[field.key]?.message;
        return (
          <label className={`field ${field.key === "street" ? "wide" : ""}`} key={field.key}>
            <span>{field.label} <b>*</b></span>
            <input {...register(path)} placeholder={field.placeholder} />
            {error && <small className="field-error">{error}</small>}
          </label>
        );
      })}
    </div>
  );
}
