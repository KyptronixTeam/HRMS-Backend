const appRouter = require("express").Router();
const Task = require("../../database/Models/Tasks");
const Users = require("../../database/Models/Users");

// create new task...

appRouter.post("/create-task", async (req, res) => {
  try {
    // get the task information..
    const {
      employeeName,
      taskTitle,
      priority,
      deadLine,
      description,
      assignedToID,
      assignedByID,
      taskType
    } = req.body;

    // create the new task...
    const createNewTask = new Task({
      employeeName,
      taskTitle,
      taskPriority: priority,
      deadLine,
      taskDescription: description,
      assignedToID,
      assignedByID,
      taskType
    });
    // save the task in db..
    const createdTaskId = await createNewTask.save();
    if (createNewTask) {
      const getEmployee = await Users.findById(assignedToID);
      getEmployee.tasks.push(createdTaskId._id);

      const taskAdd = await getEmployee.save();

      // responce back to client..
      res.status(200).json({
        message: "Task created successfully",
        status: "Success",
      });
    }
    //  console.log(createdTaskId)
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      status: "Error",
    });
  }
});

module.exports = appRouter;
