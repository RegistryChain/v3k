import { Input, InputGroup, Label, Select, TextArea } from './AgentModalStyles'

type FormInputProps = {
  type?: 'text' | 'select' | 'textarea'
  label: string
  value: string
  onChange: (value: string) => void
  options?: string[]
  placeholder?: string
  rows?: number
}

export const FormInput = ({
  type = 'text',
  label,
  value,
  onChange,
  options,
  placeholder,
  rows = 1,
}: FormInputProps) => {
  let inputElement = null
  if (type === 'select') {
    inputElement = (
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </Select>
    )
  } else if (type === 'textarea') {
    inputElement = (
      <TextArea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )
  } else {
    inputElement = (
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )
  }

  return (
    <InputGroup>
      <Label>{label}</Label>
      {inputElement}
    </InputGroup>
  )
}
