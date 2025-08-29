export class CreateTaskDto {
  title: string;
  description: string;
  deadline?: Date; // Optional field for deadline
  isDone?: boolean; // Optional field for task completion status
}
