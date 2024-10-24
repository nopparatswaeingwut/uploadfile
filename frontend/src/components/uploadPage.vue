<template>
  <div class="container mt-5">
    <h2>Upload Files</h2>
    <div 
      class="border border-dashed p-5 text-center mb-3" 
      @dragover.prevent 
      @drop.prevent="handleDrop"
      @click="$refs.fileInput.click()"
    >
      <p>Drag files here or <strong>Click to select file</strong></p>
      <input 
        type="file" 
        class="d-none" 
        ref="fileInput" 
        @change="handleFileUpload" 
        multiple
      >
      
      <div class="preview-area mt-3">
        <div class="file-preview-container">
          <div v-for="(file, index) in selectedFiles" :key="index" class="file-preview text-center">
            <div v-if="isImage(file)">
              <i class="bi bi-file-image" style="font-size: 50px;"></i>
            </div>
            <div v-else-if="isVideo(file)">
              <i class="bi bi-file-play" style="font-size: 50px;"></i>
            </div>
            <div v-else>
              <i class="bi bi-file-earmark" style="font-size: 50px;"></i>
            </div>
            <p>{{ truncateFileName(file.name) }}</p>
          </div>
        </div>
      </div>
    </div>

    <button class="btn btn-primary" @click="submitFiles" :disabled="!selectedFiles.length">Upload</button>

    <h2 class="mt-5">Files</h2>
    <table class="table table-bordered mt-3">
      <thead>
        <tr>
          <th>#</th>
          <th>File Name</th>
          <th>Upload Date</th>
          <th>URL</th>
          <th>Action</th> <!-- เพิ่มคอลัมน์สำหรับปุ่มลบ -->
        </tr>
      </thead>
      <tbody>
        <tr v-for="(file, index) in paginatedFiles" :key="index">
          <td>{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
          <td>{{ file.filename }}</td>
          <td>{{ new Date(file.uploadDate).toLocaleString() }}</td>
          <td><a :href="file.url" target="_blank">View</a></td>
          <td>
            <button 
              class="btn btn-danger btn-sm" 
              @click="deleteFile(file._id)"
            >Delete</button> <!-- ปุ่มลบ -->
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button 
        class="btn btn-secondary" 
        @click="prevPage" 
        :disabled="currentPage === 1"
      >Previous</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button 
        class="btn btn-secondary" 
        @click="nextPage" 
        :disabled="currentPage === totalPages"
      >Next</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UploadPage',
  data() {
    return {
      selectedFiles: [],
      uploadedFiles: [],
      itemsPerPage: 5,
      currentPage: 1
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.uploadedFiles.length / this.itemsPerPage);
    },
    paginatedFiles() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.uploadedFiles.slice(start, start + this.itemsPerPage);
    }
  },
  methods: {
    handleFileUpload(event) {
      const files = Array.from(event.target.files);
      if (this.selectedFiles.length + files.length > 10) {
        alert('คุณสามารถอัพโหลดไฟล์ได้สูงสุด 10 ไฟล์เท่านั้น');
        return;
      }
      this.selectedFiles = [...this.selectedFiles, ...files];
    },
    handleDrop(event) {
      const files = Array.from(event.dataTransfer.files);
      if (this.selectedFiles.length + files.length > 10) {
        alert('คุณสามารถอัพโหลดไฟล์ได้สูงสุด 10 ไฟล์เท่านั้น');
        return;
      }
      this.selectedFiles = [...this.selectedFiles, ...files];
    },
    isImage(file) {
      return file && file['type'].split('/')[0] === 'image';
    },
    isVideo(file) {
      return file && file['type'].split('/')[0] === 'video';
    },
    truncateFileName(fileName) {
      return fileName.length > 10 ? fileName.slice(0, 10) + '...' : fileName;
    },
    async submitFiles() {
      if (!this.selectedFiles.length) {
        alert('Please select files to upload.');
        return;
      }

      const formData = new FormData();
      this.selectedFiles.forEach(file => {
        formData.append('files[]', file);
      });

      try {
        const response = await fetch('http://localhost:3000/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          alert('Files uploaded successfully: ' + result.files.join(', '));
          this.selectedFiles = [];
          this.fetchUploadedFiles(); 
        } else {
          const errorResponse = await response.json();
          alert('File upload failed: ' + errorResponse.message);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('File upload failed due to a network or server error.');
      }
    },
    async fetchUploadedFiles() {
      try {
        const response = await fetch('http://localhost:3000/files');
        if (response.ok) {
          this.uploadedFiles = await response.json(); 
        } else {
          console.error('Failed to fetch uploaded files');
        }
      } catch (error) {
        console.error('Error fetching uploaded files:', error);
      }
    },
    async deleteFile(fileId) {
      if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้?')) {
        try {
          const response = await fetch(`http://localhost:3000/files/${fileId}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            alert('File deleted successfully');
            this.fetchUploadedFiles(); 
          } else {
            const errorResponse = await response.json();
            alert('File deletion failed: ' + errorResponse.message);
          }
        } catch (error) {
          console.error('Error deleting file:', error);
          alert('File deletion failed due to a network or server error.');
        }
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    }
  },
  mounted() {
    this.fetchUploadedFiles();
  }
};
</script>

<style scoped>
.container {
  max-width: 600px;
}
.file-preview-container {
  display: flex;
  overflow-x: auto; 
  scrollbar-width: thin;
}
.file-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 30px; 
  margin-top: 0;
}
.preview-area {
  max-height: 130px; 
}
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}
</style>
