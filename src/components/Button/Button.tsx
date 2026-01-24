import { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.sass'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
  children: React.ReactNode
}

export default function Button({
  variant = 'default',
  size = 'md',
  active = false,
  children,
  type = 'button',
  disabled = false,
  onClick,
  className,
  ...rest
}: ButtonProps) {
  const variantClass = variant === 'ghost' ? styles.ghost : variant === 'danger' ? styles.danger : styles.default
  const sizeClass = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : ''
  const activeClass = active ? styles.active : ''

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${styles.button} ${variantClass} ${sizeClass} ${activeClass} ${className || ''}`.trim()}
      {...rest}
    >
      {children}
    </button>
  )
}
