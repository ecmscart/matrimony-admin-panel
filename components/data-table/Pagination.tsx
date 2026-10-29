import { Button } from "@/components/ui/button";

interface Props {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function PaginationBar({ page, limit, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
      <div className="text-(--color-muted-foreground)">
        {total === 0 ? "0 results" : `${from}–${to} of ${total}`}
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-(--color-muted-foreground) whitespace-nowrap">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
