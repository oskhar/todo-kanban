<script setup lang="ts">
/**
 * File: src/App.vue
 * Deskripsi: Kode ini telah direvisi total untuk menggunakan backend API sebagai sumber kebenaran.
 * Semua operasi (Create, Read, Update, Delete) sekarang ditangani melalui
 * panggilan fetch ke endpoint http://localhost:3000/tasks.
 */
import { ref, onMounted } from 'vue'
import { useDragAndDrop, DragAndDropEvent } from '@formkit/drag-and-drop/vue'

// =================================================================
// INTERFACES & API CONFIG
// =================================================================

const API_URL = 'http://localhost:3000/tasks'

// Tipe data Task sekarang mencakup 'status' untuk menentukan di papan mana ia berada.
type TaskStatus = 'todo' | 'progress' | 'done'

interface Task {
  id: string
  title: string
  status: TaskStatus
}

// =================================================================
// STATE MANAGEMENT & DRAG AND DROP SETUP
// =================================================================

// [DIPERBAIKI] useDragAndDrop mengembalikan sebuah array [parent, values].
// Kita menggunakan array destructuring untuk mendapatkan ref yang benar.
const [todoNode, todoTasks] = useDragAndDrop<Task>([], { group: 'kanban' })
const [progressNode, progressTasks] = useDragAndDrop<Task>([], {
  group: 'kanban',
})
const [doneNode, doneTasks] = useDragAndDrop<Task>([], { group: 'kanban' })

// State untuk UI
const newTaskTitle = ref('')
const isLoading = ref(true) // State untuk menampilkan indikator loading
const errorMessage = ref<string | null>(null) // State untuk menampilkan pesan error

// =================================================================
// API FUNCTIONS (Best Practices)
// =================================================================

/**
 * Mengambil semua tugas dari backend dan mengisi papan.
 */
async function fetchTasks() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const response = await fetch(API_URL)
    if (!response.ok) {
      throw new Error(`Gagal mengambil data: ${response.statusText}`)
    }
    const tasks: Task[] = await response.json()

    // Kosongkan papan sebelum mengisi dengan data baru
    todoTasks.value = []
    progressTasks.value = []
    doneTasks.value = []

    // Pisahkan tugas ke papan yang sesuai berdasarkan status
    tasks.forEach((task) => {
      if (task.status === 'todo') {
        todoTasks.value.push(task)
      } else if (task.status === 'progress') {
        progressTasks.value.push(task)
      } else if (task.status === 'done') {
        doneTasks.value.push(task)
      }
    })
  } catch (error: any) {
    errorMessage.value = error.message || 'Terjadi kesalahan saat menghubungi server.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

/**
 * Menambah tugas baru melalui API.
 */
async function addTask() {
  if (!newTaskTitle.value.trim()) return

  // Hanya kirim data yang dibutuhkan oleh backend (CreateTaskDto).
  const taskData = {
    title: newTaskTitle.value.trim(),
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    })

    // Backend akan merespon dengan status 201 (Created) jika berhasil.
    if (!response.ok) {
      // Coba baca pesan error dari body jika ada
      const errorData = await response.json().catch(() => null)
      const message = errorData?.message || 'Gagal menambahkan tugas baru.'
      throw new Error(Array.isArray(message) ? message.join(', ') : message)
    }

    const newTask: Task = await response.json()
    todoTasks.value.push(newTask) // Tambahkan ke UI setelah berhasil
    newTaskTitle.value = '' // Kosongkan input
  } catch (error: any) {
    errorMessage.value = error.message
    console.error(error)
  }
}

/**
 * Menghapus tugas secara permanen melalui API.
 */
async function deleteTask(taskToDelete: Task) {
  try {
    const response = await fetch(`${API_URL}/${taskToDelete.id}`, {
      method: 'DELETE',
    })

    // Backend akan merespon dengan 204 No Content, yang dianggap 'ok'.
    if (!response.ok) {
      throw new Error('Gagal menghapus tugas.')
    }

    // Hapus dari UI setelah berhasil
    const lists = [todoTasks, progressTasks, doneTasks]
    for (const list of lists) {
      const index = list.value.findIndex((task) => task.id === taskToDelete.id)
      if (index !== -1) {
        list.value.splice(index, 1)
        break
      }
    }
  } catch (error: any) {
    errorMessage.value = error.message
    console.error(error)
  }
}

/**
 * Mengupdate status tugas saat dipindahkan antar papan.
 */
