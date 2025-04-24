const { model } = require("mongoose");
const Tasks = require("../../database/Models/Tasks");
const authMiddleware = require("../auth/authMiddleware");

const appRouter = require("express").Router();

appRouter.put("/update-task", authMiddleware, async (req, res) => {
  try {
    const { taskId, status } = req.body;
    const user = req.user;

    console.log(taskId, status, user);

    if (!taskId) {
      return res.status(404).json({
        message: "Something went wrong while updating",
        status: "Error",
      });
    }
    const updateTaskStatus = await Tasks.findByIdAndUpdate(
      taskId,
      {
        taskStatus: status,
      },
      { new: true }
    );

    return res.status(201).json({
      message: "Updated Task Successfully",
      status: "Success",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      status: "Error",
    });
  }
});

module.exports = appRouter;
