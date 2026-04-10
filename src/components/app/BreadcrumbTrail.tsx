import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbTrailProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbTrail({ items }: BreadcrumbTrailProps) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        {items.map((item, index) => (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <ChevronRight className="h-4 w-4 text-slate-300" /> : null}
            {item.to ? (
              <Link to={item.to} className="font-semibold text-slate-500 transition-colors hover:text-indigo-600">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-slate-700">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}
