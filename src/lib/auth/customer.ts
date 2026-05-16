import { cookies, headers } from "next/headers";
import pool from "@/src/lib/db";
import { createSecureToken, hashPassword, sha256, verifyPassword } from "@/src/lib/auth/password";
import { ensureAuthSchema } from "@/src/lib/auth/schema";

export const CUSTOMER_SESSION_COOKIE = "kimramen_customer_session";
const CUSTOMER_SESSION_DAYS = 30;

type CustomerRow = {
  id: number;
  email: string | null;
  phone: string | null;
  password_hash: string | null;
  first_name: string | null;
  last_name: string | null;
  default_delivery_name: string | null;
  default_delivery_phone: string | null;
  default_delivery_city: string | null;
  default_delivery_street: string | null;
  default_delivery_house: string | null;
  default_delivery_apartment: string | null;
  default_delivery_comment: string | null;
  is_active: number | boolean;
};

type CustomerSessionRow = {
  id: number;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  defaultDeliveryName: string | null;
  defaultDeliveryPhone: string | null;
  defaultDeliveryCity: string | null;
  defaultDeliveryStreet: string | null;
  defaultDeliveryHouse: string | null;
  defaultDeliveryApartment: string | null;
  defaultDeliveryComment: string | null;
};

export type CurrentCustomer = {
  id: number;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  defaultDeliveryName: string | null;
  defaultDeliveryPhone: string | null;
  defaultDeliveryCity: string | null;
  defaultDeliveryStreet: string | null;
  defaultDeliveryHouse: string | null;
  defaultDeliveryApartment: string | null;
  defaultDeliveryComment: string | null;
};

export type CustomerProfileInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  defaultDeliveryName?: string;
  defaultDeliveryPhone?: string;
  defaultDeliveryCity?: string;
  defaultDeliveryStreet?: string;
  defaultDeliveryHouse?: string;
  defaultDeliveryApartment?: string;
  defaultDeliveryComment?: string;
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function sessionExpiresAt() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CUSTOMER_SESSION_DAYS);
  return expiresAt;
}

async function requestMeta() {
  const h = await headers();
  return {
    userAgent: h.get("user-agent")?.slice(0, 255) || null,
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) || null,
  };
}

function mapCustomer(row: CustomerSessionRow): CurrentCustomer {
  return {
    id: Number(row.id),
    email: row.email,
    phone: row.phone,
    firstName: row.firstName,
    lastName: row.lastName,
    defaultDeliveryName: row.defaultDeliveryName,
    defaultDeliveryPhone: row.defaultDeliveryPhone,
    defaultDeliveryCity: row.defaultDeliveryCity,
    defaultDeliveryStreet: row.defaultDeliveryStreet,
    defaultDeliveryHouse: row.defaultDeliveryHouse,
    defaultDeliveryApartment: row.defaultDeliveryApartment,
    defaultDeliveryComment: row.defaultDeliveryComment,
  };
}

