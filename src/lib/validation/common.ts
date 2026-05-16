import { z } from "zod";

export const idSchema = z.coerce.number().int().positive();
export const optionalText = (max = 255) => z.string().trim().max(max).optional().nullable();
export const requiredText = (max = 255) => z.string().trim().min(1).max(max);
export const phoneSchema = z.string().trim().min(5).max(64);
export const emailSchema = z.string().trim().email().max(190).optional().nullable().or(z.literal(""));
export const moneySchema = z.coerce.number().finite().min(0).max(99999999);
export const quantitySchema = z.coerce.number().int().min(1).max(99);
