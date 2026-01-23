import { InputHTMLAttributes, forwardRef } from 'react'
import styles from './Input.module.sass'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label?: string
  error?: string
  hint?: string
  prefix?: string
  id: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, id, className, ...rest }, ref) => {
    const inputClasses = [
      styles.input,
      error && styles.inputError,
      prefix && styles.inputWithPrefix,
      className
    ].filter(Boolean).join(' ')

    const describedBy = [
      hint && `${id}-hint`,
      error && `${id}-error`
    ].filter(Boolean).join(' ') || undefined

    return (
      <div className={styles.inputWrapper}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}
        {prefix ? (
          <div className={styles.inputContainer}>
            <span className={styles.prefix}>{prefix}</span>
            <input
              ref={ref}
              id={id}
              className={inputClasses}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={describedBy}
              {...rest}
            />
          </div>
        ) : (
          <input
            ref={ref}
            id={id}
            className={inputClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            {...rest}
          />
        )}
        {hint && !error && (
          <span id={`${id}-hint`} className={styles.hint}>
            {hint}
          </span>
        )}
        {error && (
          <span id={`${id}-error`} className={styles.error} role="alert">
            {error}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
