import { Router } from 'express';
import prisma from '../../config/database.js';
import { authenticate, requireEditor, AuthRequest } from '../../middleware/auth.middleware.js';
import { AppError } from '../../middleware/error.middleware.js';
import googleDriveService from '../../services/google-drive.service.js';
import { uploadContent } from '../../middleware/upload.middleware.js';

const router = Router();

// File type categories (Jenis File)
const FILE_TYPE_CATEGORIES: Record<string, { name: string; extensions: string[] }> = {
    media_cetak: { name: 'Media Cetak', extensions: ['psd', 'ai', 'cdr', 'afphoto', 'afdesign', 'indd', 'pdf', 'eps', 'tiff', 'tif'] },
    video: { name: 'Video', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'm4v'] },
    konten_sosmed: { name: 'Konten Sosmed', extensions: ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif', 'ico', 'mp4', 'mov'] }
};


// Get file type category from extension
function getFileTypeCategory(extension: string): string {
    const ext = extension.toLowerCase().replace('.', '');
    for (const [category, config] of Object.entries(FILE_TYPE_CATEGORIES)) {
        if (config.extensions.includes(ext)) {
            return category;
        }
    }
    return 'media_cetak'; // default to media_cetak
}


// GET /api/content-database - List with pagination
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { page = '1', limit = '20', fileType, search, year } = req.query;

        const where: any = {};

        if (fileType && fileType !== 'all') {
            where.fileType = fileType;
        }

        if (year) {
            const y = parseInt(year as string);
            where.uploadDate = {
                gte: new Date(y, 0, 1),
                lte: new Date(y, 11, 31, 23, 59, 59)
            };
        }

        if (search) {
            where.OR = [
                { title: { contains: search as string } },
                { fileName: { contains: search as string } },
                { tags: { contains: search as string } }
            ];
        }

        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 20;

        const [files, total] = await Promise.all([
            (prisma as any).contentDatabase.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    createdBy: { select: { username: true } }
                }
            }),
            (prisma as any).contentDatabase.count({ where })
        ]);

        // Convert BigInt to string for serialization
        const serializedFiles = files.map((f: any) => ({
            ...f,
            fileSize: f.fileSize?.toString() || '0'
        }));

        res.json({
            files: serializedFiles,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/content-database/reports/years - Available years
router.get('/reports/years', authenticate, async (req, res, next) => {
    try {
        const files = await (prisma as any).contentDatabase.findMany({
            select: { uploadDate: true },
            orderBy: { uploadDate: 'desc' }
        });

        const uniqueYears = [...new Set(files.map((f: any) => new Date(f.uploadDate).getFullYear()))] as number[];
        res.json({ years: uniqueYears.sort((a, b) => b - a) });
    } catch (error) {
        next(error);
    }
});

// GET /api/content-database/reports/quarterly - Quarterly Report
router.get('/reports/quarterly', authenticate, async (req, res, next) => {
    try {
        const { year, quarter } = req.query;

        if (!year || !quarter) {
            throw new AppError('Year and quarter are required', 400);
        }

        const y = parseInt(year as string);
        const q = parseInt(quarter as string);

        // Calculate date range for quarter
        const startMonth = (q - 1) * 3;
        const startDate = new Date(y, startMonth, 1);
        const endDate = new Date(y, startMonth + 3, 0, 23, 59, 59);

        // Fetch files for the period
        const files = await (prisma as any).contentDatabase.findMany({
            where: {
                uploadDate: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                createdBy: { select: { username: true } }
            },
            orderBy: { uploadDate: 'asc' }
        });

        // Calculate statistics
        const totalFiles = files.length;
        const totalSize = files.reduce((acc: number, f: any) => acc + (f.fileSize ? Number(f.fileSize) : 0), 0);

        // Distribution by type
        const typeCount: Record<string, number> = {};
        files.forEach((f: any) => {
            typeCount[f.fileType] = (typeCount[f.fileType] || 0) + 1;
        });

        const byFileType = Object.entries(typeCount).map(([name, count]) => {
            let color = '#64748b'; // default slate
            if (name === 'media_cetak') color = '#db2777'; // pink
            if (name === 'video') color = '#9333ea'; // purple
            if (name === 'konten_sosmed') color = '#2563eb'; // blue

            return {
                name: FILE_TYPE_CATEGORIES[name]?.name || name,
                type: name,
                count,
                color
            };
        }).sort((a, b) => b.count - a.count);

        // Distribution by month
        const monthlyData: Record<number, number> = {};
        // Initialize months in quarter
        for (let i = 0; i < 3; i++) {
            monthlyData[startMonth + i] = 0;
        }

        files.forEach((f: any) => {
            const month = new Date(f.uploadDate).getMonth();
            monthlyData[month] = (monthlyData[month] || 0) + 1;
        });

        const byMonth = Object.entries(monthlyData).map(([monthIdx, count]) => {
            const date = new Date(y, parseInt(monthIdx), 1);
            return {
                month: parseInt(monthIdx),
                monthName: date.toLocaleString('id-ID', { month: 'long' }),
                count
            };
        });

        // Most popular type
        const mostPopularType = byFileType.length > 0 ? byFileType[0].name : '-';

        // Prepare response
        const report = {
            period: {
                year: y,
                quarter: q,
                quarterName: `Triwulan ${q}`,
                startDate,
                endDate
            },
            statistics: {
                totalFiles,
                totalSize,
                mostPopularType,
                byFileType,
                byMonth
            },
            files: files.map((f: any) => ({
                ...f,
                fileSize: f.fileSize?.toString() || '0'
            }))
        };

        res.json({ report });
    } catch (error) {
        next(error);
    }
});

// GET /api/content-database/:id
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const file = await (prisma as any).contentDatabase.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                createdBy: { select: { username: true } }
            }
        });

        if (!file) {
            throw new AppError('File not found', 404);
        }

        res.json({
            file: {
                ...file,
                fileSize: file.fileSize?.toString() || '0'
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/content-database - Upload SINGLE file (backward compatible)
router.post('/', authenticate, requireEditor, uploadContent.array('files', 50), async (req: AuthRequest, res, next) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            throw new AppError('No files uploaded', 400);
        }

        const { description, notes, tags, fileType: customFileType, uploadDate } = req.body;
        // For bulk upload, title can be a single string or comma-separated per file
        const titles = req.body.title ? (Array.isArray(req.body.title) ? req.body.title : [req.body.title]) : [];

        const now = uploadDate ? new Date(uploadDate) : new Date();
        const dateStr = now.toISOString().split('T')[0];

        const results: any[] = [];
        const errors: any[] = [];

        // Process each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const title = titles[i] || file.originalname.split('.')[0];
            const originalName = file.originalname;
            const extension = originalName.split('.').pop()?.toLowerCase() || '';
            const fileType = customFileType || getFileTypeCategory(extension);
            const fileSize = file.size;
            const mimeType = file.mimetype;

            const safeTitle = title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
            const driveFileName = `${dateStr}-${safeTitle}.${extension}`;
            const categoryName = FILE_TYPE_CATEGORIES[fileType]?.name || 'Media Cetak';

            let driveFileId: string | null = null;
            let driveFileUrl: string | null = null;
            let driveFolderId: string | null = null;
            let driveFolderPath: string | null = null;

            try {
                const folderResult = await googleDriveService.createContentDatabaseFolder(now, categoryName);
                driveFolderId = folderResult.folderId;
                driveFolderPath = folderResult.folderPath;

                const uploadResult = await googleDriveService.uploadContentFile(
                    file,
                    driveFileName,
                    driveFolderId!
                );

                driveFileId = uploadResult.id;
                driveFileUrl = uploadResult.webViewLink;
            } catch (driveError: any) {
                console.error(`Google Drive upload failed for ${originalName}:`, driveError);
            }

            try {
                const dbFile = await (prisma as any).contentDatabase.create({
                    data: {
                        title,
                        description: description || null,
                        fileType,
                        fileExtension: extension,
                        fileName: driveFileName,
                        originalName,
                        fileSize: BigInt(fileSize),
                        mimeType,
                        uploadDate: now,
                        driveFileId,
                        driveFileUrl,
                        driveFolderId,
                        driveFolderPath,
                        notes: notes || null,
                        tags: tags || null,
                        createdById: req.user!.id
                    },
                    include: {
                        createdBy: { select: { username: true } }
                    }
                });

                results.push({
                    ...dbFile,
                    fileSize: dbFile.fileSize?.toString() || '0'
                });
            } catch (dbError: any) {
                errors.push({
                    fileName: originalName,
                    error: dbError.message || 'Failed to save to database'
                });
            }
        }

        res.status(201).json({
            success: results.length,
            failed: errors.length,
            files: results,
            errors
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/content-database/:id - Update metadata
router.put('/:id', authenticate, requireEditor, async (req: AuthRequest, res, next) => {
    try {
        const { title, description, notes, tags, fileType, uploadDate } = req.body;

        const file = await (prisma as any).contentDatabase.update({
            where: { id: parseInt(req.params.id) },
            data: {
                title,
                description,
                notes,
                tags,
                fileType,
                uploadDate: uploadDate ? new Date(uploadDate) : undefined
            },
            include: {
                createdBy: { select: { username: true } }
            }
        });

        res.json({
            file: {
                ...file,
                fileSize: file.fileSize?.toString() || '0'
            }
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/content-database/:id
router.delete('/:id', authenticate, requireEditor, async (req: AuthRequest, res, next) => {
    try {
        const file = await (prisma as any).contentDatabase.findUnique({
            where: { id: parseInt(req.params.id) }
        });

        if (!file) {
            throw new AppError('File not found', 404);
        }

        // Try to delete from Google Drive
        if (file.driveFileId) {
            try {
                await googleDriveService.deleteFile(file.driveFileId);
            } catch (driveError) {
                console.error('Failed to delete from Google Drive:', driveError);
            }
        }

        await (prisma as any).contentDatabase.delete({
            where: { id: parseInt(req.params.id) }
        });

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// =====================================================
// SHARE LINK ENDPOINTS
// =====================================================

// GET /api/content-database/reports/share-links - List share links
router.get('/reports/share-links', authenticate, async (req, res, next) => {
    try {
        const settings = await prisma.setting.findMany({
            where: {
                settingKey: { startsWith: 'content_database_report_share_' }
            }
        });

        const shareLinks = settings.map(s => {
            const data = JSON.parse(s.settingValue || '{}');
            const isExpired = data.expiresAt ? new Date(data.expiresAt) < new Date() : false;
            return { ...data, isExpired };
        });

        res.json({ shareLinks });
    } catch (error) {
        next(error);
    }
});

// POST /api/content-database/reports/share - Create share link
router.post('/reports/share', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { year, quarter, name, expiresInDays } = req.body;

        if (!year || !quarter) {
            throw new AppError('Year and quarter are required', 400);
        }

        const token = `cd-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

        const quarterNames: Record<number, string> = {
            1: 'Triwulan I', 2: 'Triwulan II', 3: 'Triwulan III', 4: 'Triwulan IV'
        };

        const settingKey = `content_database_report_share_${token}`;
        const settingValue = JSON.stringify({
            token,
            year: parseInt(year),
            quarter: parseInt(quarter),
            name: name || `Laporan Database ${quarterNames[parseInt(quarter)]} ${year}`,
            createdBy: req.user!.id,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt?.toISOString() || null,
            accessCount: 0
        });

        await prisma.setting.create({
            data: {
                settingKey,
                settingValue,
                settingType: 'json',
                description: `Share link for content database report Q${quarter} ${year}`
            }
        });

        res.status(201).json({
            shareLink: {
                token,
                url: `/content-database-report/${token}`,
                name: name || `Laporan Database ${quarterNames[parseInt(quarter)]} ${year}`,
                expiresAt
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/content-database/reports/shared/:token - Public access (no auth)
router.get('/reports/shared/:token', async (req, res, next) => {
    try {
        const { token } = req.params;
        const settingKey = `content_database_report_share_${token}`;

        const setting = await prisma.setting.findUnique({
            where: { settingKey }
        });

        if (!setting) {
            throw new AppError('Report not found', 404);
        }

        const shareData = JSON.parse(setting.settingValue || '{}');

        // Check expiration
        if (shareData.expiresAt && new Date(shareData.expiresAt) < new Date()) {
            throw new AppError('This link has expired', 410);
        }

        // Update access count
        shareData.accessCount = (shareData.accessCount || 0) + 1;
        await prisma.setting.update({
            where: { settingKey },
            data: { settingValue: JSON.stringify(shareData) }
        });

        // Generate the report data
        const y = shareData.year;
        const q = shareData.quarter;

        const startMonth = (q - 1) * 3;
        const startDate = new Date(y, startMonth, 1);
        const endDate = new Date(y, startMonth + 3, 0, 23, 59, 59);

        const quarterNames: Record<number, string> = {
            1: 'Triwulan I', 2: 'Triwulan II', 3: 'Triwulan III', 4: 'Triwulan IV'
        };

        const files = await (prisma as any).contentDatabase.findMany({
            where: {
                uploadDate: { gte: startDate, lte: endDate }
            },
            orderBy: { uploadDate: 'desc' }
        });

        const totalFiles = files.length;
        const totalSize = files.reduce((acc: number, f: any) => acc + (f.fileSize ? Number(f.fileSize) : 0), 0);

        // Type distribution
        const typeCount: Record<string, number> = {};
        files.forEach((f: any) => {
            typeCount[f.fileType] = (typeCount[f.fileType] || 0) + 1;
        });
        const byFileType = Object.entries(typeCount).map(([name, count]) => ({
            name: FILE_TYPE_CATEGORIES[name]?.name || name,
            count
        }));

        res.json({
            report: {
                name: shareData.name,
                period: {
                    year: y,
                    quarter: q,
                    quarterName: quarterNames[q],
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                },
                statistics: {
                    totalFiles,
                    totalSize,
                    byFileType
                },
                files: files.map((f: any) => ({
                    id: f.id,
                    title: f.title,
                    fileType: f.fileType,
                    fileExtension: f.fileExtension,
                    fileSize: f.fileSize?.toString() || '0',
                    uploadDate: f.uploadDate
                }))
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;
