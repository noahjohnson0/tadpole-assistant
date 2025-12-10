'use client';

import { Trash2, Pencil, MessageSquare, X } from 'lucide-react';
import { Activity } from '@/types/activity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ActivityTableRowProps {
  activity: Activity;
  isPendingDelete: boolean;
  isEditing: boolean;
  editValues: {
    name: string;
    quantity: string;
    unit: string;
  } | null;
  editContainerRef?: (el: HTMLDivElement | null) => void;
  onEditClick: (activity: Activity, e: React.MouseEvent) => void;
  onDeleteClick: (activity: Activity, e: React.MouseEvent) => void;
  onFieldChange: (field: 'name' | 'quantity' | 'unit', value: string) => void;
  onFieldBlur: (activity: Activity, e: React.FocusEvent) => void;
  onKeyDown: (e: React.KeyboardEvent, activity: Activity) => void;
  formatTime: (date: Date) => string;
  formatRepsDuration: (activity: { quantity?: string; unit?: string }) => string;
  isNew?: boolean;
}

export function ActivityTableRow({
  activity,
  isPendingDelete,
  isEditing,
  editValues,
  editContainerRef,
  onEditClick,
  onDeleteClick,
  onFieldChange,
  onFieldBlur,
  onKeyDown,
  formatTime,
  formatRepsDuration,
}: ActivityTableRowProps) {
  return (
    <TableRow key={activity.id} data-activity-id={activity.id}>
      <TableCell className="font-medium">
        {isEditing && editValues ? (
          <Input
            value={editValues.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            onBlur={(e) => onFieldBlur(activity, e)}
            onKeyDown={(e) => onKeyDown(e, activity)}
            className="h-8"
            autoFocus
          />
        ) : (
          activity.name
        )}
      </TableCell>
      <TableCell>
        {isEditing && editValues ? (
          <div
            ref={editContainerRef || undefined}
            className="flex items-center gap-2"
          >
            <Input
              value={editValues.quantity}
              onChange={(e) => onFieldChange('quantity', e.target.value)}
              onBlur={(e) => onFieldBlur(activity, e)}
              onKeyDown={(e) => onKeyDown(e, activity)}
              className="h-8 w-20"
              placeholder="Qty"
              type="number"
            />
            <Input
              value={editValues.unit}
              onChange={(e) => onFieldChange('unit', e.target.value)}
              onBlur={(e) => onFieldBlur(activity, e)}
              onKeyDown={(e) => onKeyDown(e, activity)}
              className="h-8 w-24"
              placeholder="Unit"
            />
          </div>
        ) : (
          formatRepsDuration(activity)
        )}
      </TableCell>
      <TableCell className="text-right">
        {formatTime(activity.timestamp)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {activity.transcribedPhrase && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onMouseEnter={(e) => e.stopPropagation()}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="font-medium mb-1">Transcribed phrase:</p>
                <p className="text-sm">{activity.transcribedPhrase}</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={(e) => onEditClick(activity, e)}
          >
            <Pencil className={`h-4 w-4 ${isEditing ? 'text-blue-600' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={(e) => onDeleteClick(activity, e)}
          >
            {isPendingDelete ? (
              <Trash2 className="h-4 w-4 text-red-600" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