async function createCustomerSession(customerId: number) {
  const token = createSecureToken();
  const tokenHash = sha256(token);
  const expiresAt = sessionExpiresAt();
  const meta = await requestMeta();
  const conn = await pool.getConnection();

  try {
    await conn.query(
      `
      INSERT INTO customer_sessions (customer_id, token_hash, user_agent, ip_address, expires_at)
      VALUES (?, ?, ?, ?, ?)
      `,
      [customerId, tokenHash, meta.userAgent, meta.ipAddress, expiresAt]
    );

    await conn.query(`UPDATE customers SET last_login_at = NOW() WHERE id = ?`, [customerId]);
  } finally {
    conn.release();
  }

  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function registerCustomer(input: { email: string; password: string; firstName?: string; phone?: string }) {
  await ensureAuthSchema();

  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const firstName = cleanText(input.firstName, 120);
  const phone = cleanText(input.phone, 64);

  if (!email || !email.includes("@")) {
    return { success: false as const, message: "Введите корректный email" };
  }

  if (!password || password.length < 8) {
    return { success: false as const, message: "Пароль должен быть минимум 8 символов" };
  }

  const conn = await pool.getConnection();

  try {
    const existing = await conn.query<Array<{ id: number }>>(
      `SELECT id FROM customers WHERE email = ? LIMIT 1`,
      [email]
    );

    if (existing[0]) {
      return { success: false as const, message: "Клиент с таким email уже существует" };
    }

    const result = await conn.query(
      `
      INSERT INTO customers (email, phone, password_hash, first_name, auth_provider, is_active)
      VALUES (?, ?, ?, ?, 'email', 1)
      `,
      [email, phone, hashPassword(password), firstName]
    );

    const customerId = Number(result.insertId);
    await createCustomerSession(customerId);

    return { success: true as const, customerId };
  } finally {
    conn.release();
  }
}

export async function loginCustomer(email: string, password: string) {
  await ensureAuthSchema();

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return null;

  const conn = await pool.getConnection();

  try {
    const rows = await conn.query<CustomerRow[]>(
      `
      SELECT id, email, phone, password_hash, first_name, last_name,
        default_delivery_name, default_delivery_phone, default_delivery_city,
        default_delivery_street, default_delivery_house, default_delivery_apartment,
        default_delivery_comment, is_active
      FROM customers
      WHERE email = ?
      LIMIT 1
      `,
      [normalizedEmail]
    );

    const customer = rows[0];
    if (!customer || !Boolean(customer.is_active) || !customer.password_hash) return null;
    if (!verifyPassword(password, customer.password_hash)) return null;

    await createCustomerSession(Number(customer.id));
    return Number(customer.id);
  } finally {
    conn.release();
  }
}

export async function getCurrentCustomer(): Promise<CurrentCustomer | null> {
  await ensureAuthSchema();

  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const conn = await pool.getConnection();

  try {
    const rows = await conn.query<CustomerSessionRow[]>(
      `
      SELECT
        c.id,
        c.email,
        c.phone,
        c.first_name AS firstName,
        c.last_name AS lastName,
        c.default_delivery_name AS defaultDeliveryName,
        c.default_delivery_phone AS defaultDeliveryPhone,
        c.default_delivery_city AS defaultDeliveryCity,
        c.default_delivery_street AS defaultDeliveryStreet,
        c.default_delivery_house AS defaultDeliveryHouse,
        c.default_delivery_apartment AS defaultDeliveryApartment,
        c.default_delivery_comment AS defaultDeliveryComment
      FROM customer_sessions s
      INNER JOIN customers c ON c.id = s.customer_id
      WHERE s.token_hash = ?
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
        AND c.is_active = 1
      LIMIT 1
      `,
      [sha256(token)]
    );

    return rows[0] ? mapCustomer(rows[0]) : null;
  } finally {
    conn.release();
  }
}

export async function logoutCustomer() {
  await ensureAuthSchema();

  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;

  if (token) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        `UPDATE customer_sessions SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL`,
        [sha256(token)]
      );
    } finally {
      conn.release();
    }
  }

  cookieStore.delete(CUSTOMER_SESSION_COOKIE);
}

export async function updateCustomerProfile(customerId: number, input: CustomerProfileInput) {
  await ensureAuthSchema();

  const values = {
    firstName: cleanText(input.firstName, 120),
    lastName: cleanText(input.lastName, 120),
    phone: cleanText(input.phone, 64),
    defaultDeliveryName: cleanText(input.defaultDeliveryName, 160),
    defaultDeliveryPhone: cleanText(input.defaultDeliveryPhone, 64),
    defaultDeliveryCity: cleanText(input.defaultDeliveryCity, 120),
    defaultDeliveryStreet: cleanText(input.defaultDeliveryStreet, 255),
    defaultDeliveryHouse: cleanText(input.defaultDeliveryHouse, 64),
    defaultDeliveryApartment: cleanText(input.defaultDeliveryApartment, 64),
    defaultDeliveryComment: cleanText(input.defaultDeliveryComment, 1000),
  };

  const conn = await pool.getConnection();

  try {
    await conn.query(
      `
      UPDATE customers
      SET first_name = ?, last_name = ?, phone = ?,
        default_delivery_name = ?, default_delivery_phone = ?, default_delivery_city = ?,
        default_delivery_street = ?, default_delivery_house = ?, default_delivery_apartment = ?,
        default_delivery_comment = ?
      WHERE id = ?
      `,
      [
        values.firstName,
        values.lastName,
        values.phone,
        values.defaultDeliveryName,
        values.defaultDeliveryPhone,
        values.defaultDeliveryCity,
        values.defaultDeliveryStreet,
        values.defaultDeliveryHouse,
        values.defaultDeliveryApartment,
        values.defaultDeliveryComment,
        customerId,
      ]
    );
  } finally {
    conn.release();
  }

  return getCurrentCustomer();
}
