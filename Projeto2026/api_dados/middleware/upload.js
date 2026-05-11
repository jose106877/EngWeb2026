const multer = require('multer')
const path = require('path')
const fs = require('fs')

function resolveMediaRoot()
{
    const candidates =
    [
        path.join(__dirname, '../media'),
        path.join(__dirname, '../../media')
    ]

    return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0]
}


const TIPOS_PERMITIDOS =
{
    imagem:
    {
        mimetypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize:   10 * 1024 * 1024   // 10MB
    },
    pdf:
    {
        mimetypes: ['application/pdf'],
        maxSize:   40 * 1024 * 1024   // 40MB
    }
}


const createUpload = (subfolder, type = 'imagem') =>
{
    const permitidos = TIPOS_PERMITIDOS[type]

    const storage = multer.diskStorage
    ({
        destination: (req, file, cb) =>
        {
            const dir = path.join(resolveMediaRoot(), subfolder)
            if(!fs.existsSync(dir))
                fs.mkdirSync(dir, { recursive: true })
            cb(null, dir)
        },
        filename: (req, file, cb) =>
        {
            cb(null, Date.now() + path.extname(file.originalname))
        }
    })

    return multer
    ({
        storage,
        limits:
        {
            fileSize: permitidos.maxSize
        },
        fileFilter: (req, file, cb) =>
        {
            cb(null, permitidos.mimetypes.includes(file.mimetype))
        }
    })
}


module.exports = createUpload
