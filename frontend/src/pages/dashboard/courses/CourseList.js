import { useEffect, useState } from 'react';
// @mui
import {
  Box,
  Tab,
  Tabs,
  Card,
  Table,
  Switch,
  Button,
  Divider,
  TableBody,
  Container,
  TableContainer,
  TablePagination,
  FormControlLabel,
  Typography,
} from '@mui/material';
// routes
import { PATH_DASHBOARD } from '@/routes/paths';
// hooks
import useTabs from '@/hooks/useTabs';
import useSettings from '@/hooks/useSettings';
import useTable, { getComparator, emptyRows } from '@/hooks/useTable';
// _mock_
// components
import Page from '@/components/Page';
import Iconify from '@/components/Iconify';
import Scrollbar from '@/components/Scrollbar';
import HeaderBreadcrumbs from '@/components/HeaderBreadcrumbs';
import { TableEmptyRows, TableHeadCustom, TableNoData } from '@/components/table';
// sections
import axios from '@/utils/axios';
import { useSnackbar } from 'notistack';
import { DialogAnimate } from '@/components/animate';
import { BookTableRow, BookTableToolbar, BookNewEditForm } from '@/sections/@dashboard/Book';
import { CourseNewEditForm, CourseTableRow, CourseTableToolbar } from '@/sections/@dashboard/course';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = ['all', 'active', 'banned'];

const ROLE_OPTIONS = [
  'all',
  'ux designer',
  'full stack designer',
  'backend developer',
  'project manager',
  'leader',
  'ui designer',
  'ui/ux designer',
  'front end developer',
  'full stack developer',
];

const TABLE_HEAD = [
  { id: 'name', label: 'Name', align: 'left' },
  { id: 'instructor', label: 'Instructor', align: 'left' },
  { id: 'author', label: 'Author', align: 'left' },
  { id: 'language', label: 'Language', align: 'left' },
  { id: 'price', label: 'Price', align: 'left' },
  { id: '' },
];

// ----------------------------------------------------------------------

export default function ProductBookList() {
  const {
    dense,
    page,
    order,
    orderBy,
    rowsPerPage,
    setPage,
    //

    onSort,
    onChangeDense,
    onChangePage,
    onChangeRowsPerPage,
  } = useTable();

  const { themeStretch } = useSettings();

  const [tableData, setTableData] = useState([]);

  const [filterName, setFilterName] = useState('');

  const [filterRole, setFilterRole] = useState('all');

  const [openDialog, setOpenDialog] = useState(false);

  const [isEdit, setIsEdit] = useState(false);

  const [currentCourse, setCurrentCourse] = useState(null);

  const { enqueueSnackbar } = useSnackbar();

  const { currentTab: filterStatus, onChangeTab: onChangeFilterStatus } = useTabs('all');

  const handleFilterName = (filterName) => {
    setFilterName(filterName);
    setPage(0);
  };

  const handleFilterRole = (event) => {
    setFilterRole(event.target.value);
  };

  const deleteSuccess = (id) => {
    setTableData((prev) => prev.filter((item) => item._id !== id));
  };

  const handleDeleteRow = async (id) => {
    try {
      await axios.delete('/api/course/delete-course', {
        params: { id: id },
      });
      deleteSuccess(id);
      enqueueSnackbar('Delete Course successfully');
    } catch (error) {
      console.log(error);
    }
  };

  const handleEditRow = (row) => {
    setCurrentCourse(row);
    setIsEdit(true);
    setOpenDialog(true);
  };

  const onSuccess = (data, id) => {
    setTableData((prev) => {
      if (id) {
        return prev.map((item) => (item._id === id ? data : item));
      }
      return [data, ...prev];
    });
    setOpenDialog(false);
  };

  const handleAddNewRow = (row) => {
    setIsEdit(false);
    setOpenDialog(true);
    setCurrentCourse(null);
  };

  const dataFiltered = applySortFilter({
    tableData,
    comparator: getComparator(order, orderBy),
    filterName,
    filterRole,
    filterStatus,
  });

  const denseHeight = dense ? 52 : 72;

  const isNotFound =
    (!dataFiltered.length && !!filterName) ||
    (!dataFiltered.length && !!filterRole) ||
    (!dataFiltered.length && !!filterStatus);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get('/api/course/get-course');
        console.log(data);
        setTableData(data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  return (
    <Page title="Course: List">
      <Container maxWidth={themeStretch ? false : 'lg'}>
        <HeaderBreadcrumbs
          heading="Course List"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            { name: 'Products', href: PATH_DASHBOARD.products.root },
            { name: 'List' },
          ]}
          action={
            <Button variant="contained" onClick={handleAddNewRow} startIcon={<Iconify icon={'eva:plus-fill'} />}>
              New course
            </Button>
          }
        />
        <DialogAnimate open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg">
          <Container maxWidth={'lg'}>
            <Typography variant="h4" sx={{ my: 2 }}>
              {isEdit ? 'Edit Course' : 'Create Course'}
            </Typography>
            <CourseNewEditForm isEdit={isEdit} onSuccess={onSuccess} currentCourse={currentCourse} />
          </Container>
        </DialogAnimate>
        <Card>
          <Tabs
            allowScrollButtonsMobile
            variant="scrollable"
            scrollButtons="auto"
            value={filterStatus}
            onChange={onChangeFilterStatus}
            sx={{ px: 2, bgcolor: 'background.neutral' }}
          >
            {STATUS_OPTIONS.map((tab) => (
              <Tab disableRipple key={tab} label={tab} value={tab} />
            ))}
          </Tabs>

          <Divider />

          <CourseTableToolbar
            filterName={filterName}
            filterRole={filterRole}
            onFilterName={handleFilterName}
            onFilterRole={handleFilterRole}
            optionsRole={ROLE_OPTIONS}
          />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 800, position: 'relative' }}>
              <Table size={dense ? 'small' : 'medium'}>
                <TableHeadCustom order={order} orderBy={orderBy} headLabel={TABLE_HEAD} onSort={onSort} />

                <TableBody>
                  {dataFiltered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                    <CourseTableRow
                      key={row._id}
                      row={row}
                      onDeleteRow={() => handleDeleteRow(row._id)}
                      onEditRow={() => handleEditRow(row)}
                    />
                  ))}

                  <TableEmptyRows height={denseHeight} emptyRows={emptyRows(page, rowsPerPage, tableData.length)} />

                  <TableNoData isNotFound={isNotFound} />
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <Box sx={{ position: 'relative' }}>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={dataFiltered.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={onChangePage}
              onRowsPerPageChange={onChangeRowsPerPage}
            />

            <FormControlLabel
              control={<Switch checked={dense} onChange={onChangeDense} />}
              label="Dense"
              sx={{ px: 3, py: 1.5, top: 0, position: { md: 'absolute' } }}
            />
          </Box>
        </Card>
      </Container>
    </Page>
  );
}

// ----------------------------------------------------------------------

function applySortFilter({ tableData, comparator, filterName, filterStatus, filterRole }) {
  const stabilizedThis = tableData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  tableData = stabilizedThis.map((el) => el[0]);

  if (filterName) {
    tableData = tableData.filter((item) => item.fullName.toLowerCase().indexOf(filterName.toLowerCase()) !== -1);
  }

  if (filterStatus !== 'all') {
    tableData = tableData.filter((item) => item.status === filterStatus);
  }

  if (filterRole !== 'all') {
    tableData = tableData.filter((item) => item.role === filterRole);
  }

  return tableData;
}
