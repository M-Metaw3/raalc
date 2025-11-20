-- Migration: Create Complaints Table
-- Created: 2025-11-20
-- 
-- Creates the complaints table for user complaint management

CREATE TABLE IF NOT EXISTS `complaints` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `firstName` VARCHAR(100) NOT NULL COMMENT 'Complainant first name',
  `lastName` VARCHAR(100) NOT NULL COMMENT 'Complainant last name',
  `email` VARCHAR(255) NOT NULL COMMENT 'Complainant email',
  `phoneNumber` VARCHAR(20) NULL COMMENT 'Complainant phone number',
  `complaintType` ENUM('financial', 'technical', 'service', 'other') NOT NULL DEFAULT 'other' COMMENT 'Type of complaint',
  `departmentId` INT UNSIGNED NULL COMMENT 'Department ID related to this complaint',
  `description` TEXT NOT NULL COMMENT 'Complaint description/details',
  `attachments` JSON NULL COMMENT 'Array of attachment file paths',
  `status` ENUM('pending', 'in_progress', 'resolved', 'rejected', 'closed') NOT NULL DEFAULT 'pending' COMMENT 'Complaint status',
  `resolutionNotes` TEXT NULL COMMENT 'Admin notes about resolution',
  `resolvedAt` DATETIME NULL COMMENT 'When complaint was resolved',
  `userId` INT UNSIGNED NULL COMMENT 'User ID if complaint submitted by authenticated user',
  `resolvedBy` INT UNSIGNED NULL COMMENT 'Admin ID who resolved the complaint',
  `deletedAt` DATETIME NULL COMMENT 'Soft delete timestamp',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_complaints_user_id` (`userId`),
  INDEX `idx_complaints_resolved_by` (`resolvedBy`),
  INDEX `idx_complaints_status` (`status`),
  INDEX `idx_complaints_complaint_type` (`complaintType`),
  INDEX `idx_complaints_department_id` (`departmentId`),
  INDEX `idx_complaints_email` (`email`),
  INDEX `idx_complaints_deleted_at` (`deletedAt`),
  INDEX `idx_complaints_status_created` (`status`, `createdAt`),
  CONSTRAINT `fk_complaints_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_complaints_resolver` FOREIGN KEY (`resolvedBy`) REFERENCES `admins`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_complaints_department` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

