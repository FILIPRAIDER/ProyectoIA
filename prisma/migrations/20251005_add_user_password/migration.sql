-- 2025XXXX_add_passwordHash_to_user

/* 
   Hacemos la columna opcional para no romper usuarios existentes (seed, invites).
   La API exigirá password SOLO cuando el cliente lo envíe para registro clásico.
*/
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
