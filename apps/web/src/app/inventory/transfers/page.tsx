import { TransfersTable } from "@/components/inventory/transfers-table";
import { CreateTransferDialog } from "@/components/inventory/create-transfer-dialog";

export const metadata = {
  title: "Inventory Transfers",
};

export default function TransfersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Transfers</h1>
          <p className="text-muted-foreground">
            Manage incoming and outgoing stock transfers between restaurants.
          </p>
        </div>
        <CreateTransferDialog />
      </div>

      <TransfersTable />
    </div>
  );
}
