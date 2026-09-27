import type { ReactNode } from "react";
import { cx } from "../utils/format";

export function FoodCardGrid({ children, columns = "xl:grid-cols-3" }: { children: ReactNode; columns?: string }) {
  return <div className={cx("grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2", columns)}>{children}</div>;
}
