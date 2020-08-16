export class TaskManager {
  private tasks = []

  add (task: Function) {
    this.tasks.push(task)
  }

  run () {
    const tasks = this.tasks
    this.tasks = []
    tasks.forEach(tasks => tasks())
  }
}