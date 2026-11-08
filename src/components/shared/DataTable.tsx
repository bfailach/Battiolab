import React, { useMemo, useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel
} from '@mui/material';

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  hideBelow?: 'sm' | 'md' | 'lg';
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
  pageSize?: number;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
  dense?: boolean;
}

function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  empty,
  pageSize = 10,
  initialSort,
  dense
}: DataTableProps<T>) {
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(pageSize);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!col?.sortValue || !sort) return rows;
    const get = col.sortValue;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es');
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, columns, sort]);

  const maxPage = Math.max(0, Math.ceil(sorted.length / perPage) - 1);
  const safePage = Math.min(page, maxPage);
  const visible = sorted.slice(safePage * perPage, safePage * perPage + perPage);

  if (rows.length === 0 && empty) return <>{empty}</>;

  const hide = (c: Column<T>) => (c.hideBelow ? { display: { xs: 'none', [c.hideBelow]: 'table-cell' } } : {});

  return (
    <Box>
      <TableContainer>
        <Table size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.key} align={c.align} sx={{ width: c.width, ...hide(c) }}>
                  {c.sortValue ? (
                    <TableSortLabel
                      active={sort?.key === c.key}
                      direction={sort?.key === c.key ? sort.dir : 'asc'}
                      onClick={() =>
                        setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === 'asc' ? 'desc' : 'asc' }))
                      }
                    >
                      {c.label}
                    </TableSortLabel>
                  ) : (
                    c.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((row) => (
              <TableRow
                key={rowKey(row)}
                hover={Boolean(onRowClick)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter') onRowClick(row);
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                sx={{ cursor: onRowClick ? 'pointer' : 'default', '&:last-child td': { borderBottom: 0 } }}
              >
                {columns.map((c) => (
                  <TableCell key={c.key} align={c.align} sx={hide(c)}>
                    {c.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {sorted.length > perPage && (
        <TablePagination
          component="div"
          count={sorted.length}
          page={safePage}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={perPage}
          onRowsPerPageChange={(e) => {
            setPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      )}
    </Box>
  );
}

export default DataTable;
