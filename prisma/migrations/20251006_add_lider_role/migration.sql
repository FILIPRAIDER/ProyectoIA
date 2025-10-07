-- Migration: Add LIDER to Role enum (PARTE 1)
-- Date: 2025-10-06
-- Description: Adds the LIDER role to the Role enum
-- IMPORTANTE: Este SQL SOLO agrega el enum. Ejecutar primero este archivo.
--             Luego ejecutar UPDATE_USERS_TO_LIDER.sql (archivo separado)

-- Step 1: Add the new enum value
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'LIDER';
