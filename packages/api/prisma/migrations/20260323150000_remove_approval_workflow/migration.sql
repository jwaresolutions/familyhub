-- DropForeignKey
ALTER TABLE "ShoppingItem" DROP CONSTRAINT "ShoppingItem_approvedById_fkey";

-- AlterTable
ALTER TABLE "ShoppingItem" DROP COLUMN "approvalStatus",
DROP COLUMN "approvedById",
DROP COLUMN "rejectionReason";

-- DropEnum
DROP TYPE "ApprovalStatus";