async function handleTaskMove(event: DragAndDropEvent) {
  const taskId = (event.detail.targetData.node.el as HTMLElement).dataset.id
  const newBoardId = (event.detail.targetData.parent.el as HTMLElement).id as TaskStatus

  if (!taskId || !newBoardId) return

  try {
    const response = await fetch(`${API_URL}/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newBoardId }),
    })

    if (!response.ok) {
      throw new Error('Gagal memindahkan tugas. Mengembalikan ke posisi semula.')
    }
    // Jika berhasil, UI sudah diupdate oleh library, jadi tidak perlu melakukan apa-apa.
    console.log(`Tugas ${taskId} berhasil dipindahkan ke ${newBoardId}`)
  } catch (error: any) {
    errorMessage.value = error.message
    console.error(error)
    // Jika gagal, ambil ulang semua data untuk memastikan UI konsisten dengan server
    await fetchTasks()
  }
}

// =================================================================
// LIFECYCLE HOOK
// =================================================================

onMounted(async () => {
  // Ambil data saat komponen dimuat
  await fetchTasks()

  // Pasang event listener untuk menangani perpindahan tugas
  todoNode.value?.addEventListener('end', handleTaskMove)
  progressNode.value?.addEventListener('end', handleTaskMove)
  doneNode.value?.addEventListener('end', handleTaskMove)
})
</script>

<template>
  <main class="bg-slate-900 min-h-screen text-slate-300 p-4 sm:p-6 md:p-8 font-['Inter'] flex flex-col">
    <div class="max-w-full mx-auto w-full flex-grow flex flex-col">
      <!-- Header -->
      <header class="flex justify-between items-center mb-8 flex-shrink-0">
        <h1 class="text-3xl font-bold text-white">
          <span class="text-indigo-400">Kanban</span> Board
        </h1>
      </header>

      <!-- Error Message -->
      <div v-if="errorMessage" class="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg mb-6 text-center">
        <strong>Error:</strong> {{ errorMessage }}
      </div>

      <!-- Form Tambah Tugas -->
      <div class="mb-8 flex-shrink-0">
        <form @submit.prevent="addTask" class="flex flex-col sm:flex-row gap-3">
          <input type="text" v-model="newTaskTitle" placeholder="Tulis tugas baru di sini..."
            class="flex-grow bg-slate-800 border-2 border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50"
            :disabled="isLoading" />
          <button type="submit"
            class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 disabled:bg-indigo-800 disabled:cursor-not-allowed"
            :disabled="isLoading || !newTaskTitle.trim()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Tambah</span>
          </button>
        </form>
      </div>

      <!-- Loading Indicator -->
      <div v-if="isLoading" class="flex justify-center items-center flex-grow">
        <div class="text-lg text-slate-400">Memuat data...</div>
      </div>

      <!-- Papan Kanban -->
      <div v-else class="flex-grow overflow-x-auto pb-4 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8">
        <div class="flex gap-6 min-h-full">
          <!-- Papan Todo -->
          <div class="flex-shrink-0 w-80 bg-slate-800/80 rounded-xl p-4 flex flex-col shadow-lg">
            <h2 class="font-bold text-lg mb-4 text-white border-b-2 border-b-red-500/50 pb-2 flex-shrink-0">
              Tugas Baru ({{ todoTasks.length }})
            </h2>
            <ul ref="todoNode" id="todo" class="space-y-3 min-h-[150px] flex-grow overflow-y-auto pr-2">
              <li v-for="task in todoTasks" :key="task.id" :data-id="task.id"
                class="bg-slate-700 p-3 rounded-lg cursor-grab active:cursor-grabbing flex justify-between items-center group shadow-md hover:shadow-lg hover:bg-slate-600 transition-all duration-200">
                <span class="break-words text-sm">{{ task.title }}</span>
                <button @click="deleteTask(task)"
                  class="text-slate-500 hover:text-red-400 font-bold transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100">
                  &#x2715;
                </button>
              </li>
              <div v-if="todoTasks.length === 0"
                class="text-center text-slate-500 text-sm p-6 border-2 border-dashed border-slate-700 rounded-lg">
                Seret tugas ke sini
              </div>
            </ul>
          </div>

          <!-- Papan On Progress -->
          <div class="flex-shrink-0 w-80 bg-slate-800/80 rounded-xl p-4 flex flex-col shadow-lg">
            <h2 class="font-bold text-lg mb-4 text-white border-b-2 border-b-yellow-500/50 pb-2 flex-shrink-0">
              Dikerjakan ({{ progressTasks.length }})
            </h2>
            <ul ref="progressNode" id="progress" class="space-y-3 min-h-[150px] flex-grow overflow-y-auto pr-2">
              <li v-for="task in progressTasks" :key="task.id" :data-id="task.id"
                class="bg-slate-700 p-3 rounded-lg cursor-grab active:cursor-grabbing flex justify-between items-center group shadow-md hover:shadow-lg hover:bg-slate-600 transition-all duration-200">
                <span class="break-words text-sm">{{ task.title }}</span>
                <button @click="deleteTask(task)"
                  class="text-slate-500 hover:text-red-400 font-bold transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100">
                  &#x2715;
                </button>
              </li>
              <div v-if="progressTasks.length === 0"
                class="text-center text-slate-500 text-sm p-6 border-2 border-dashed border-slate-700 rounded-lg">
                Seret tugas ke sini
              </div>
            </ul>
          </div>

          <!-- Papan Done -->
          <div class="flex-shrink-0 w-80 bg-slate-800/80 rounded-xl p-4 flex flex-col shadow-lg">
            <h2 class="font-bold text-lg mb-4 text-white border-b-2 border-b-green-500/50 pb-2 flex-shrink-0">
              Selesai ({{ doneTasks.length }})
            </h2>
            <ul ref="doneNode" id="done" class="space-y-3 min-h-[150px] flex-grow overflow-y-auto pr-2">
              <li v-for="task in doneTasks" :key="task.id" :data-id="task.id"
                class="bg-slate-700 p-3 rounded-lg cursor-grab active:cursor-grabbing flex justify-between items-center group shadow-md hover:shadow-lg hover:bg-slate-600 transition-all duration-200">
                <span class="break-words text-sm text-slate-400 line-through">{{
                  task.title
                  }}</span>
                <button @click="deleteTask(task)"
                  class="text-slate-500 hover:text-red-400 font-bold transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100">
                  &#x2715;
                </button>
              </li>
              <div v-if="doneTasks.length === 0"
                class="text-center text-slate-500 text-sm p-6 border-2 border-dashed border-slate-700 rounded-lg">
                Seret tugas ke sini
              </div>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
