import React, { FormEvent, useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import "./App.css";

type ExpenseFormState = {
  userId: string;
  amount: string;
  categoryId: string;
  expenseDate: string;
  note: string;
};

type ExpenseItem = {
  id: number;
  userId: number;
  categoryId: number | null;
  categoryName: string | null;
  amount: string;
  expenseDate: string;
  note: string | null;
  createdAt: string;
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const categoryColors = [
  "#ff8a65",
  "#4db6ac",
  "#7986cb",
  "#ba68c8",
  "#81c784",
  "#ffd54f",
  "#90a4ae",
];

function App() {
  const [form, setForm] = useState<ExpenseFormState>(defaultForm);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
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

  const fetchExpenses = async (targetUserId?: string) => {
    const userId = targetUserId ?? form.userId;
    if (!userId.trim() || Number(userId) <= 0) {
      setErrorMessage("User ID 必須為正整數。");
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      setErrorMessage("開始日期不能遲於結束日期。");
      return;
    }

    try {
      setErrorMessage("");
      setIsLoadingList(true);
      const params = new URLSearchParams({
        userId: String(userId),
      });

      if (startDate) {
        params.set("startDate", startDate);
      }

      if (endDate) {
        params.set("endDate", endDate);
      }

      const response = await fetch(`${apiBaseUrl}/api/expenses?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "讀取支出列表失敗");
      }

      setExpenses(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "未知錯誤");
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!window.confirm("確定刪除這筆支出？")) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/expenses/${expenseId}?userId=${encodeURIComponent(form.userId)}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "刪除支出失敗");
      }

      setSuccessMessage(`已刪除支出 #${expenseId}`);
      setExpenses((prev) => prev.filter((item) => item.id !== expenseId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "未知錯誤");
    }
  };

  const filteredExpenses = useMemo(() => {
    if (!categoryFilter) {
      return expenses;
    }

    return expenses.filter(
      (item) => String(item.categoryId ?? "") === categoryFilter
    );
  }, [expenses, categoryFilter]);

  const pieChartData = useMemo(() => {
    const totalsByCategory = new Map<string, number>();

    filteredExpenses.forEach((item) => {
      const label = item.categoryName || "未分類";
      const amount = Number(item.amount) || 0;
      totalsByCategory.set(label, (totalsByCategory.get(label) || 0) + amount);
    });

    const labels = Array.from(totalsByCategory.keys());
    const values = labels.map((label) => totalsByCategory.get(label) || 0);

    return {
      labels,
      datasets: [
        {
          label: "Category Total",
          data: values,
          backgroundColor: labels.map(
            (_, index) => categoryColors[index % categoryColors.length]
          ),
          borderWidth: 1,
        },
      ],
    };
  }, [filteredExpenses]);

  const barChartData = useMemo(() => {
    const totalsByDate = new Map<string, number>();

    filteredExpenses.forEach((item) => {
      const key = item.expenseDate;
      const amount = Number(item.amount) || 0;
      totalsByDate.set(key, (totalsByDate.get(key) || 0) + amount);
    });

    const labels = Array.from(totalsByDate.keys()).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
    const values = labels.map((label) => totalsByDate.get(label) || 0);

    return {
      labels,
      datasets: [
        {
          label: "Daily Expense",
          data: values,
          backgroundColor: "#2563eb",
          borderRadius: 4,
        },
      ],
    };
  }, [filteredExpenses]);

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
      await fetchExpenses(form.userId);
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
        <p className="subtitle">新增支出 + 列表篩選（Part 8）</p>

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

        <div className="list-toolbar">
          <button
            type="button"
            onClick={() => fetchExpenses()}
            disabled={isLoadingList}
            className="secondary-btn"
          >
            {isLoadingList ? "載入中..." : "載入支出列表"}
          </button>

          <label className="filter-label">
            類別篩選
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">全部</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="date-toolbar">
          <label className="filter-label">
            開始日期
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label className="filter-label">
            結束日期
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
        </div>

        <div className="expense-list">
          {filteredExpenses.length === 0 ? (
            <p className="empty-text">未有符合條件的支出記錄。</p>
          ) : (
            filteredExpenses.map((item) => (
              <article key={item.id} className="expense-item">
                <div>
                  <p className="expense-top">
                    <strong>${Number(item.amount).toFixed(2)}</strong>
                    <span>{item.categoryName || "未分類"}</span>
                  </p>
                  <p className="expense-sub">
                    {item.expenseDate} {item.note ? `· ${item.note}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => handleDeleteExpense(item.id)}
                >
                  刪除
                </button>
              </article>
            ))
          )}
        </div>

        <div className="charts">
          <h2 className="chart-title">支出圖表</h2>
          {filteredExpenses.length === 0 ? (
            <p className="empty-text">載入支出後會顯示圖表。</p>
          ) : (
            <div className="chart-grid">
              <div className="chart-card">
                <h3>按日期支出（柱狀圖）</h3>
                <Bar
                  data={barChartData}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>

              <div className="chart-card">
                <h3>類別分佈（圓形圖）</h3>
                <Pie
                  data={pieChartData}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {errorMessage ? <p className="message error">{errorMessage}</p> : null}
        {successMessage ? <p className="message success">{successMessage}</p> : null}
      </section>
    </main>
  );
}

export default App;
