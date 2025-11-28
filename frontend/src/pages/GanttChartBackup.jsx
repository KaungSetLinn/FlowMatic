import { Gantt, Willow } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";

const GanttChartBackup = () => {
  const tasks = [
    {
      id: 20,
      text: "NewTask",
      start: new Date(2024, 5, 11),
      end: new Date(2024, 5, 25),
      duration: 1,
      progress: 0.2, // 20%
      type: "task",
      lazy: false,
      parent: null,
    },
    {
      id: 47,
      text: "[1] Master project",
      start: new Date(2024, 5, 12),
      end: new Date(2024, 7, 12),
      duration: 8,
      progress: 0,
      type: "summary",
      parent: null,
    },
    {
      id: 22,
      text: "Task",
      start: new Date(2024, 7, 11),
      end: new Date(2024, 8, 12),
      duration: 8,
      progress: 0,
      type: "task",
      parent: 47,
    },
    {
      id: 21,
      text: "New Task 2",
      start: new Date(2024, 7, 10),
      end: new Date(2024, 8, 12),
      duration: 3,
      progress: 0,
      type: "task",
      lazy: false,
      parent: null,
    },
  ];

  const links = [
    { id: 1, source: 20, target: 21, type: "finish_to_start" }
  ];

  const scales = [
    { unit: "month", step: 1, format: "MMMM yyyy" },
    { unit: "day", step: 1, format: "d" },
  ];

  return (
    <div className="max-w-7xl">
        <Willow>
      <Gantt
  tasks={tasks}
  links={links}
  scales={scales}
  columnWidth={30}  // width per time unit in px (default may be 60)
  barHeight={24}
/>

      </Willow>
    </div>
  );
};

export default GanttChartBackup;
