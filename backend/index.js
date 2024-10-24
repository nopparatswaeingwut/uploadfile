const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3000;
app.use(cors());

const uploadDirectory = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

mongoose.connect('mongodb://localhost:27017/uploadDB')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

const fileSchema = new mongoose.Schema({
  filename: String,
  index: Number,
  uploadDate: { type: Date, default: Date.now }
});

const File = mongoose.model('File', fileSchema);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.array('files[]', 10), async (req, res) => {
  if (!req.files) {
    return res.status(400).json({ message: 'No files uploaded!' });
  }

  try {
    const existingFilesCount = await File.countDocuments();

    const fileDocs = req.files.map((file, i) => ({
      filename: file.filename,
      index: existingFilesCount + i + 1
    }));

    await File.insertMany(fileDocs);
    const fileNames = req.files.map(file => file.filename);
    res.status(200).json({ message: 'Files uploaded successfully!', files: fileNames });
  } catch (error) {
    console.error('Error saving file data:', error);
    res.status(500).json({ message: 'File upload failed!' });
  }
});

app.get('/files', async (req, res) => {
  try {
    const files = await File.find({}, 'filename index uploadDate');
    const filesWithUrls = files.map(file => ({
      ...file.toObject(),
      url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
    }));
    res.status(200).json(filesWithUrls);
  } catch (error) {
    console.error('Error fetching file data:', error);
    res.status(500).json({ message: 'Failed to fetch files!' });
  }
});

app.delete('/files/:id', async (req, res) => {
  const fileId = req.params.id;

  try {

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found!' });
    }

    const filePath = path.join(uploadDirectory, file.filename);
    fs.unlink(filePath, async (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        return res.status(500).json({ message: 'Failed to delete file from server!' });
      }
      await File.deleteOne({ _id: fileId });
      res.status(200).json({ message: 'File deleted successfully!' });
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Failed to delete file!' });
  }
});

app.use('/uploads', express.static(uploadDirectory));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
