"use client";

import { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import KanbanCard, { Order } from "./KanbanCard";

interface Column {
  id: string;
  title: string;
  color: string;
}

const COLUMNS: Column[] = [
  {
    id: "pending",
    title: "Pending / Baru",
    color: "border-amber-400 bg-amber-50/50",
  },
  {
    id: "processing",
    title: "Processing / Disahkan",
    color: "border-blue-400 bg-blue-50/50",
  },
  {
    id: "completed",
    title: "Completed / Selesai",
    color: "border-emerald-400 bg-emerald-50/50",
  },
  {
    id: "cancelled",
    title: "Cancelled / Batal",
    color: "border-rose-400 bg-rose-50/50",
  },
];

interface KanbanBoardProps {
  initialOrders: Order[];
  onStatusChange: (orderId: number, newStatus: string) => Promise<void>;
  onSendWhatsApp: (order: Order) => void;
  updatingId: number | null;
}

export default function KanbanBoard({
  initialOrders,
  onStatusChange,
  onSendWhatsApp,
  updatingId,
}: KanbanBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  const handleOnDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const orderId = Number(draggableId);
    const newStatus = destination.droppableId;

    setOrders((prevOrders) =>
      prevOrders.map((o) =>
        o.id === orderId ? { ...o, status: newStatus } : o,
      ),
    );

    await onStatusChange(orderId, newStatus);
  };

  if (!enabled) return null;

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.id);

          return (
            <div
              key={col.id}
              className={`border-t-4 rounded-2xl p-4 bg-slate-50/80 border border-slate-200 min-h-[75vh] flex flex-col space-y-4 ${col.color}`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  {col.title}
                </h2>
                <span className="px-2 py-0.5 bg-white font-mono text-xs font-bold rounded-lg border border-slate-200 text-slate-600">
                  {columnOrders.length}
                </span>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-3 flex-1 min-h-[150px] transition-colors rounded-xl p-1 ${
                      snapshot.isDraggingOver ? "bg-slate-200/50" : ""
                    }`}
                  >
                    {columnOrders.length === 0 ? (
                      <div className="text-center py-10 text-[11px] font-medium text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        Tarik kad ke sini
                      </div>
                    ) : (
                      columnOrders.map((order, index) => (
                        <Draggable
                          key={order.id.toString()}
                          draggableId={order.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.85 : 1,
                              }}
                            >
                              <KanbanCard
                                order={order}
                                isUpdating={updatingId === order.id}
                                onStatusChange={async (id, status) => {
                                  setOrders((prev) =>
                                    prev.map((o) =>
                                      o.id === id ? { ...o, status } : o,
                                    ),
                                  );
                                  await onStatusChange(id, status);
                                }}
                                onSendWhatsApp={onSendWhatsApp}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
