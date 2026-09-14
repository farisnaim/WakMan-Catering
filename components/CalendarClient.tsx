"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

interface CalendarClientProps {
  dateClick: (arg: any) => void;
  dayCellContent: (dayInfo: any) => JSX.Element;
}

export default function CalendarClient({
  dateClick,
  dayCellContent,
}: CalendarClientProps) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek",
      }}
      dateClick={dateClick}
      dayCellContent={dayCellContent}
      height="auto"
    />
  );
}
