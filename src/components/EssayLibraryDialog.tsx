import { useState, useCallback, useEffect } from 'react';
import { BookMarked, Trash2, Play, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistance } from 'date-fns/formatDistance';
import { zhCN } from 'date-fns/locale/zh-CN';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty, EmptyHeader } from '@/components/ui/empty';
import type { IEssayRecord } from '@/data/essayLibrary';
import { loadEssayLibrary, deleteEssayRecord } from '@/data/essayLibrary';

interface EssayLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 点击继续练习时触发 */
  onResume: (record: IEssayRecord) => void;
}

export default function EssayLibraryDialog({
  open,
  onOpenChange,
  onResume,
}: EssayLibraryDialogProps) {
  const [records, setRecords] = useState<IEssayRecord[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<IEssayRecord | null>(null);

  const refresh = useCallback(() => {
    setRecords(loadEssayLibrary());
  }, []);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const handleDelete = useCallback((record: IEssayRecord) => {
    setDeleteTarget(record);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteEssayRecord(deleteTarget.id);
    toast.success('已删除');
    setDeleteTarget(null);
    refresh();
  }, [deleteTarget, refresh]);

  const handleResume = useCallback(
    (record: IEssayRecord) => {
      onResume(record);
      onOpenChange(false);
    },
    [onResume, onOpenChange]
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookMarked className="size-5 text-primary" />
              我的范文
            </DialogTitle>
            <DialogDescription>
              共 {records.length} 篇已练习的范文，点击任意一篇可继续上次进度
            </DialogDescription>
          </DialogHeader>

          {records.length === 0 ? (
            <div className="py-12">
              <Empty>
                <EmptyHeader>
                  <p className="text-sm text-muted-foreground">还没有保存的范文</p>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-3">
                {records.map((record) => {
                  const total = record.templates.length;
                  const mastered = record.masteredSentenceIds.length;
                  const progress = total > 0 ? Math.round((mastered / total) * 100) : 0;
                  return (
                    <Card
                      key={record.id}
                      className="border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground/90 text-sm leading-snug line-clamp-2">
                              {record.title}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <FileText className="size-3" />
                                {total} 句
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="size-3" />
                                {mastered}/{total}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {formatDistance(new Date(record.savedAt), new Date(), {
                                  addSuffix: true,
                                  locale: zhCN,
                                })}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {progress}%
                          </Badge>
                        </div>

                        {/* 进度条 */}
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/70 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(record)}
                          >
                            <Trash2 className="size-3.5 mr-1" />
                            删除
                          </Button>
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => handleResume(record)}
                          >
                            <Play className="size-3.5 mr-1" />
                            {record.isFullEssayPhase ? '继续整篇' : '继续练习'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            删除后将无法恢复「{deleteTarget?.title.slice(0, 20)}…」的练习进度，确定删除吗？
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
