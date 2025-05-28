import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  position: relative;
  width: 100%;
`

const InputBox = styled.input`
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
`

const Dropdown = styled.div`
  position: absolute;
  width: 100%;
  background: white;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
`

const DropdownItem = styled.div<{ selected: boolean }>`
  padding: 0.5rem;
  cursor: pointer;
  background-color: ${({ selected }) => (selected ? '#f0f0f0' : 'white')};

  &:hover {
    background-color: #f0f0f0;
  }
`

const SelectedItemList = styled.div`
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const SelectedItem = styled.div`
  background: #e0e0e0;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #555;
  font-size: 1rem;
  cursor: pointer;
  line-height: 1;
`

type SearchDropdownProps = {
    data: string[],
    label: string
    onChange: any, value: any
}

export const SearchableDropdown = ({ data, label, onChange, value }: SearchDropdownProps) => {
    const [input, setInput] = useState('')
    const [filtered, setFiltered] = useState<string[]>([])
    const [dropdownVisible, setDropdownVisible] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)

    const inputRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (input.trim() === '') {
            setFiltered([])
            setDropdownVisible(false)
        } else {
            const inputUpper = input.toUpperCase()
            const matches = data.filter(
                (item) =>
                    item.toUpperCase().includes(inputUpper) &&
                    !value.includes(item),
            )
            if (!matches.includes(input)) {
                matches.unshift(input)
            }
            setFiltered(matches.slice(0, 10))
            setDropdownVisible(matches.length > 0)
        }
    }, [input, data, value])

    useEffect(() => {
        const el = inputRef.current
        if (!el) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!dropdownVisible || filtered.length === 0) return

            if (e.key === 'ArrowDown') {
                setSelectedIndex((prev) => (prev + 1) % filtered.length)
            } else if (e.key === 'ArrowUp') {
                setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length)
            } else if (e.key === 'Enter') {
                if (filtered[selectedIndex]) {
                    const item = filtered[selectedIndex]
                    if (!value.includes(item)) {
                        onChange([...value, item])
                    }
                    setInput('')
                    setDropdownVisible(false)
                    setSelectedIndex(-1)
                }
            }
        }

        el.addEventListener('keydown', handleKeyDown)
        return () => el.removeEventListener('keydown', handleKeyDown)
    }, [filtered, dropdownVisible, selectedIndex, value])

    const handleSelectItem = (item: string) => {
        if (!value.includes(item)) {
            onChange([...value, item])
        }
        setInput('')
        setDropdownVisible(false)
    }

    const handleRemoveItem = (item: string) => {
        onChange(value.filter((i: any) => i !== item))
    }

    return (
        <Container>
            <InputBox
                ref={inputRef}
                value={input}
                placeholder={label}
                onChange={(e) => {
                    setInput(e.target.value)
                    setSelectedIndex(0)
                }}
                onFocus={() => {
                    if (filtered.length > 0) setDropdownVisible(true)
                }}
                onBlur={() => setTimeout(() => setDropdownVisible(false), 100)}
            />

            {dropdownVisible && filtered.length > 0 && (
                <Dropdown>
                    {filtered.map((item, idx) => (
                        <DropdownItem
                            key={item}
                            selected={idx === selectedIndex}
                            onMouseEnter={() => {
                                setSelectedIndex(idx)
                            }}
                            onMouseDown={() => handleSelectItem(item)}
                        >
                            {item}
                        </DropdownItem>
                    ))}
                </Dropdown>
            )}

            {value.length > 0 && (
                <SelectedItemList>
                    {value.map((item: any) => (
                        <SelectedItem key={item}>
                            {item}
                            <RemoveButton onClick={() => handleRemoveItem(item)}>&times;</RemoveButton>
                        </SelectedItem>
                    ))}
                </SelectedItemList>
            )}
        </Container>
    )
}
