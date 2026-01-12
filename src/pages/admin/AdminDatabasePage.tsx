import { useState, useEffect } from 'react';
import {
  Database, Table as TableIcon, Search, ChevronLeft,
  ChevronRight, HardDrive, Info, RefreshCw
} from 'lucide-react';
import { adminDatabaseApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { adminAuthApi } from '@/lib/adminApi';
import { useNavigate } from 'react-router-dom';

export default function AdminDatabasePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState<{ columns: string[]; rows: any[] }>({ columns: [], rows: [] });
  const [tableSchema, setTableSchema] = useState<any>(null);
  const [dbStats, setDbStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 0 });

  // Check if super_admin
  useEffect(() => {
    const session = adminAuthApi.getSession();
    if (session?.admin?.role !== 'super_admin') {
      toast({
        title: 'Access Denied',
        description: 'Only super admins can access the database viewer',
        variant: 'destructive',
      });
      navigate('/admin/dashboard');
    }
  }, [navigate, toast]);

  useEffect(() => {
    loadTables();
    loadDbStats();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableData();
      loadTableSchema();
    }
  }, [selectedTable, pagination.page, search]);

  const loadTables = async () => {
    try {
      const data = await adminDatabaseApi.getTables();
      setTables(data);
      if (data.length > 0) {
        setSelectedTable(data[0].name);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load tables',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDbStats = async () => {
    try {
      const data = await adminDatabaseApi.getStats();
      setDbStats(data);
    } catch (error) {
      console.error('Failed to load db stats:', error);
    }
  };

  const loadTableData = async () => {
    setDataLoading(true);
    try {
      const data = await adminDatabaseApi.getTableData(selectedTable, {
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
      });
      setTableData({ columns: data.columns, rows: data.rows });
      setPagination(data.pagination);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load table data',
        variant: 'destructive',
      });
    } finally {
      setDataLoading(false);
    }
  };

  const loadTableSchema = async () => {
    try {
      const data = await adminDatabaseApi.getTableSchema(selectedTable);
      setTableSchema(data);
    } catch (error) {
      console.error('Failed to load schema:', error);
    }
  };

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName);
    setPagination(p => ({ ...p, page: 1 }));
    setSearch('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    loadTableData();
  };

  const formatCellValue = (value: any) => {
    if (value === null) return <span className="text-gray-400 italic">null</span>;
    if (value === undefined) return <span className="text-gray-400 italic">undefined</span>;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') {
      try {
        return <code className="text-xs bg-gray-100 p-1 rounded">{JSON.stringify(value)}</code>;
      } catch {
        return String(value);
      }
    }
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return String(value);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Database Viewer</h1>
          <p className="text-gray-500">Browse raw database tables (read-only)</p>
        </div>
        <Badge variant="outline" className="text-orange-600 border-orange-200">
          Super Admin Only
        </Badge>
      </div>

      {/* Database Stats */}
      {dbStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Tables</p>
                  <p className="text-2xl font-bold">{tables.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <TableIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Rows</p>
                  <p className="text-2xl font-bold">{(dbStats.database?.totalRows || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <HardDrive className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Database Size</p>
                  <p className="text-2xl font-bold">{dbStats.database?.totalSizeMB || 0} MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table Selector & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedTable} onValueChange={handleTableChange}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select table" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table.name} value={table.name}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{table.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {table.row_count?.toLocaleString() || 0} rows
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search in table..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            <Button variant="outline" onClick={loadTableData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            {tableSchema && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Info className="w-4 h-4 mr-2" />
                    Schema
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Table Schema: {selectedTable}</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Column</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Nullable</TableHead>
                          <TableHead>Key</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableSchema.columns?.map((col: any) => (
                          <TableRow key={col.name}>
                            <TableCell className="font-mono text-sm">{col.name}</TableCell>
                            <TableCell className="font-mono text-sm text-gray-500">{col.full_type}</TableCell>
                            <TableCell>
                              {col.nullable === 'YES' ? (
                                <Badge variant="secondary">Yes</Badge>
                              ) : (
                                <Badge>No</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {col.key_type === 'PRI' && <Badge className="bg-blue-100 text-blue-700">Primary</Badge>}
                              {col.key_type === 'MUL' && <Badge variant="secondary">Index</Badge>}
                              {col.key_type === 'UNI' && <Badge className="bg-purple-100 text-purple-700">Unique</Badge>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {tableData.columns.map((col) => (
                    <TableHead key={col} className="whitespace-nowrap font-mono text-xs">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {tableData.columns.map((col) => (
                        <TableCell key={col}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : tableData.rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={tableData.columns.length || 1}
                      className="text-center py-8 text-gray-500"
                    >
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {tableData.columns.map((col) => (
                        <TableCell
                          key={col}
                          className="font-mono text-xs max-w-xs truncate"
                        >
                          {formatCellValue(row[col])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} rows
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table Stats */}
      {dbStats?.tables && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Table Statistics</CardTitle>
            <CardDescription>Storage usage by table</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dbStats.tables.map((table: any) => (
                <div
                  key={table.name}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedTable === table.name ? 'border-emerald-500 bg-emerald-50' : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleTableChange(table.name)}
                >
                  <p className="font-medium text-sm">{table.name}</p>
                  <p className="text-2xl font-bold mt-1">{(table.rows || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">
                    {formatBytes((table.data_size || 0) + (table.index_size || 0))}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
