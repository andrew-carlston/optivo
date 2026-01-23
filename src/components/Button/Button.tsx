import { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.sass'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost'
  children: React.ReactNode
}

export default function Button({
  variant = 'default',
  children,
  type = 'button',
  disabled = false,
  onClick,
  className,
  ...rest
}: ButtonProps) {
  const variantClass = variant === 'ghost' ? styles.ghost : styles.default

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${styles.button} ${variantClass} ${className || ''}`.trim()}
      {...rest}
    >
      {children}
    </button>
  )
}
