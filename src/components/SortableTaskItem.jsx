import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import TaskItem from "./TaskItem";

export default function SortableTaskItem({ task, disabled, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled });
  return <div ref={setNodeRef} className={isDragging ? "sortableTask dragging" : "sortableTask"} style={{ transform: CSS.Transform.toString(transform), transition }}><TaskItem task={task} dragHandleProps={{ ...attributes, ...listeners }} dragDisabled={disabled} {...props} /></div>;
}
