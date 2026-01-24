import React, { useState, useRef, useEffect } from 'react'
import styles from './Avatar.module.sass'

interface AvatarProps {
  src?: string
  alt?: string
  size?: 'sm' | 'header' | 'md' | 'lg' | 'xl' | 'xxl'
  editable?: boolean
  onChange?: (file: File | null) => void
  placeholder?: string
  className?: string
}

const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  editable = false,
  onChange,
  placeholder = 'Upload',
  className
}) => {
  const [preview, setPreview] = useState<string | null>(src || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync preview with src prop when it changes (e.g., async load)
  useEffect(() => {
    if (src) {
      setPreview(src)
    }
  }, [src])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
    onChange?.(file)
  }

  const handleClick = () => {
    if (editable) {
      fileInputRef.current?.click()
    }
  }

  const sizeClasses = {
    sm: styles.sm,
    header: styles.header,
    md: styles.md,
    lg: styles.lg,
    xl: styles.xl,
    xxl: styles.xxl
  }

  return (
    <div className={`${styles.avatar} ${sizeClasses[size]} ${editable ? styles.editable : ''} ${className || ''}`.trim()}>
      <div
        className={styles.avatarImage}
        onClick={handleClick}
        style={{ backgroundImage: preview ? `url(${preview})` : undefined }}
        role={editable ? 'button' : undefined}
        tabIndex={editable ? 0 : undefined}
        aria-label={editable ? 'Upload image' : alt}
      >
        {!preview && (
          <div className={styles.placeholder}>
            <CameraIcon />
            <span>{placeholder}</span>
          </div>
        )}
        {editable && preview && (
          <div className={styles.overlay}>
            <CameraIcon />
          </div>
        )}
      </div>
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
      )}
    </div>
  )
}

export default Avatar
