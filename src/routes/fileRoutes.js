import express from 'express';
const router = express.Router();
import * as fileController from '../controllers/fileController.js';
import auth from '../middlewares/auth.js';
import multer from 'multer';

const upload = multer({ dest: 'src/uploads/' });

router.post('/upload', auth, upload.single('file'), fileController.uploadFile);
router.get('/', auth, fileController.listFiles);
router.get('/download/:id', auth, fileController.downloadFile);
export default router;