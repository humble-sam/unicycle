import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, ChevronLeft, ChevronRight, MoreHorizontal,
  Eye, CheckCircle, XCircle, Clock, Flag, ExternalLink
} from 'lucide-react';
import { adminReportsApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  reviewed: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-700',
};

const reasonLabels: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Inappropriate',
  fraud: 'Fraud',
  duplicate: 'Duplicate',
  other: 'Other',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, pages: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [reason, setReason] = useState('all');
  const [stats, setStats] = useState<any>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadReports();
  }, [pagination.page, status, reason]);

  const loadStats = async () => {
    try {
      const data = await adminReportsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await adminReportsApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        status: status !== 'all' ? status : undefined,
        reason: reason !== 'all' ? reason : undefined,
      });
      setReports(data.reports);
      setPagination(data.pagination);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId: string, newStatus: string) => {
    try {
      await adminReportsApi.updateStatus(reportId, newStatus);
      toast({ title: 'Report status updated successfully' });
      loadReports();
      loadStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update report status',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Reports</h1>
        <p className="text-gray-500">Manage user reports of inappropriate products</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold">{stats.summary?.pending || 0}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Reviewed</p>
                  <p className="text-2xl font-bold">{stats.summary?.reviewed || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Resolved</p>
                  <p className="text-2xl font-bold">{stats.summary?.resolved || 0}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold">{stats.summary?.total || 0}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Flag className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={(e) => { e.preventDefault(); }} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search reports..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="inappropriate">Inappropriate</SelectItem>
                <SelectItem value="fraud">Fraud</SelectItem>
                <SelectItem value="duplicate">Duplicate</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No reports found
                  </TableCell>
                </TableRow>
              ) : (
                reports
                  .filter(report => {
                    if (!search) return true;
                    const searchLower = search.toLowerCase();
                    return (
                      report.product_title?.toLowerCase().includes(searchLower) ||
                      report.reporter_name?.toLowerCase().includes(searchLower) ||
                      report.reporter_email?.toLowerCase().includes(searchLower)
                    );
                  })
                  .map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {report.product_images && JSON.parse(report.product_images || '[]')[0] && (
                            <img
                              src={JSON.parse(report.product_images)[0]}
                              alt={report.product_title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">{report.product_title}</p>
                            <a
                              href={`/product/${report.product_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{report.reporter_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{report.reporter_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{reasonLabels[report.reason] || report.reason}</Badge>
                        {report.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{report.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[report.status] || 'bg-gray-100 text-gray-700'}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(report.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {report.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(report.id, 'reviewed')}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Mark as Reviewed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(report.id, 'resolved')}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark as Resolved
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(report.id, 'dismissed')}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Dismiss
                                </DropdownMenuItem>
                              </>
                            )}
                            {report.status === 'reviewed' && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(report.id, 'resolved')}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark as Resolved
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(report.id, 'dismissed')}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Dismiss
                                </DropdownMenuItem>
                              </>
                            )}
                            {(report.status === 'resolved' || report.status === 'dismissed') && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(report.id, 'pending')}>
                                <Clock className="w-4 h-4 mr-2" />
                                Reopen
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} reports
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
    </div>
  );
}
