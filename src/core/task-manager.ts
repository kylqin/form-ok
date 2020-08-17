export type Task = () => void

export class TaskManager {
  private tasks: Task[] = []

  add (task: Task) {
    this.tasks.push(task)
  }

  run () {
    const tasks = this.tasks
    this.tasks = []
    tasks.forEach(tasks => tasks())
  }
}