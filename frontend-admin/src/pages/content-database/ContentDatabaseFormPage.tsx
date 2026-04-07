import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import {
    Upload,
    ArrowLeft,
    File,
    Loader2,
    X,
    FolderOpen,
    Save,
    CheckCircle2,
    XCircle,
    Clock
} from 'lucide-react'
import { format } from "date-fns"

export function ContentDatabaseFormPage() {
    const { toast } = useToast()
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditMode = !!id

    const [uploadFiles, setUploadFiles] = useState<File[]>([])
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [tags, setTags] = useState('')
    const [fileType, setFileType] = useState('')
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [existingFile, setExistingFile] = useState<any>(null)
    const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({})

    useEffect(() => {
        if (isEditMode) {
            fetchFile()
        }
    }, [id])

    const fetchFile = async () => {
        setIsLoading(true)
        try {
            const response = await api.get(`/content-database/${id}`)
            const file = response.data.file
            setExistingFile(file)
            setTitle(file.title)
            setDescription(file.description || '')
            setTags(file.tags || '')
            setFileType(file.fileType)
            if (file.uploadDate) {
                setDate(new Date(file.uploadDate))
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Gagal memuat data',
                description: 'File tidak ditemukan atau terjadi kesalahan'
            })
            navigate('/content-database')
        } finally {
            setIsLoading(false)
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const addFiles = (newFiles: File[]) => {
        setUploadFiles(prev => [...prev, ...newFiles])
    }

    const removeFile = (idx: number) => {
        setUploadFiles(prev => prev.filter((_, i) => i !== idx))
        setUploadProgress(prev => {
            const next = { ...prev }
            delete next[idx]
            return next
        })
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        const droppedFiles = e.dataTransfer.files
        if (droppedFiles && droppedFiles.length > 0) {
            addFiles(Array.from(droppedFiles))
        }
    }

    const handleSubmit = async () => {
        if (!isEditMode && uploadFiles.length === 0) {
            toast({ variant: 'destructive', title: 'Pilih file untuk diupload' })
            return
        }

        setIsUploading(true)

        try {
            if (isEditMode) {
                await api.put(`/content-database/${id}`, {
                    title,
                    description,
                    tags,
                    fileType,
                    uploadDate: date ? date.toISOString() : undefined
                })
                toast({ title: 'Data berhasil diperbarui!' })
                navigate('/content-database')
            } else {
                // Upload files one by one for progress tracking
                const successFiles: string[] = []
                const failedFiles: string[] = []

                for (let i = 0; i < uploadFiles.length; i++) {
                    const currentFile = uploadFiles[i]
                    setUploadProgress(prev => ({ ...prev, [i]: 0 }))

                    try {
                        const formData = new FormData()
                        formData.append('files', currentFile)
                        formData.append('title', title || currentFile.name.split('.')[0])
                        if (description) formData.append('description', description)
                        if (tags) formData.append('tags', tags)
                        if (fileType) formData.append('fileType', fileType)
                        if (date) formData.append('uploadDate', date!.toISOString())

                        // Use axios for upload (handles token refresh automatically)
                        await api.post('/content-database', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                            onUploadProgress: (progressEvent) => {
                                if (progressEvent.total) {
                                    const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100)
                                    setUploadProgress(prev => ({ ...prev, [i]: percent }))
                                }
                            }
                        })
                        setUploadProgress(prev => ({ ...prev, [i]: 100 }))
                        successFiles.push(currentFile.name)
                    } catch (uploadErr) {
                        console.error(`Upload failed for ${currentFile.name}:`, uploadErr)
                        setUploadProgress(prev => ({ ...prev, [i]: -1 }))
                        failedFiles.push(currentFile.name)
                    }
                }

                if (successFiles.length > 0) {
                    toast({
                        title: `${successFiles.length} file berhasil diupload!`,
                        description: failedFiles.length > 0 ? `${failedFiles.length} file gagal` : undefined
                    })
                    setTimeout(() => navigate('/content-database'), 1500)
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Semua upload gagal',
                    })
                }
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: isEditMode ? 'Gagal memperbarui data' : 'Gagal upload file',
                description: error.response?.data?.error || error.message
            })
        } finally {
            setIsUploading(false)
        }
    }

    // Calculate overall progress
    const overallProgress = uploadFiles.length > 0
        ? Math.round(Object.values(uploadProgress).reduce((a, b) => a + (b === -1 ? 100 : b), 0) / uploadFiles.length)
        : 0
    const completedCount = Object.values(uploadProgress).filter(v => v === 100 || v === -1).length

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/content-database')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        {isEditMode ? (
                            <>
                                <File className="h-6 w-6 text-primary" />
                                Edit File
                            </>
                        ) : (
                            <>
                                <FolderOpen className="h-6 w-6 text-primary" />
                                Upload File Baru
                            </>
                        )}
                    </h1>
                    <p className="text-muted-foreground">
                        {isEditMode
                            ? 'Perbarui informasi file dan kategori'
                            : 'Upload file desain, video, atau dokumen ke Google Drive'
                        }
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail File</CardTitle>
                    <CardDescription>
                        Informasi file akan disinkronkan dengan database
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Multi-file Upload Zone (Only for new uploads) */}
                    {!isEditMode && (
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">File * <span className="text-muted-foreground font-normal">(bisa banyak file sekaligus)</span></Label>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`
                                    flex flex-col items-center justify-center w-full min-h-[180px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
                                    ${isDragging
                                        ? 'border-primary bg-primary/5 scale-[1.02]'
                                        : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                    }
                                    ${uploadFiles.length > 0 ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20' : ''}
                                `}
                            >
                                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                    <div className="flex flex-col items-center justify-center py-4">
                                        {uploadFiles.length > 0 ? (
                                            <>
                                                <Upload className="h-10 w-10 text-green-500 mb-2" />
                                                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                                    {uploadFiles.length} file dipilih
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Klik atau drop untuk menambah file lagi
                                                </p>
                                            </>
                                        ) : isDragging ? (
                                            <>
                                                <Upload className="h-12 w-12 text-primary mb-3 animate-bounce" />
                                                <p className="text-lg font-medium text-primary">
                                                    Lepaskan file di sini
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-12 w-12 text-slate-400 mb-3" />
                                                <p className="text-base text-slate-600 dark:text-slate-400">
                                                    <span className="font-medium text-primary">Klik untuk memilih</span> atau seret & drop beberapa file
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    PSD, AI, CDR, MP4, MOV, PDF, DOCX, dan lainnya
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files) addFiles(Array.from(e.target.files))
                                        }}
                                    />
                                </label>
                            </div>

                            {/* File queue with progress bars */}
                            {uploadFiles.length > 0 && (
                                <div className="space-y-2">
                                    {uploadFiles.map((file, idx) => {
                                        const progress = uploadProgress[idx]
                                        const isDone = progress === 100
                                        const isFailed = progress === -1
                                        const isUploadingFile = progress !== undefined && progress >= 0 && progress < 100

                                        return (
                                            <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                                                <div className="flex-shrink-0">
                                                    {isDone ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                    ) : isFailed ? (
                                                        <XCircle className="h-5 w-5 text-red-500" />
                                                    ) : isUploadingFile ? (
                                                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                                    ) : (
                                                        <Clock className="h-5 w-5 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium truncate mr-2">{file.name}</p>
                                                        <span className="text-xs text-muted-foreground flex-shrink-0">{formatFileSize(file.size)}</span>
                                                    </div>
                                                    {(isUploadingFile || (isDone && progress! >= 0)) && (
                                                        <div className="mt-1.5 flex items-center gap-2">
                                                            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                                                <div
                                                                    className={`h-1.5 rounded-full transition-all duration-300 ${isDone ? 'bg-green-500' : 'bg-primary'}`}
                                                                    style={{ width: `${isDone ? 100 : progress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-muted-foreground min-w-[35px] text-right">
                                                                {isDone ? '100' : progress}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Remove button */}
                                                {!isUploading && progress === undefined && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-muted-foreground h-7 w-7 p-0 flex-shrink-0"
                                                        onClick={() => removeFile(idx)}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        )
                                    })}

                                    {/* Overall progress bar */}
                                    {isUploading && (
                                        <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
                                            <div className="flex justify-between text-xs mb-2">
                                                <span className="text-muted-foreground font-medium">
                                                    Total: {completedCount} / {uploadFiles.length} file selesai
                                                </span>
                                                <span className="font-bold text-primary">{overallProgress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                                <div
                                                    className="bg-gradient-to-r from-green-600 to-green-500 h-2.5 rounded-full transition-all duration-500"
                                                    style={{ width: `${overallProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Show existing file info in edit mode */}
                    {isEditMode && existingFile && (
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                            <div className="h-12 w-12 rounded bg-white dark:bg-slate-800 flex items-center justify-center border">
                                <File className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">{existingFile.fileName}</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatFileSize(parseInt(existingFile.fileSize))} • {existingFile.fileExtension.toUpperCase()}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Judul <span className="text-muted-foreground font-normal">(opsional)</span>
                        </Label>
                        <Input
                            placeholder="Nama file atau proyek..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-11"
                        />
                        <p className="text-xs text-muted-foreground">
                            {isEditMode ? 'Mengubah judul tidak akan mengubah nama file di Google Drive' : 'Jika kosong, nama file asli akan digunakan'}
                        </p>
                    </div>

                    {/* Date Picker */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Tanggal Desain</Label>
                        <Input
                            type="date"
                            className="h-11 block"
                            value={date ? format(date, "yyyy-MM-dd") : ''}
                            onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                    </div>

                    {/* Jenis File */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Jenis File</Label>
                        <Select value={fileType} onValueChange={setFileType}>
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Pilih jenis file..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="media_cetak">Media Cetak (PSD, AI, CDR, PDF, INDD)</SelectItem>
                                <SelectItem value="video">Video (MP4, MOV, AVI, MKV)</SelectItem>
                                <SelectItem value="konten_sosmed">Konten Sosmed (PNG, JPG, GIF, MP4)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Jenis kategori file
                        </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Deskripsi <span className="text-muted-foreground font-normal">(opsional)</span>
                        </Label>
                        <Textarea
                            placeholder="Catatan atau deskripsi file..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[100px] resize-none"
                        />
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Tags <span className="text-muted-foreground font-normal">(opsional)</span>
                        </Label>
                        <Input
                            placeholder="Contoh: banner, event, 2026"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="h-11"
                        />
                        <p className="text-xs text-muted-foreground">
                            Pisahkan dengan koma untuk memudahkan pencarian
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pb-8">
                <Button
                    variant="outline"
                    onClick={() => navigate('/content-database')}
                    disabled={isUploading}
                >
                    Batal
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={isUploading || (!isEditMode && uploadFiles.length === 0)}
                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 min-w-[160px]"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {isEditMode ? 'Menyimpan...' : `Uploading ${completedCount}/${uploadFiles.length}...`}
                        </>
                    ) : (
                        <>
                            {isEditMode ? <Save className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            {isEditMode ? 'Simpan Perubahan' : `Upload ${uploadFiles.length > 0 ? uploadFiles.length + ' File' : 'File'}`}
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
