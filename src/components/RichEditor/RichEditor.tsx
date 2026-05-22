import { useEffect, useRef } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'

export const RichEditor = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isFirstMount = useRef(true)

  useEffect(() => {
    // Defensively handle cases where 'value' might not be a string
    const safeValue = typeof value === 'string' ? value : ''
    
    // Set content on initial mount or when value actually changes from outside
    if (editorRef.current && (isFirstMount.current || (editorRef.current.innerHTML !== safeValue && document.activeElement !== editorRef.current))) {
      editorRef.current.innerHTML = safeValue
      isFirstMount.current = false
    }
  }, [value])

  const handleCommand = (command: string, arg: string | undefined = undefined) => {
    document.execCommand(command, false, arg)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleLink = () => {
    const url = prompt('Enter URL:')
    if (url) handleCommand('createLink', url)
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        handleCommand('insertImage', dataUrl)
      }
      reader.readAsDataURL(file)
    }
    // Reset input
    e.target.value = ''
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-primary/20 transition-all flex flex-col min-h-[300px] bg-white">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />
      <div className="bg-[#f8fafc] border-b border-gray-200 p-2 flex items-center gap-1 shrink-0">
        <div className="flex items-center gap-0.5 px-1">
          <button type="button" onClick={() => handleCommand('bold')} className="p-1.5 hover:bg-gray-200 rounded text-[#475569] transition-colors" title="Bold"><Bold className="w-4 h-4" /></button>
          <button type="button" onClick={() => handleCommand('italic')} className="p-1.5 hover:bg-gray-200 rounded text-[#475569] transition-colors" title="Italic"><Italic className="w-4 h-4" /></button>
          <button type="button" onClick={() => handleCommand('underline')} className="p-1.5 hover:bg-gray-200 rounded text-[#475569] transition-colors" title="Underline"><Underline className="w-4 h-4" /></button>
        </div>
        <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
        <div className="flex items-center gap-0.5 px-1">
          <button type="button" onClick={() => handleCommand('insertUnorderedList')} className="p-1.5 hover:bg-gray-200 rounded text-[#475569] transition-colors" title="Bullet List"><List className="w-4 h-4" /></button>
          <button type="button" onClick={() => handleCommand('insertOrderedList')} className="p-1.5 hover:bg-gray-200 rounded text-[#475569] transition-colors" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
        </div>
        <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
        <div className="flex items-center gap-0.5 px-1">
          <button type="button" onClick={handleLink} className="p-1.5 hover:bg-gray-200 rounded text-[#475569] transition-colors" title="Insert Link"><LinkIcon className="w-4 h-4" /></button>
          <button type="button" onClick={handleImageClick} className="p-1.5 hover:bg-gray-200 rounded text-[#475569] transition-colors" title="Insert Image"><ImageIcon className="w-4 h-4" /></button>
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onBlur={(e) => onChange(e.currentTarget.innerHTML)}
        className="w-full flex-1 p-4 text-[14px] outline-none min-h-[250px] text-[#475569] leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
        data-placeholder={placeholder}
      />
    </div>
  )
}
