const express = require("express");
const pool = require("../db/pool");

const router = express.Router();

function toPositiveNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function toPositiveInteger(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function isValidDateString(value) {
  if (typeof value !== "string") {
    return false;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseListFilters(query) {
  const userId = toPositiveInteger(query.userId);
  const startDate = query.startDate;
  const endDate = query.endDate;

  if (!userId) {
    return {
      error: {
        status: 400,
        body: {
          error: "Validation Error",
          message: "userId query parameter is required",
        },
      },
    };
  }

  if (startDate && !isValidDateString(startDate)) {
    return {
      error: {
        status: 400,
        body: {
          error: "Validation Error",
          message: "startDate must be in YYYY-MM-DD format",
        },
      },
    };
  }

  if (endDate && !isValidDateString(endDate)) {
    return {
      error: {
        status: 400,
        body: {
          error: "Validation Error",
          message: "endDate must be in YYYY-MM-DD format",
        },
      },
    };
  }

  if (startDate && endDate && startDate > endDate) {
    return {
      error: {
        status: 400,
        body: {
          error: "Validation Error",
          message: "startDate cannot be later than endDate",
        },
      },
    };
  }

  return { userId, startDate, endDate };
}

function buildExpenseListFilterQuery(filters) {
  const whereConditions = ["e.user_id = $1"];
  const values = [filters.userId];

  if (filters.startDate) {
    values.push(filters.startDate);
    whereConditions.push(`e.expense_date >= $${values.length}`);
  }

  if (filters.endDate) {
    values.push(filters.endDate);
    whereConditions.push(`e.expense_date <= $${values.length}`);
  }

  return { whereClause: whereConditions.join(" AND "), values };
}

function escapeCsvValue(value) {
  if (value == null) {
    return "";
  }

  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

router.post("/", async (req, res, next) => {
  try {
    const userId = toPositiveInteger(req.body.userId);
    const rawCategoryId = req.body.categoryId;
    const categoryId = rawCategoryId == null ? null : toPositiveInteger(rawCategoryId);
    const amount = toPositiveNumber(req.body.amount);
    const expenseDate = req.body.expenseDate;
    const note = req.body.note?.trim() || null;
    const hasInvalidCategoryId = rawCategoryId != null && categoryId === null;

    if (!userId || !amount || !expenseDate || hasInvalidCategoryId) {
      return res.status(400).json({
        error: "Validation Error",
        message: "userId, amount, and expenseDate are required with valid values",
      });
    }

    const query = `
      INSERT INTO expenses (user_id, category_id, amount, expense_date, note)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id AS "userId", category_id AS "categoryId", amount, expense_date AS "expenseDate", note, created_at AS "createdAt"
    `;

    const values = [userId, categoryId, amount, expenseDate, note];
    const result = await pool.query(query, values);

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const filters = parseListFilters(req.query);
    if (filters.error) {
      return res.status(filters.error.status).json(filters.error.body);
    }
    const { whereClause, values } = buildExpenseListFilterQuery(filters);

    const query = `
      SELECT
        e.id,
        e.user_id AS "userId",
        e.category_id AS "categoryId",
        c.name AS "categoryName",
        e.amount,
        e.expense_date AS "expenseDate",
        e.note,
        e.created_at AS "createdAt"
      FROM expenses e
      LEFT JOIN categories c ON c.id = e.category_id
      WHERE ${whereClause}
      ORDER BY e.expense_date DESC, e.created_at DESC
    `;

    const result = await pool.query(query, values);
    return res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/export/csv", async (req, res, next) => {
  try {
    const filters = parseListFilters(req.query);
    if (filters.error) {
      return res.status(filters.error.status).json(filters.error.body);
    }

    const { whereClause, values } = buildExpenseListFilterQuery(filters);
    const query = `
      SELECT
        e.id,
        e.user_id AS "userId",
        c.name AS "categoryName",
        e.amount,
        e.expense_date AS "expenseDate",
        e.note,
        e.created_at AS "createdAt"
      FROM expenses e
      LEFT JOIN categories c ON c.id = e.category_id
      WHERE ${whereClause}
      ORDER BY e.expense_date DESC, e.created_at DESC
    `;

    const result = await pool.query(query, values);
    const headers = ["id", "userId", "categoryName", "amount", "expenseDate", "note", "createdAt"];
    const rows = result.rows.map((row) =>
      [
        row.id,
        row.userId,
        row.categoryName || "",
        row.amount,
        row.expenseDate,
        row.note || "",
        row.createdAt,
      ]
        .map(escapeCsvValue)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const dateTag = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="expenses-${dateTag}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const expenseId = toPositiveInteger(req.params.id);
    const userId = toPositiveInteger(req.query.userId);

    if (!expenseId || !userId) {
      return res.status(400).json({
        error: "Validation Error",
        message: "expense id and userId query parameter are required",
      });
    }

    const result = await pool.query(
      `DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id`,
      [expenseId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      message: "Expense deleted",
      id: expenseId,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
