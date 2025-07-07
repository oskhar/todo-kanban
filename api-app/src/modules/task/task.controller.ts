// =================================================================
// CONTROLLER
// Lokasi: src/tasks/tasks.controller.ts
// Deskripsi: Controller menangani request HTTP yang masuk dan mendelegasikannya
// ke service yang sesuai.
// =================================================================

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe, // Pipe untuk validasi bahwa parameter adalah UUID
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { TaskService } from './task.service';

// @Controller('tasks') mendefinisikan base route untuk semua endpoint di dalam class ini.
// Semua request ke /tasks akan diarahkan ke sini.
@Controller('tasks')
export class TaskController {
  // Melakukan dependency injection untuk TasksService.
  // NestJS akan secara otomatis menyediakan instance dari TasksService.
  constructor(private readonly tasksService: TaskService) {}

  /**
   * Endpoint untuk membuat tugas baru.
   * Method: POST
   * Path: /tasks
   * Sesuai dengan operationId: createTask
   */
  @Post()
  // OpenAPI menyebutkan 211, namun 201 (Created) adalah status code standar HTTP.
  // Kita bisa menggunakan @HttpCode untuk menggantinya jika perlu.
  @HttpCode(HttpStatus.CREATED)
  createTask(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    // Memanggil service untuk menangani logika bisnis pembuatan task.
    // DTO memastikan data yang masuk sudah valid.
    return this.tasksService.create(createTaskDto);
  }

  /**
   * Endpoint untuk mendapatkan semua tugas.
   * Method: GET
   * Path: /tasks
   * Sesuai dengan operationId: getTasks
   */
  @Get()
  getTasks(): Promise<Task[]> {
    return this.tasksService.findAll();
  }

  /**
   * Endpoint untuk memperbarui status tugas.
   * Method: PATCH
   * Path: /tasks/:id
   * Sesuai dengan operationId: updateTaskStatus
   */
  @Patch(':id')
  updateTaskStatus(
    // ParseUUIDPipe akan otomatis memvalidasi apakah 'id' adalah UUID yang valid.
    // Jika tidak, NestJS akan melempar error 400 Bad Request secara otomatis.
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.updateStatus(id, updateTaskDto.status);
  }

  /**
   * Endpoint untuk menghapus tugas.
   * Method: DELETE
   * Path: /tasks/:id
   * Sesuai dengan operationId: deleteTask
   */
  @Delete(':id')
  // Menetapkan status code 204 No Content untuk respons yang berhasil,
  // sesuai dengan standar RESTful dan OpenAPI.
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTask(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tasksService.remove(id);
  }
}
