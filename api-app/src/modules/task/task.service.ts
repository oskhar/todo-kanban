// =================================================================
// SERVICE
// Lokasi: src/tasks/tasks.service.ts
// Deskripsi: Service ini berisi semua logika bisnis untuk mengelola tugas.
// Ini berinteraksi langsung dengan database melalui TypeORM Repository.
// =================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './enums/task-status.enum';

// @Injectable() menandakan bahwa class ini dapat dikelola oleh NestJS IoC container.
// Artinya, NestJS dapat melakukan dependency injection pada class ini.
@Injectable()
export class TaskService {
  // Melakukan dependency injection untuk TypeORM Repository yang berasosiasi dengan entitas Task.
  // Dengan ini, kita bisa menggunakan methods seperti .create(), .save(), .find(), .delete()
  // untuk berinteraksi dengan tabel 'tasks' di database.
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  /**
   * Membuat tugas baru dan menyimpannya ke database.
   * @param createTaskDto - Objek yang berisi data untuk tugas baru (hanya judul).
   * @returns {Promise<Task>} Objek tugas yang baru saja dibuat.
   */
  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    // Membuat instance entitas Task baru dengan data dari DTO.
    // Status akan secara otomatis diatur ke 'todo' berdasarkan default di entitas.
    const task = this.taskRepository.create({
      title: createTaskDto.title,
    });

    // Menyimpan entitas baru ke database.
    await this.taskRepository.save(task);

    return task;
  }

  /**
   * Mengambil semua tugas dari database.
   * @returns {Promise<Task[]>} Array dari semua tugas.
   */
  async findAll(): Promise<Task[]> {
    // Menggunakan method find() dari repository untuk mendapatkan semua record.
    return this.taskRepository.find();
  }

  /**
   * Mencari satu tugas berdasarkan ID-nya.
   * Ini adalah helper method internal yang akan digunakan oleh method lain.
   * @param id - UUID dari tugas yang dicari.
   * @returns {Promise<Task>} Objek tugas yang ditemukan.
   * @throws {NotFoundException} Jika tugas dengan ID tersebut tidak ditemukan.
   */
  private async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOneBy({ id });

    if (!task) {
      // Melempar exception standar NestJS. Nest akan otomatis mengubahnya
      // menjadi respons HTTP 404 Not Found.
      throw new NotFoundException(`Tugas dengan ID "${id}" tidak ditemukan.`);
    }

    return task;
  }

  /**
   * Memperbarui status dari sebuah tugas.
   * @param id - UUID dari tugas yang akan diperbarui.
   * @param status - Status baru untuk tugas.
   * @returns {Promise<Task>} Objek tugas yang telah diperbarui.
   */
  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    // Pertama, cari tugasnya. Method findOne akan melempar error jika tidak ada.
    const task = await this.findOne(id);

    console.log('Task: ', task);

    // Ubah statusnya.
    task.status = status;

    // Simpan perubahan ke database. TypeORM cukup pintar untuk mengetahui
    // bahwa ini adalah operasi UPDATE, bukan INSERT.
    await this.taskRepository.save(task);

    return task;
  }

  /**
   * Menghapus sebuah tugas (soft delete).
   * @param id - UUID dari tugas yang akan dihapus.
   * @returns {Promise<void>} Tidak mengembalikan apa-apa.
   * @throws {NotFoundException} Jika tugas dengan ID tersebut tidak ditemukan untuk dihapus.
   */
  async remove(id: string): Promise<void> {
    // Menggunakan softDelete untuk mengisi kolom 'deletedAt' daripada menghapus record.
    const result = await this.taskRepository.softDelete(id);

    // softDelete mengembalikan objek DeleteResult yang berisi jumlah baris yang terpengaruh.
    // Jika tidak ada baris yang terpengaruh, berarti ID tidak ditemukan.
    if (result.affected === 0) {
      throw new NotFoundException(`Tugas dengan ID "${id}" tidak ditemukan.`);
    }
  }
}
