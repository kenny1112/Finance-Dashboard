import React, { FormEvent, useMemo, useState } from "react";
import "./App.css";

type ExpenseFormState = {
  userId: string;
  amount: string;
  categoryId: string;
  expenseDate: string;
  note: string;
};

const defaultForm: ExpenseFormState = {
  userId: "1",
  amount: "",
  categoryId: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  note: "",
};

const categories = [
  { id: 1, name: "Food" },
  { id: 2, name: "Transport" },
  { id: 3, name: "Utilities" },
  { id: 4, name: "Shopping" },
  { id: 5, name: "Health" },
  { id: 6, name: "Entertainment" },
];

function App() {
  const [form, setForm] = useState<ExpenseFormState>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const apiBaseUrl = useMemo(
    () => process.env.REACT_APP_API_URL || "http://localhost:5000",
    []
  );

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!form.userId.trim() || Number(form.userId) <= 0) {
      setErrorMessage("User ID 必須為正整數。");
      return;
    }

    if (!form.amount.trim() || Number(form.amount) <= 0) {
      setErrorMessage("金額必須大於 0。");
      return;
    }

    if (!form.expenseDate) {
      setErrorMessage("請選擇日期。");
      return;
    }

    const payload = {
      userId: Number(form.userId),
      amount: Number(form.amount),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      expenseDate: form.expenseDate,
      note: form.note.trim() || null,
    };

    try {
      setIsSubmitting(true);
      const response = await fetch(`${apiBaseUrl}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "新增支出失敗");
      }

      setSuccessMessage(`成功新增支出 #${data.id}`);
      setForm((prev) => ({
        ...defaultForm,
        userId: prev.userId,
        expenseDate: prev.expenseDate,
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "未知錯誤");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">Finance Dashboard</h1>
        <p className="subtitle">新增支出（Part 5）</p>

        <form className="expense-form" onSubmit={handleSubmit}>
          <label>
            User ID
            <input
              name="userId"
              type="number"
              min="1"
              value={form.userId}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            金額
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="例如 128.50"
              value={form.amount}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            類別
            <select name="categoryId" value={form.categoryId} onChange={handleChange}>
              <option value="">未分類</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            日期
            <input
              name="expenseDate"
              type="date"
              value={form.expenseDate}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            備註
            <textarea
              name="note"
              rows={3}
              placeholder="可選"
              value={form.note}
              onChange={handleChange}
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "送出中..." : "新增支出"}
          </button>
        </form>

        {errorMessage ? <p className="message error">{errorMessage}</p> : null}
        {successMessage ? <p className="message success">{successMessage}</p> : null}
      </section>
    </main>
  );
}

export default App;
