"use client";

import NextLink from "next/link";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

export type Crumb = {
  label: string;
  href?: string;
};

export interface BreadcrumbTrailProps {
  items: Crumb[];
}

export function BreadcrumbTrail({ items }: BreadcrumbTrailProps) {
  const lastIndex = items.length - 1;

  return (
    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
      {items.map((item, idx) => {
        const isLast = idx === lastIndex;
        if (!item.href || isLast) {
          return (
            <Typography key={item.label} color="text.primary" fontWeight={600}>
              {item.label}
            </Typography>
          );
        }
        return (
          <Link
            key={item.label}
            component={NextLink}
            href={item.href}
            underline="hover"
            color="inherit"
            fontWeight={600}
          >
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}

