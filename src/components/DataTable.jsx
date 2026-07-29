import {
    Box,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    Typography,
} from "@mui/material";

import { PAGINATION } from "../constants";

/**
 * A table over a server-paginated, server-sorted list.
 *
 * Sorting and paging are pushed to the API rather than done here: the fighter
 * table alone can hold tens of thousands of rows, and the API already exposes
 * `sort`, `offset` and `limit` for exactly this.
 *
 * `columns` entries are `{ id, label, align, sortable, numeric, render }`.
 * `render` receives the row; `numeric` right-aligns and applies tabular figures
 * so digits line up down the column.
 */
export function DataTable({
    columns,
    rows,
    count,
    listParams,
    isFetching,
    emptyMessage = "No records found.",
    getRowKey = (row) => row.uuid,
}) {
    const { orderBy, order, toggleSort, page, setPage, limit, changeLimit } =
        listParams;

    return (
        <Box>
            {/* Progress sits above the table so a refetch never collapses the
                rows the user is reading. */}
            <Box sx={{ height: 4 }}>
                {isFetching ? <LinearProgress sx={{ height: 4 }} /> : null}
            </Box>

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell
                                    key={column.id}
                                    align={
                                        column.align ??
                                        (column.numeric ? "right" : "left")
                                    }
                                    sortDirection={
                                        orderBy === column.id ? order : false
                                    }
                                >
                                    {column.sortable ? (
                                        <TableSortLabel
                                            active={orderBy === column.id}
                                            direction={
                                                orderBy === column.id
                                                    ? order
                                                    : "asc"
                                            }
                                            onClick={() =>
                                                toggleSort(column.id)
                                            }
                                        >
                                            {column.label}
                                        </TableSortLabel>
                                    ) : (
                                        column.label
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "text.secondary",
                                            py: 4,
                                            textAlign: "center",
                                        }}
                                    >
                                        {emptyMessage}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row) => (
                                <TableRow key={getRowKey(row)} hover>
                                    {columns.map((column) => (
                                        <TableCell
                                            key={column.id}
                                            align={
                                                column.align ??
                                                (column.numeric
                                                    ? "right"
                                                    : "left")
                                            }
                                            sx={
                                                column.numeric
                                                    ? {
                                                          fontVariantNumeric:
                                                              "tabular-nums",
                                                      }
                                                    : undefined
                                            }
                                        >
                                            {column.render(row)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component="div"
                count={count ?? 0}
                page={page}
                rowsPerPage={limit}
                rowsPerPageOptions={PAGINATION.ROWS_PER_PAGE_OPTIONS}
                onPageChange={(event, nextPage) => setPage(nextPage)}
                onRowsPerPageChange={(event) =>
                    changeLimit(Number(event.target.value))
                }
            />
        </Box>
    );
}
