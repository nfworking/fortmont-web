ALTER TABLE `user_sessions`
  ADD COLUMN `signInUrl` TEXT NULL AFTER `ipAddress`;
