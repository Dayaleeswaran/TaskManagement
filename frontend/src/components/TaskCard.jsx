import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare, GripVertical } from 'lucide-react';

/**
 * Draggable TaskCard component using useSortable.
 */
export default function TaskCard({ task, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  // dnd-kit style transformations
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : 'auto',
    touchAction: 'none',
  };

  // Determine priority badge styling
  const getPriorityBadge = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border bg-rose-500/10 text-rose-400 border-rose-500/25">
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border bg-amber-500/10 text-amber-400 border-amber-500/25">
            Medium
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
            Low
          </span>
        );
    }
  };

  // Determine due date warning level
  const getDueDateStatus = (dateStr) => {
    if (!dateStr) return { label: 'No due date', style: 'text-slate-500 bg-slate-900/40 border-slate-800' };
    
    const dueDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: 'Overdue',
        style: 'text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse',
      };
    } else if (diffDays <= 2) {
      const dayLabel = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : 'In 2 days';
      return {
        label: dayLabel,
        style: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      };
    } else {
      return {
        label: new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        style: 'text-slate-400 bg-slate-800/40 border-slate-700/60',
      };
    }
  };

  const dueStatus = getDueDateStatus(task.dueDate);

  // Extract avatar initials
  const getAssigneeInitials = (assignment) => {
    const userObj = assignment.user || assignment;
    if (!userObj?.name) return 'U';
    return userObj.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Safe comment count
  const commentCount = task.comments?.length || task.commentsCount || task._count?.comments || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative p-4 rounded-xl bg-slate-900 border border-slate-850 hover:border-slate-700 hover:shadow-md transition-all duration-200 shadow-sm flex flex-col justify-between gap-3 cursor-grab active:cursor-grabbing"
      onClick={onClick}
    >
      {/* Top Section */}
      <div className="space-y-2 select-none">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            {getPriorityBadge(task.priority)}
          </div>
          
          {/* Drag Handle (Visual cue only, drag works on entire card) */}
          <div
            className="p-1 text-slate-500 transition-colors opacity-40 group-hover:opacity-80"
            title="Drag task"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        </div>

        <h4 className="text-sm font-bold text-slate-100 leading-snug group-hover:text-slate-400 transition-colors duration-150 line-clamp-2">
          {task.title}
        </h4>
        
        {task.description && (
          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Bottom Footer Section */}
      <div className="flex items-center justify-between border-t border-slate-850 pt-3 mt-1 flex-wrap gap-2">
        {/* Due Date Indicator */}
        <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${dueStatus.style}`}>
          <Calendar className="h-3 w-3" />
          <span>{dueStatus.label}</span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Comments Count */}
          {commentCount > 0 && (
            <div className="flex items-center space-x-1 text-slate-500 text-xs font-semibold" title="Comments">
              <MessageSquare className="h-3 w-3 text-slate-500" />
              <span>{commentCount}</span>
            </div>
          )}

          {/* Assigned Avatars */}
          <div className="flex -space-x-1.5 overflow-hidden">
            {task.assignments && task.assignments.length > 0 ? (
              task.assignments.slice(0, 3).map((assignment, idx) => {
                const userObj = assignment.user || assignment;
                return (
                  <div
                    key={idx}
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm border ${
                      userObj.role === 'SUPER_ADMIN' ? 'avatar-initials-amber' :
                      userObj.role === 'ADMIN' ? 'avatar-initials-purple' :
                      userObj.role === 'PROJECT_MANAGER' ? 'avatar-initials-blue' :
                      'avatar-initials-violet'
                    }`}
                    title={userObj.name}
                  >
                    {getAssigneeInitials(assignment)}
                  </div>
                );
              })
            ) : (
              <div
                className="h-6 w-6 rounded-full bg-slate-905 border border-slate-900 flex items-center justify-center text-[10px] text-slate-400 font-semibold"
                title="Unassigned"
              >
                ?
              </div>
            )}
            {task.assignments && task.assignments.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-slate-905 border border-slate-900 flex items-center justify-center text-[9px] font-extrabold text-slate-400">
                +{task.assignments.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
