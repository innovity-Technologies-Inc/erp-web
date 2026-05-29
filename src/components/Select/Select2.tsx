import { useMemo } from 'react'
import ReactSelect from 'react-select'
import type { GroupBase, Props } from 'react-select'
import { clsx } from 'clsx'

export interface Option {
  value: string | number
  label: string
}

export interface Select2Props extends Omit<Props<Option, boolean, GroupBase<Option>>, 'onChange' | 'value'> {
  options: Option[]
  value?: string | number | null | any[]
  onChange?: (value: any, option: any) => void
  isMulti?: boolean
  error?: string
  className?: string
  rounded?: 'full' | 'md' | 'lg'
  size?: 'sm' | 'md'
  variant?: 'solid' | 'outline' | 'ghost'
  menuPortalTarget?: HTMLElement | null
}

export const Select2 = ({
  options,
  value,
  onChange,
  isMulti = false,
  error,
  className,
  rounded = 'lg',
  size = 'md',
  variant = 'outline',
  menuPortalTarget = typeof document !== 'undefined' ? document.body : undefined,
  menuPosition = 'fixed',
  filterOption,
  ...rest
}: Select2Props) => {
  // Find the selected option object based on the value string/number
  const selectedOption = useMemo(() => {
    if (value === undefined || value === null || value === '') return isMulti ? [] : null

    if (isMulti) {
      const valArray = Array.isArray(value) ? value : [value]
      return options.filter((opt) => 
        valArray.some(v => String(v) === String(opt.value))
      )
    }

    return options.find((opt) => String(opt.value) === String(value)) || null
  }, [options, value, isMulti])

  const handleChange = (selected: any) => {
    if (onChange) {
      if (isMulti) {
        onChange(
          selected ? selected.map((s: Option) => s.value) : [],
          selected
        )
      } else {
        onChange(selected ? selected.value : '', selected)
      }
    }
  }

  return (
    <div className={clsx("relative min-w-[100px]", className)}>
      <ReactSelect
        options={options}
        value={selectedOption}
        onChange={handleChange}
        isMulti={isMulti}
        menuPortalTarget={menuPortalTarget}
        menuPosition={menuPosition}
        unstyled
        filterOption={filterOption || (rest.onInputChange ? () => true : undefined)}
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        }}
        classNames={{
          control: (state) =>
            clsx(
              'text-[13px] font-medium transition-all flex items-center',
              variant === 'ghost' ? 'bg-transparent border-transparent px-1 min-h-0 py-0.5 hover:bg-gray-50' : 'border px-3',
              rounded === 'full' ? 'rounded-full' : rounded === 'lg' ? 'rounded-lg' : 'rounded-md',
              variant !== 'ghost' && (size === 'sm' ? 'min-h-[28px] text-[11px]' : 'min-h-[38px]'),
              variant === 'solid' && 'bg-[#f8fafc] border-gray-100',
              variant === 'outline' && 'bg-white border-gray-200',
              state.isFocused && variant !== 'ghost'
                ? 'border-primary ring-1 ring-primary/30 bg-white' 
                : variant !== 'ghost' ? 'hover:border-gray-300' : '',
              error && 'border-rose-500 ring-rose-500/10',
              state.isDisabled && 'opacity-50 cursor-not-allowed bg-gray-50'
            ),
          placeholder: () => 'text-gray-400',
          singleValue: () => variant === 'ghost' ? 'text-primary text-[14px]' : 'text-[#475569]',
          multiValue: () => 'bg-gray-100 rounded-md px-2 py-0.5 text-xs text-gray-700 mr-1 flex items-center',
          multiValueLabel: () => 'mr-1',
          multiValueRemove: () => 'hover:bg-rose-100 hover:text-rose-600 rounded cursor-pointer',
          menu: () => 'bg-white mt-1 border border-gray-200 rounded-lg shadow-xl overflow-hidden z-[9999] text-[13px]',
          menuList: () => 'p-1 custom-scrollbar max-h-60',
          menuPortal: () => 'z-[9999]',
          option: (state) =>
            clsx(
              'px-3 py-2 cursor-pointer transition-colors rounded-md',
              state.isSelected ? 'bg-primary text-white font-medium' :
              state.isFocused ? 'bg-[#f1f5f9] text-gray-900' : 'text-gray-700 hover:bg-[#f8fafc]'
            ),
          indicatorsContainer: () => 'text-gray-400 gap-1',
          indicatorSeparator: () => 'hidden',
          dropdownIndicator: (state) => clsx('transition-transform cursor-pointer hover:text-gray-600', state.selectProps.menuIsOpen && 'rotate-180', variant === 'ghost' && 'scale-75'),
          clearIndicator: () => 'hover:text-rose-500 cursor-pointer',
          input: () => 'text-gray-700 m-0 p-0',
          valueContainer: () => 'gap-1 p-0 m-0',
        }}
        {...rest}
      />
      {error && <span className="text-rose-500 text-xs mt-1 block">{error}</span>}
    </div>
  )
}
