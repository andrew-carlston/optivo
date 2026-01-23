import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styles from './Dropdown.module.sass'

interface DropdownOption {
  value: string
  label: string
  disabled?: boolean
}

interface DropdownProps {
  options: DropdownOption[]
  value?: string
  placeholder?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
  searchable?: boolean
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  placeholder = 'Select an option',
  onChange,
  disabled = false,
  className,
  searchable = true
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0, openUpward: false })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(option => option.value === value)

  // Estimate menu height (search + options, capped at max-height)
  const estimateMenuHeight = useCallback(() => {
    const optionHeight = 36 // approximate height per option
    const searchHeight = options.length > 5 ? 44 : 0 // search wrapper height
    const padding = 16 // top/bottom padding
    const maxHeight = 200 // matches CSS max-height
    const contentHeight = Math.min(options.length * optionHeight, maxHeight)
    return searchHeight + contentHeight + padding
  }, [options.length])

  // Calculate menu position when opening
  const updateMenuPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const menuHeight = estimateMenuHeight()
      const spaceBelow = window.innerHeight - rect.bottom - 16 // 16px margin from viewport edge
      const spaceAbove = rect.top - 16
      const gap = 8

      // Open upward if not enough space below but enough above
      const openUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow

      setMenuPosition({
        top: openUpward ? rect.top - gap : rect.bottom + gap,
        left: rect.left,
        width: rect.width,
        openUpward
      })
    }
  }, [estimateMenuHeight])

  const filteredOptions = search
    ? options.filter(option =>
        option.label.toLowerCase().includes(search.toLowerCase())
      )
    : options

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target)
      const clickedOutsideMenu = menuRef.current && !menuRef.current.contains(target)

      if (clickedOutsideDropdown && clickedOutsideMenu) {
        setIsOpen(false)
        setSearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update position on open and on scroll/resize
  useEffect(() => {
    if (isOpen) {
      updateMenuPosition()

      const handleScrollOrResize = () => updateMenuPosition()
      window.addEventListener('scroll', handleScrollOrResize, true)
      window.addEventListener('resize', handleScrollOrResize)

      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true)
        window.removeEventListener('resize', handleScrollOrResize)
      }
    }
  }, [isOpen, updateMenuPosition])

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
    // Reset highlighted index when opening
    if (isOpen) {
      const currentIndex = filteredOptions.findIndex(opt => opt.value === value)
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0)
    }
  }, [isOpen, searchable])

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1)
  }, [search])

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionsRef.current) {
      const optionElements = optionsRef.current.querySelectorAll('button')
      if (optionElements[highlightedIndex]) {
        optionElements[highlightedIndex].scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => {
          const nextIndex = prev + 1
          // Skip disabled options
          let idx = nextIndex
          while (idx < filteredOptions.length && filteredOptions[idx]?.disabled) {
            idx++
          }
          return idx < filteredOptions.length ? idx : prev
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => {
          const nextIndex = prev - 1
          // Skip disabled options
          let idx = nextIndex
          while (idx >= 0 && filteredOptions[idx]?.disabled) {
            idx--
          }
          return idx >= 0 ? idx : prev
        })
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex] && !filteredOptions[highlightedIndex].disabled) {
          handleSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearch('')
        break
      case 'Tab':
        setIsOpen(false)
        setSearch('')
        break
    }
  }

  const handleSelect = (option: DropdownOption) => {
    if (!option.disabled) {
      onChange?.(option.value)
      setIsOpen(false)
      setSearch('')
    }
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (isOpen) {
        setSearch('')
      }
    }
  }

  return (
    <div
      ref={dropdownRef}
      className={`${styles.dropdown} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''} ${className || ''}`.trim()}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={handleToggle}
        disabled={disabled}
      >
        <span className={selectedOption ? styles.selected : styles.placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`${styles.arrow} ${isOpen ? styles.rotated : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className={`${styles.menu} ${menuPosition.openUpward ? styles.menuUpward : ''}`}
          style={{
            position: 'fixed',
            ...(menuPosition.openUpward
              ? { bottom: window.innerHeight - menuPosition.top, left: menuPosition.left, width: menuPosition.width }
              : { top: menuPosition.top, left: menuPosition.left, width: menuPosition.width }
            ),
          }}
        >
          {searchable && options.length > 5 && (
            <div className={styles.searchWrapper}>
              <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className={styles.options} ref={optionsRef}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.option} ${option.disabled ? styles.optionDisabled : ''} ${option.value === value ? styles.optionSelected : ''} ${index === highlightedIndex ? styles.optionHighlighted : ''}`.trim()}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  disabled={option.disabled}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className={styles.noResults}>No results found</div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default Dropdown
